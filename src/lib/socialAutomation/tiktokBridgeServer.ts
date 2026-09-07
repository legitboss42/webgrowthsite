import "server-only";

import { finalizeStoredSchedulerMedia } from "@/lib/scheduler/uploadFinalizationServer";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { VIDEO_VALIDATION_VERSION } from "@/lib/scheduler/videoValidation";
import { persistTikTokDraft } from "./tiktokBridgeStore";
import { parseOwnerOpenIds, selectOwnerSchedulerUser } from "./tiktokOwner";

function fail(operation: string, error?: { message?: string } | null): never {
  throw new Error(error?.message ? `${operation}: ${error.message}` : operation);
}

export async function resolveTikTokOwnerUserId() {
  const ownerOpenIds = parseOwnerOpenIds(process.env.OWNER_TIKTOK_OPEN_IDS);
  if (ownerOpenIds.length === 0) {
    throw new Error("TikTok owner account is not configured.");
  }

  const client = createSchedulerSupabaseClient();
  const { data, error } = await client
    .from("scheduler_users")
    .select("id,tiktok_open_id,status")
    .in("tiktok_open_id", ownerOpenIds)
    .eq("status", "ACTIVE");
  if (error) fail("Unable to resolve TikTok scheduler owner", error);

  const owner = selectOwnerSchedulerUser(
    (data ?? []) as Array<{ id: string; tiktok_open_id: string; status: string }>,
    ownerOpenIds
  );
  if (!owner) {
    throw new Error("Exactly one active configured TikTok scheduler owner is required.");
  }
  return owner.id;
}

export async function createBlogTikTokDraft(input: {
  userId?: string;
  articleSlug: string;
  storagePath: string;
  caption: string;
  checksum: string;
  byteSize: number;
  durationSeconds: number;
  title: string;
}) {
  const client = createSchedulerSupabaseClient();
  const userId = input.userId || (await resolveTikTokOwnerUserId());

  return persistTikTokDraft(
    {
      async findMediaByPath(storagePath) {
        const { data, error } = await client
          .from("media_assets")
          .select("id")
          .eq("user_id", userId)
          .eq("storage_path", storagePath)
          .maybeSingle();
        if (error) fail("Unable to read TikTok media asset", error);
        return data ? { id: String(data.id) } : null;
      },
      async findPostIdByMedia(mediaId) {
        const { data, error } = await client
          .from("post_media")
          .select("post_id")
          .eq("media_id", mediaId)
          .limit(1)
          .maybeSingle();
        if (error) fail("Unable to read TikTok post media link", error);
        return data?.post_id ? String(data.post_id) : null;
      },
      async insertMedia(row) {
        const { data, error } = await client.from("media_assets").insert(row).select("id").single();
        if (error || !data?.id) fail("Unable to create TikTok media asset", error);
        return { id: String(data.id) };
      },
      async finalizeMedia(mediaId, checksum) {
        const { data, error } = await client
          .from("media_assets")
          .select("validation_status,validation_version,article_slug")
          .eq("id", mediaId)
          .eq("user_id", userId)
          .maybeSingle();
        if (error) fail("Unable to read TikTok media validation state", error);
        if (!data) throw new Error("TikTok media asset is unavailable for validation.");

        if (
          data.validation_status === "VALID" &&
          data.validation_version === VIDEO_VALIDATION_VERSION &&
          data.article_slug == null
        ) {
          return;
        }
        if (data.article_slug != null) {
          throw new Error("TikTok automated video media is incorrectly marked as virtual article media.");
        }
        if (data.validation_status !== "PENDING") {
          throw new Error("TikTok automated video media does not have reusable validation state.");
        }

        const result = await finalizeStoredSchedulerMedia({
          userId,
          assetId: mediaId,
          checksum,
        });
        if (!result.ok) {
          throw new Error(`TikTok automated video validation failed: ${result.error}`);
        }
      },
      async insertPost(row) {
        const { data, error } = await client.from("scheduled_posts").insert(row).select("id").single();
        if (error || !data?.id) fail("Unable to create TikTok scheduled post", error);
        return { id: String(data.id) };
      },
      async linkPostMedia(postId, mediaId, position) {
        const { error } = await client.from("post_media").insert({
          post_id: postId,
          media_id: mediaId,
          position,
        });
        if (error) fail("Unable to link TikTok media to scheduled post", error);
      },
    },
    { ...input, userId }
  );
}
