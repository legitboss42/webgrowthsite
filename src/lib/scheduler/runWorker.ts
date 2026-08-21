import { absoluteUrl } from "@/lib/site";
import { isTikTokTokenExpiringSoon, refreshTikTokTokens, type TikTokConnectionRecord } from "@/lib/tiktok";
import { decryptTikTokTokens } from "./crypto";
import { encryptTikTokTokens } from "./crypto";
import { getSchedulerConfig } from "./config";
import { createSupabaseMediaStorage } from "./storage";
import { createSchedulerSupabaseClient } from "./supabase";
import { createTikTokSchedulerClient, type TikTokPrivacyLevel } from "./tiktokClient";
import { processClaimedPost, type PublishingContext } from "./worker";

type ClaimedPost = { id: string; user_id: string; kind: "PHOTO" | "VIDEO"; title: string; caption: string; approval_id: string };
type MediaRow = { position: number; media_assets: { id: string; storage_path: string; original_filename: string; article_slug: string | null } };

export async function runPublishingWorker(now = new Date()) {
  const config = getSchedulerConfig();
  if (!config.directPostEnabled) return { claimed: 0, submitted: 0, failed: 0, disabled: true };
  const supabase = createSchedulerSupabaseClient();
  const { data: claimed, error } = await supabase.rpc("claim_due_tiktok_posts", { p_now: now.toISOString(), p_limit: 10 });
  if (error) throw new Error(`Unable to claim due TikTok posts (${error.code}).`);
  const posts = (claimed || []) as ClaimedPost[];
  let submitted = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const [{ data: connection }, { data: approval }, { data: media }] = await Promise.all([
        supabase.from("tiktok_connections").select("encrypted_tokens,scopes,access_expires_at,refresh_expires_at").eq("user_id", post.user_id).single(),
        supabase.from("post_approvals").select("id,fingerprint,snapshot,invalidated_at").eq("id", post.approval_id).single(),
        supabase.from("post_media").select("position,media_assets!inner(id,storage_path,original_filename,article_slug)").eq("post_id", post.id).order("position"),
      ]);
      const scopes = connection?.scopes || [];
      const tokens = connection ? decryptTikTokTokens(connection.encrypted_tokens) : null;
      if (!tokens || !scopes.includes("video.publish") || !approval || approval.invalidated_at || !media?.length) {
        throw new Error("Publishing authorization or approval is no longer valid.");
      }
      let activeTokens = tokens;
      if (tokens.openId && tokens.scope && tokens.connectedAt && tokens.tokenType && tokens.expiresAt && tokens.refreshExpiresAt) {
        const record = tokens as TikTokConnectionRecord;
        if (isTikTokTokenExpiringSoon(record)) {
          const refreshed = await refreshTikTokTokens(record);
          if (!refreshed.ok) throw new Error(refreshed.needsReconnect ? "Reconnect TikTok before publishing." : refreshed.message);
          activeTokens = refreshed.record;
          await supabase.from("tiktok_connections").update({
            encrypted_tokens: encryptTikTokTokens(refreshed.record), access_expires_at: refreshed.record.expiresAt,
            refresh_expires_at: refreshed.record.refreshExpiresAt, scopes: refreshed.record.scope.split(",").map((scope) => scope.trim()),
          }).eq("user_id", post.user_id);
        }
      } else if (new Date(connection!.access_expires_at).getTime() <= now.getTime() + 10 * 60 * 1000) {
        throw new Error("Reconnect TikTok to upgrade the stored publishing authorization.");
      }
      const { data: attempt, error: attemptError } = await supabase.from("publish_attempts").upsert({
        post_id: post.id, approval_id: approval.id, request_fingerprint: approval.fingerprint, status: "SUBMITTING",
      }, { onConflict: "post_id,approval_id,request_fingerprint", ignoreDuplicates: false }).select().single();
      if (attemptError || !attempt) throw new Error("Unable to reserve publishing attempt.");

      const storage = await createSupabaseMediaStorage();
      const stagedPaths: string[] = [];
      const mediaUrls: string[] = [];
      for (const row of media as unknown as MediaRow[]) {
        const asset = row.media_assets;
        if (asset.article_slug) {
          mediaUrls.push(absoluteUrl(`/api/tiktok/slides/${encodeURIComponent(asset.article_slug)}/?index=${row.position}`));
        } else {
          const staged = await storage.stage(attempt.id, asset.storage_path, asset.original_filename);
          stagedPaths.push(staged.stagingPath);
          mediaUrls.push(absoluteUrl(staged.publicPath));
          await supabase.from("media_staging_objects").insert({
            media_id: asset.id, attempt_id: attempt.id, storage_path: staged.stagingPath,
            expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
      const snapshot = approval.snapshot as PublishingContext["approval"];
      const client = createTikTokSchedulerClient();
      const result = await processClaimedPost({
        postId: post.id, attemptId: attempt.id, kind: post.kind, title: post.title, caption: post.caption,
        accessToken: activeTokens.accessToken, approval: snapshot, mediaUrls, publishId: attempt.publish_id,
      }, {
        publicPostingEnabled: config.publicPostingEnabled,
        async directPost(input) {
          const creator = await client.queryCreatorInfo(input.accessToken);
          const privacy = input.privacyLevel as TikTokPrivacyLevel;
          if (!creator.privacyLevelOptions.includes(privacy)) throw new Error("TikTok does not allow the selected privacy setting.");
          if (input.kind === "VIDEO") {
            const response = await client.directPostVideo({
              accessToken: input.accessToken, title: input.caption || input.title, privacyLevel: privacy,
              disableComment: !input.allowComment, disableDuet: !input.allowDuet, disableStitch: !input.allowStitch,
              videoUrl: input.mediaUrls[0]!,
            });
            return response.publishId;
          }
          const response = await client.directPostPhotos({
            accessToken: input.accessToken, title: input.title, description: input.caption, privacyLevel: privacy,
            disableComment: !input.allowComment, autoAddMusic: true, brandContentToggle: input.brandContent,
            brandOrganicToggle: input.brandOrganic, photoCoverIndex: 0, photoImages: input.mediaUrls,
          });
          return response.publishId;
        },
        async recordPublishId(attemptId, postId, publishId) {
          await Promise.all([
            supabase.from("publish_attempts").update({ publish_id: publishId, status: "PROCESSING", submitted_at: new Date().toISOString() }).eq("id", attemptId),
            supabase.from("scheduled_posts").update({ publish_id: publishId, status: "PROCESSING" }).eq("id", postId),
          ]);
        },
      });
      if (result.status === "PROCESSING") submitted += 1;
      void stagedPaths;
    } catch (workerError) {
      failed += 1;
      await supabase.from("scheduled_posts").update({ status: "NEEDS_ATTENTION" }).eq("id", post.id);
      await supabase.from("scheduler_audit_log").insert({
        actor_user_id: post.user_id, target_type: "scheduled_post", target_id: post.id,
        event_type: "PUBLISH_FAILED", metadata: { message: workerError instanceof Error ? workerError.message : "Unknown failure" },
      });
    }
  }
  return { claimed: posts.length, submitted, failed, disabled: false };
}
