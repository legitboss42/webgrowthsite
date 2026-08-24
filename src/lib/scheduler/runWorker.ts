import { absoluteUrl } from "@/lib/site";
import { isTikTokTokenExpiringSoon, refreshTikTokTokens, type TikTokConnectionRecord } from "@/lib/tiktok";
import { getSchedulerConfig } from "./config";
import { decryptTikTokTokens, encryptTikTokTokens } from "./crypto";
import { canMutateSchedulerContent } from "./media";
import { createSupabaseSchedulerOperations } from "./operations";
import {
  assessPublishReadiness,
  buildWorkerFailureState,
  classifyPublishFailure,
  createPublishingRpcStore,
  nonRetryablePublishError,
  planCurrentAttempt,
  SchedulerPublishError,
  type PublishingRpcClient,
  type RetryAttempt,
} from "./retry";
import { createSupabaseMediaStorage } from "./storage";
import { createSchedulerSupabaseClient } from "./supabase";
import { createTikTokSchedulerClient, type TikTokPrivacyLevel } from "./tiktokClient";
import { VIDEO_VALIDATION_VERSION } from "./videoValidation";
import { processClaimedPost, processPostsIndependently, runGatedPublishingCycle, runWorkerCycle, type PublishingContext } from "./worker";

type ClaimedPost = {
  id: string;
  user_id: string;
  kind: "PHOTO" | "VIDEO";
  title: string;
  caption: string;
  approval_id: string;
  claim_token: string;
};

type AttemptRow = {
  id: string;
  approval_id: string;
  request_fingerprint: string;
  attempt_number: number;
  status: string;
  publish_id: string | null;
  error_code: string | null;
};

type MediaRow = {
  position: number;
  media_assets: {
    id: string;
    storage_path: string;
    original_filename: string;
    article_slug: string | null;
    validation_status: string;
    validation_version: string | null;
    duration_seconds: number | null;
  };
};

function toRetryAttempt(row: AttemptRow): RetryAttempt {
  return {
    id: row.id,
    approvalId: row.approval_id,
    requestFingerprint: row.request_fingerprint,
    attemptNumber: row.attempt_number,
    status: row.status,
    publishId: row.publish_id,
    errorCode: row.error_code,
  };
}

async function executePublishingWorker(now = new Date()) {
  const config = getSchedulerConfig();
  if (!config.directPostEnabled) return { claimed: 0, submitted: 0, failed: 0, disabled: true };
  const supabase = createSchedulerSupabaseClient();
  const persistence = createPublishingRpcStore(supabase as unknown as PublishingRpcClient);
  const { data: claimed, error } = await supabase.rpc("claim_due_tiktok_posts", {
    p_now: now.toISOString(),
    p_limit: 10,
  });
  if (error) throw new Error(`Unable to claim due TikTok posts (${error.code}).`);
  const posts = (claimed || []) as ClaimedPost[];
  const currentAttempts = new Map<string, RetryAttempt>();
  let submitted = 0;
  let failed = 0;

  await processPostsIndependently(posts, async (post) => {
    const [
      { data: user, error: userError },
      { data: connection, error: connectionError },
      { data: approval, error: approvalError },
      { data: media, error: mediaError },
    ] = await Promise.all([
      supabase.from("scheduler_users")
        .select("status,suspended_at,deletion_requested_at,terms_version,privacy_version")
        .eq("id", post.user_id)
        .maybeSingle(),
      supabase.from("tiktok_connections")
        .select("encrypted_tokens,scopes,access_expires_at,refresh_expires_at")
        .eq("user_id", post.user_id)
        .maybeSingle(),
      supabase.from("post_approvals")
        .select("id,fingerprint,snapshot,invalidated_at")
        .eq("id", post.approval_id)
        .eq("post_id", post.id)
        .eq("user_id", post.user_id)
        .maybeSingle(),
      supabase.from("post_media")
        .select("position,media_assets!inner(id,storage_path,original_filename,article_slug,validation_status,validation_version,duration_seconds)")
        .eq("post_id", post.id)
        .order("position"),
    ]);

    if (userError || connectionError || approvalError || mediaError) {
      throw new Error("Unable to revalidate the publishing boundary.");
    }

    if (!user || !canMutateSchedulerContent({
      status: typeof user.status === "string" ? user.status : null,
      suspendedAt: typeof user.suspended_at === "string" ? user.suspended_at : null,
      deletionRequestedAt: typeof user.deletion_requested_at === "string" ? user.deletion_requested_at : null,
      termsVersion: typeof user.terms_version === "string" ? user.terms_version : null,
      privacyVersion: typeof user.privacy_version === "string" ? user.privacy_version : null,
    })) throw nonRetryablePublishError("SCHEDULER_ACCESS_REVOKED");

    const scopes = connection?.scopes || [];
    const tokens = connection ? decryptTikTokTokens(connection.encrypted_tokens) : null;
    if (!tokens || !scopes.includes("video.publish")) {
      throw nonRetryablePublishError("TIKTOK_CONNECTION_INVALID");
    }
    if (!approval || approval.invalidated_at || !media?.length) {
      throw nonRetryablePublishError("APPROVAL_CHANGED");
    }

    const mediaRows = media as unknown as MediaRow[];
    if (mediaRows.some((row) => row.media_assets.validation_status !== "VALID")) {
      throw nonRetryablePublishError("MEDIA_VALIDATION_STALE");
    }

    const { data: attemptRows, error: attemptReadError } = await supabase.from("publish_attempts")
      .select("id,approval_id,request_fingerprint,attempt_number,status,publish_id,error_code")
      .eq("post_id", post.id)
      .eq("approval_id", approval.id)
      .order("attempt_number", { ascending: false })
      .limit(1);
    if (attemptReadError) throw new Error("Unable to read the current publishing attempt.");
    const persistedAttempts = (attemptRows || []) as AttemptRow[];
    if (persistedAttempts[0] && persistedAttempts[0].request_fingerprint !== approval.fingerprint) {
      throw nonRetryablePublishError("APPROVAL_CHANGED");
    }
    const plan = planCurrentAttempt(
      persistedAttempts.map(toRetryAttempt),
      approval.id,
      approval.fingerprint,
    );
    if (plan.action === "ATTENTION") {
      if (plan.attempt) currentAttempts.set(post.id, plan.attempt);
      throw nonRetryablePublishError("ATTEMPT_STATE_UNCERTAIN");
    }

    let attempt = plan.attempt;
    if (plan.action === "CREATE") {
      const { data: inserted, error: insertError } = await supabase.from("publish_attempts").insert({
        post_id: post.id,
        approval_id: approval.id,
        request_fingerprint: approval.fingerprint,
        attempt_number: plan.attemptNumber,
        status: "SCHEDULED",
      }).select("id,approval_id,request_fingerprint,attempt_number,status,publish_id,error_code").single();
      if (insertError || !inserted) throw new Error("Unable to reserve the numbered publishing attempt.");
      attempt = toRetryAttempt(inserted as AttemptRow);
    }
    if (!attempt) throw nonRetryablePublishError("ATTEMPT_STATE_UNCERTAIN");
    currentAttempts.set(post.id, attempt);

    if (plan.action === "RECONCILE") {
      await persistence.recordPublishId({
        postId: post.id,
        userId: post.user_id,
        claimToken: post.claim_token,
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        publishId: attempt.publishId!,
        submittedAt: now.toISOString(),
      });
      submitted += 1;
      return "RECONCILE" as const;
    }

    let activeTokens = tokens;
    if (tokens.openId && tokens.scope && tokens.connectedAt && tokens.tokenType && tokens.expiresAt && tokens.refreshExpiresAt) {
      const record = tokens as TikTokConnectionRecord;
      if (isTikTokTokenExpiringSoon(record)) {
        const refreshed = await refreshTikTokTokens(record);
        if (!refreshed.ok) {
          if (refreshed.needsReconnect) throw nonRetryablePublishError("TIKTOK_RECONNECT_REQUIRED");
          throw new Error("TikTok token refresh is temporarily unavailable.");
        }
        activeTokens = refreshed.record;
        const { data: refreshedRows, error: refreshWriteError } = await supabase.from("tiktok_connections").update({
          encrypted_tokens: encryptTikTokTokens(refreshed.record),
          access_expires_at: refreshed.record.expiresAt,
          refresh_expires_at: refreshed.record.refreshExpiresAt,
          scopes: refreshed.record.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
        }).eq("user_id", post.user_id).eq("encrypted_tokens", connection!.encrypted_tokens).select("id");
        if (refreshWriteError || refreshedRows?.length !== 1) {
          throw new Error("TikTok token refresh could not be saved.");
        }
      }
    } else if (new Date(connection!.access_expires_at).getTime() <= now.getTime() + 10 * 60 * 1000) {
      throw nonRetryablePublishError("TIKTOK_RECONNECT_REQUIRED");
    }

    const snapshot = approval.snapshot as PublishingContext["approval"];
    const client = createTikTokSchedulerClient();

    const storage = await createSupabaseMediaStorage();
    const mediaUrls: string[] = [];
    for (const row of mediaRows) {
      const asset = row.media_assets;
      if (asset.article_slug) {
        mediaUrls.push(absoluteUrl(`/api/tiktok/slides/${encodeURIComponent(asset.article_slug)}/?index=${row.position}`));
      } else {
        const staged = await storage.stage(attempt.id, asset.storage_path, asset.original_filename);
        mediaUrls.push(absoluteUrl(staged.publicPath));
        const { error: stagingWriteError } = await supabase.from("media_staging_objects").insert({
          media_id: asset.id,
          attempt_id: attempt.id,
          storage_path: staged.stagingPath,
          expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
        if (stagingWriteError) throw new Error("Unable to record staged publishing media.");
      }
    }

    const [approvalRecheck, mediaRecheck] = await Promise.all([
      supabase.from("post_approvals")
        .select("id,fingerprint,invalidated_at")
        .eq("id", approval.id)
        .eq("post_id", post.id)
        .eq("user_id", post.user_id)
        .maybeSingle(),
      supabase.from("post_media")
        .select("position,media_assets!inner(id,storage_path,original_filename,article_slug,validation_status,validation_version,duration_seconds)")
        .eq("post_id", post.id)
        .order("position"),
    ]);
    if (approvalRecheck.error || mediaRecheck.error) {
      throw new Error("Unable to recheck publishing evidence.");
    }
    if (!approvalRecheck.data
      || approvalRecheck.data.invalidated_at
      || approvalRecheck.data.fingerprint !== approval.fingerprint) {
      throw nonRetryablePublishError("APPROVAL_CHANGED");
    }
    const currentMediaRows = (mediaRecheck.data || []) as unknown as MediaRow[];
    const creator = await client.queryCreatorInfo(activeTokens.accessToken);
    const submissionConfig = getSchedulerConfig();
    if (!submissionConfig.directPostEnabled) {
      throw new Error("TikTok Direct Post is temporarily unavailable.");
    }
    const readiness = assessPublishReadiness({
      kind: post.kind,
      approval: snapshot,
      media: currentMediaRows.map((row) => ({
        validationStatus: row.media_assets.validation_status,
        validationVersion: row.media_assets.validation_version,
        durationSeconds: row.media_assets.duration_seconds === null ? null : Number(row.media_assets.duration_seconds),
      })),
      creator,
      currentVideoValidationVersion: VIDEO_VALIDATION_VERSION,
      publicPostingEnabled: submissionConfig.publicPostingEnabled,
    });
    if (!readiness.ok) throw nonRetryablePublishError(readiness.errorCode);

    const result = await processClaimedPost({
      postId: post.id,
      userId: post.user_id,
      claimToken: post.claim_token,
      attemptId: attempt.id,
      approvalId: approval.id,
      requestFingerprint: approval.fingerprint,
      validationVersion: VIDEO_VALIDATION_VERSION,
      attemptNumber: attempt.attemptNumber,
      kind: post.kind,
      title: post.title,
      caption: post.caption,
      accessToken: activeTokens.accessToken,
      approval: snapshot,
      mediaUrls,
      publishId: attempt.publishId,
    }, {
      publicPostingEnabled: submissionConfig.publicPostingEnabled,
      beginSubmission(input) {
        return persistence.beginSubmission(input);
      },
      async directPost(input) {
        const privacy = input.privacyLevel as TikTokPrivacyLevel;
        if (input.kind === "VIDEO") {
          const response = await client.directPostVideo({
            accessToken: input.accessToken,
            title: input.caption || input.title,
            privacyLevel: privacy,
            disableComment: !input.allowComment,
            disableDuet: !input.allowDuet,
            disableStitch: !input.allowStitch,
            videoUrl: input.mediaUrls[0]!,
          });
          return response.publishId;
        }
        const response = await client.directPostPhotos({
          accessToken: input.accessToken,
          title: input.title,
          description: input.caption,
          privacyLevel: privacy,
          disableComment: !input.allowComment,
          autoAddMusic: true,
          brandContentToggle: input.brandContent,
          brandOrganicToggle: input.brandOrganic,
          photoCoverIndex: 0,
          photoImages: input.mediaUrls,
        });
        return response.publishId;
      },
      recordPublishId(input) {
        return persistence.recordPublishId(input);
      },
    });
    if (result.status === "PROCESSING") submitted += 1;
    return result.status;
  }, async (post, workerError) => {
    failed += 1;
    const attempt = currentAttempts.get(post.id);
    const knownPublishId = workerError instanceof SchedulerPublishError ? workerError.publishId : null;
    const failureAttempt = attempt && knownPublishId ? { ...attempt, publishId: knownPublishId } : attempt;
    const failure = failureAttempt ? buildWorkerFailureState(failureAttempt, workerError, now) : null;
    const classification = knownPublishId
      ? { kind: "AMBIGUOUS" as const, errorCode: "POST_ACCEPTANCE_AMBIGUOUS" }
      : classifyPublishFailure(workerError);
    const errorCode = failure?.errorCode || classification.errorCode;
    const failureRecorded = await persistence.recordFailure({
      postId: post.id,
      userId: post.user_id,
      claimToken: post.claim_token,
      attemptId: attempt?.id || null,
      attemptNumber: attempt?.attemptNumber || null,
      failureKind: classification.kind,
      errorCode,
      failedAt: now.toISOString(),
      publishId: knownPublishId,
    });
    if (!failureRecorded) throw new Error("Publishing failure state changed before it could be recorded.");
    const { error: auditError } = await supabase.from("scheduler_audit_log").insert({
      actor_user_id: post.user_id,
      target_type: "scheduled_post",
      target_id: post.id,
      event_type: "PUBLISH_FAILED",
      metadata: { errorCode },
    });
    if (auditError) throw new Error("Unable to record the publishing audit event.");
  });

  return { claimed: posts.length, submitted, failed, disabled: false };
}

export async function runPublishingWorker(now = new Date()) {
  return runGatedPublishingCycle(getSchedulerConfig().directPostEnabled, async () => {
    const operations = await createSupabaseSchedulerOperations();
    return runWorkerCycle(operations, () => executePublishingWorker(now), now);
  });
}
