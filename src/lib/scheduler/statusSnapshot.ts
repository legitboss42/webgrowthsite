import { isPostStatus, type PostStatus } from "./types";

export type PublicStatusSnapshot = {
  status: PostStatus;
  publishedAt: string | null;
  failureCode: string | null;
  retryEligible: boolean;
  nextRetryAt: string | null;
  nextPollAfterMs: number | null;
};

const SAFE_FAILURE_CODES = new Set([
  "TIKTOK_RECONNECT_REQUIRED",
  "TIKTOK_MEDIA_REJECTED",
  "MEDIA_VALIDATION_STALE",
  "UNSUPPORTED_MEDIA",
  "CREATOR_SETTINGS_CHANGED",
  "PRIVACY_MISMATCH",
  "TIKTOK_QUOTA_EXCEEDED",
  "DAILY_POST_LIMIT_REACHED",
  "PUBLISH_RETRY_SCHEDULED",
  "PUBLISH_RECONCILIATION_REQUIRED",
  "TIKTOK_PUBLISH_FAILED",
  "PUBLISH_BLOCKED",
]);

export function sanitizeStatusFailureCode(value: unknown) {
  return typeof value === "string" && SAFE_FAILURE_CODES.has(value) ? value : null;
}

function safeTimestamp(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

export function createPublicStatusSnapshot(input: Record<string, unknown>): PublicStatusSnapshot | null {
  const status = typeof input.status === "string" ? input.status : "";
  if (!isPostStatus(status)) return null;
  return {
    status,
    publishedAt: status === "PUBLISHED" ? safeTimestamp(input.terminal_at) : null,
    failureCode: sanitizeStatusFailureCode(input.user_failure_code),
    retryEligible: input.retry_eligible === true,
    nextRetryAt: safeTimestamp(input.next_retry_at),
    nextPollAfterMs: ["CLAIMED", "SUBMITTING", "PROCESSING"].includes(status) ? 5_000 : null,
  };
}

export function parsePublicStatusSnapshot(input: unknown): PublicStatusSnapshot | null {
  if (!input || typeof input !== "object") return null;
  const payload = input as Record<string, unknown>;
  const status = typeof payload.status === "string" ? payload.status : "";
  if (!isPostStatus(status)) return null;
  return {
    status,
    publishedAt: status === "PUBLISHED" ? safeTimestamp(payload.publishedAt) : null,
    failureCode: sanitizeStatusFailureCode(payload.failureCode),
    retryEligible: payload.retryEligible === true,
    nextRetryAt: safeTimestamp(payload.nextRetryAt),
    nextPollAfterMs: ["CLAIMED", "SUBMITTING", "PROCESSING"].includes(status) ? 5_000 : null,
  };
}
