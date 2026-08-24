import { hasCurrentLegalAcceptance, isActiveSchedulerUser } from "./legal";
import { mapTikTokPublishStatus } from "./publishStatus";
import type { TikTokPrivacyLevel } from "./tiktokClient";

export const MAX_PUBLISH_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 60_000;
const RETRY_MAX_DELAY_MS = 15 * 60_000;

const SAFE_PRE_ACCEPTANCE_CODES = new Set([
  "PRE_ACCEPTANCE_INFRASTRUCTURE",
  "PRE_ACCEPTANCE_NETWORK",
]);

const TERMINAL_MEDIA_CODES = new Set([
  "DURATION_CHECK_FAILED",
  "FILE_FORMAT_CHECK_FAILED",
  "PHOTO_PROCESS_FAILED",
  "PHOTO_PULL_FAILED",
  "VIDEO_PROCESS_FAILED",
  "VIDEO_PULL_FAILED",
]);

const ACTIVE_ATTEMPT_STATUSES = new Set(["SCHEDULED", "SUBMITTING", "PROCESSING"]);

export type RetryAttempt = {
  id: string;
  approvalId: string;
  requestFingerprint: string;
  attemptNumber: number;
  status: string;
  publishId: string | null;
  errorCode: string | null;
};

export type RetryEligibility = "AUTOMATIC" | "USER" | "NONE";

export function classifyRetryEligibility(attempt: RetryAttempt): RetryEligibility {
  if (!Number.isSafeInteger(attempt.attemptNumber)
    || attempt.attemptNumber < 1
    || attempt.attemptNumber >= MAX_PUBLISH_ATTEMPTS) return "NONE";
  if (attempt.status === "FAILED_RETRYABLE"
    && !attempt.publishId
    && !!attempt.errorCode
    && SAFE_PRE_ACCEPTANCE_CODES.has(attempt.errorCode)) return "AUTOMATIC";
  if (attempt.status === "NEEDS_ATTENTION"
    && !!attempt.publishId
    && !!attempt.errorCode
    && TERMINAL_MEDIA_CODES.has(attempt.errorCode)) return "USER";
  return "NONE";
}

export function retryBackoffMs(attemptNumber: number) {
  const exponent = Math.max(0, Math.min(30, Math.floor(attemptNumber) - 1));
  return Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * (2 ** exponent));
}

export function nextAttemptNumber(attempts: Pick<RetryAttempt, "attemptNumber">[]) {
  return attempts.reduce((maximum, attempt) => Math.max(maximum, attempt.attemptNumber), 0) + 1;
}

export function planCurrentAttempt(
  attempts: RetryAttempt[],
  approvalId: string,
  requestFingerprint: string,
) {
  const matching = attempts
    .filter((attempt) => attempt.approvalId === approvalId && attempt.requestFingerprint === requestFingerprint)
    .sort((left, right) => right.attemptNumber - left.attemptNumber);
  const current = matching[0] || null;
  if (!current) return { action: "CREATE" as const, attempt: null, attemptNumber: 1 };
  if (current.publishId) {
    return { action: "RECONCILE" as const, attempt: current, attemptNumber: current.attemptNumber };
  }
  if (current.status === "SCHEDULED") {
    return { action: "USE" as const, attempt: current, attemptNumber: current.attemptNumber };
  }
  if (classifyRetryEligibility(current) === "AUTOMATIC") {
    return { action: "CREATE" as const, attempt: current, attemptNumber: nextAttemptNumber(matching) };
  }
  return { action: "ATTENTION" as const, attempt: current, attemptNumber: current.attemptNumber };
}

export type PublishFailureKind = "SAFE" | "AMBIGUOUS" | "NONE";
export type PublishFailurePhase = "PRE_ACCEPTANCE" | "PROVIDER_MUTATION";

export class SchedulerPublishError extends Error {
  readonly code: string;
  readonly kind: PublishFailureKind;
  readonly publishId: string | null;

  constructor(kind: PublishFailureKind, code: string, message: string, publishId: string | null = null) {
    super(message);
    this.name = "SchedulerPublishError";
    this.code = code;
    this.kind = kind;
    this.publishId = publishId;
  }
}

export function ambiguousPublishError(publishId: string | null = null) {
  return new SchedulerPublishError(
    "AMBIGUOUS",
    "POST_ACCEPTANCE_AMBIGUOUS",
    "TikTok publishing acceptance is uncertain; reconciliation is required.",
    publishId,
  );
}

export function nonRetryablePublishError(code: string, message = "Publishing policy is no longer satisfied.") {
  return new SchedulerPublishError("NONE", code, message);
}

export function classifyPublishFailure(error: unknown, phase: PublishFailurePhase = "PRE_ACCEPTANCE") {
  if (error instanceof SchedulerPublishError) {
    return { kind: error.kind, errorCode: error.code } as const;
  }
  return phase === "PROVIDER_MUTATION"
    ? { kind: "AMBIGUOUS" as const, errorCode: "POST_ACCEPTANCE_AMBIGUOUS" }
    : { kind: "SAFE" as const, errorCode: "PRE_ACCEPTANCE_INFRASTRUCTURE" };
}

type PublishReadinessInput = {
  kind: "PHOTO" | "VIDEO";
  approval: {
    privacyLevel: TikTokPrivacyLevel;
    allowComment: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
  };
  currentVideoValidationVersion: string;
  media: Array<{
    validationStatus: string;
    validationVersion: string | null;
    durationSeconds: number | null;
  }>;
  creator: {
    privacyLevelOptions: TikTokPrivacyLevel[];
    commentDisabled: boolean;
    duetDisabled: boolean;
    stitchDisabled: boolean;
    maxVideoPostDurationSeconds: number;
  };
  publicPostingEnabled: boolean;
};

export function assessPublishReadiness(input: PublishReadinessInput) {
  if (!input.media.length || input.media.some((media) => media.validationStatus !== "VALID")) {
    return { ok: false as const, errorCode: "MEDIA_VALIDATION_STALE" };
  }
  if (input.kind === "VIDEO") {
    const video = input.media.length === 1 ? input.media[0] : null;
    if (!video || video.validationVersion !== input.currentVideoValidationVersion) {
      return { ok: false as const, errorCode: "MEDIA_VALIDATION_STALE" };
    }
    if (!Number.isFinite(video.durationSeconds)
      || video.durationSeconds! <= 0
      || !Number.isFinite(input.creator.maxVideoPostDurationSeconds)
      || input.creator.maxVideoPostDurationSeconds <= 0
      || video.durationSeconds! > input.creator.maxVideoPostDurationSeconds) {
      return { ok: false as const, errorCode: "CREATOR_VIDEO_LIMIT_CHANGED" };
    }
  }

  const privacyLevel = input.publicPostingEnabled ? input.approval.privacyLevel : "SELF_ONLY";
  if (!input.creator.privacyLevelOptions.includes(privacyLevel)
    || (input.approval.allowComment && input.creator.commentDisabled)
    || (input.kind === "VIDEO" && input.approval.allowDuet && input.creator.duetDisabled)
    || (input.kind === "VIDEO" && input.approval.allowStitch && input.creator.stitchDisabled)) {
    return { ok: false as const, errorCode: "CREATOR_SETTINGS_CHANGED" };
  }
  return { ok: true as const, privacyLevel };
}

export function buildWorkerFailureState(
  attempt: RetryAttempt,
  error: unknown,
  now: Date,
  phase: PublishFailurePhase = "PRE_ACCEPTANCE",
) {
  if (attempt.publishId) {
    return {
      attempt: { status: "NEEDS_ATTENTION", error_code: "POST_ACCEPTANCE_AMBIGUOUS" },
      post: {
        status: "NEEDS_ATTENTION",
        retry_eligible: false,
        next_retry_at: null,
        user_failure_code: "PUBLISH_RECONCILIATION_REQUIRED",
        terminal_at: now.toISOString(),
      },
      errorCode: "POST_ACCEPTANCE_AMBIGUOUS",
    };
  }
  const failure = classifyPublishFailure(error, phase);
  if (failure.kind === "SAFE" && attempt.attemptNumber < MAX_PUBLISH_ATTEMPTS) {
    return {
      attempt: { status: "FAILED_RETRYABLE", error_code: failure.errorCode },
      post: {
        status: "FAILED_RETRYABLE",
        retry_eligible: true,
        next_retry_at: new Date(now.getTime() + retryBackoffMs(attempt.attemptNumber)).toISOString(),
        user_failure_code: "PUBLISH_RETRY_SCHEDULED",
        terminal_at: null,
      },
      errorCode: failure.errorCode,
    };
  }
  return {
    attempt: { status: "NEEDS_ATTENTION", error_code: failure.errorCode },
    post: {
      status: "NEEDS_ATTENTION",
      retry_eligible: false,
      next_retry_at: null,
      user_failure_code: failure.kind === "AMBIGUOUS" ? "PUBLISH_RECONCILIATION_REQUIRED" : "PUBLISH_BLOCKED",
      terminal_at: now.toISOString(),
    },
    errorCode: failure.errorCode,
  };
}

function normalizeTikTokFailureCode(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z0-9_]{1,80}$/.test(normalized) ? normalized : "TIKTOK_FAILED";
}

export function buildTerminalReconciliation(
  statusPayload: { status?: unknown; fail_reason?: unknown },
  completedAt: string,
) {
  const nextStatus = mapTikTokPublishStatus(String(statusPayload.status || ""));
  if (nextStatus === "PUBLISHED") {
    return {
      attempt: { status: "PUBLISHED", completed_at: completedAt, error_code: null },
      post: {
        status: "PUBLISHED",
        retry_eligible: false,
        next_retry_at: null,
        user_failure_code: null,
        terminal_at: completedAt,
      },
      outcome: "PUBLISHED" as const,
    };
  }

  const errorCode = normalizeTikTokFailureCode(statusPayload.fail_reason);
  if (TERMINAL_MEDIA_CODES.has(errorCode)) {
    return {
      attempt: { status: "NEEDS_ATTENTION", completed_at: completedAt, error_code: errorCode },
      post: {
        status: "FAILED_RETRYABLE",
        retry_eligible: true,
        next_retry_at: null,
        user_failure_code: "TIKTOK_MEDIA_REJECTED",
        terminal_at: null,
      },
      outcome: "FAILED" as const,
    };
  }

  return {
    attempt: { status: "NEEDS_ATTENTION", completed_at: completedAt, error_code: errorCode },
    post: {
      status: "NEEDS_ATTENTION",
      retry_eligible: false,
      next_retry_at: null,
      user_failure_code: "TIKTOK_PUBLISH_FAILED",
      terminal_at: completedAt,
    },
    outcome: "FAILED" as const,
  };
}

export function reconciliationWritesSucceeded(results: Array<{ error: unknown }>) {
  return results.length > 0 && results.every((result) => !result.error);
}

export type RetryRpcClient = {
  rpc(
    name: "create_safe_publish_retry",
    input: { p_post_id: string; p_user_id: string },
  ): PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};

export type RetryStore = {
  createSafePublishRetry(input: { postId: string; userId: string }): Promise<number | null>;
};

export function createRetryRpcStore(client: RetryRpcClient): RetryStore {
  return {
    async createSafePublishRetry(input) {
      const { data, error } = await client.rpc("create_safe_publish_retry", {
        p_post_id: input.postId,
        p_user_id: input.userId,
      });
      if (error) throw new Error("Scheduler retry database operation failed.");
      if (data === null) return null;
      if (!Number.isSafeInteger(data) || Number(data) < 1) {
        throw new Error("Scheduler retry database operation returned an invalid result.");
      }
      return Number(data);
    },
  };
}

type RetryBoundaryInput = {
  launch: { directPost: boolean };
  userId: string;
  user: {
    status: string | null;
    suspendedAt: string | null;
    deletionRequestedAt: string | null;
    termsVersion: string | null;
    privacyVersion: string | null;
  };
  post: {
    id: string;
    userId: string;
    status: string;
    approvalId: string | null;
    retryEligible: boolean;
    terminalAt: string | null;
  };
  approval: {
    id: string;
    postId: string;
    userId: string;
    fingerprint: string;
    invalidatedAt: string | null;
  } | null;
  attempt: RetryAttempt | null;
};

const retryConflict = () => ({
  ok: false as const,
  status: 409 as const,
  error: "This post is no longer eligible for retry.",
});

export async function retryPostAtBoundary(store: RetryStore, input: RetryBoundaryInput) {
  if (!input.launch.directPost) {
    return { ok: false as const, status: 503 as const, error: "TikTok Direct Post is temporarily unavailable." };
  }
  if (!isActiveSchedulerUser(input.user) || !hasCurrentLegalAcceptance(input.user)) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "Active scheduler access and current legal acceptance are required.",
    };
  }

  const { post, approval, attempt } = input;
  if (post.id.length === 0
    || post.userId !== input.userId
    || post.status !== "FAILED_RETRYABLE"
    || !post.retryEligible
    || !!post.terminalAt
    || !approval
    || approval.id !== post.approvalId
    || approval.postId !== post.id
    || approval.userId !== input.userId
    || !!approval.invalidatedAt
    || !attempt
    || attempt.approvalId !== approval.id
    || attempt.requestFingerprint !== approval.fingerprint
    || ACTIVE_ATTEMPT_STATUSES.has(attempt.status)
    || classifyRetryEligibility(attempt) === "NONE") return retryConflict();

  try {
    const attemptNumber = await store.createSafePublishRetry({ postId: post.id, userId: input.userId });
    if (attemptNumber === null || attemptNumber !== attempt.attemptNumber + 1) return retryConflict();
    return { ok: true as const, status: 200 as const, postId: post.id, attemptNumber };
  } catch {
    return { ok: false as const, status: 502 as const, error: "Unable to schedule retry." };
  }
}
