const PROTECTED_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "NEEDS_APPROVAL",
  "FAILED_RETRYABLE",
  "NEEDS_ATTENTION",
]);

export type RetentionCleanupCandidate = {
  profile: "META" | "TIKTOK";
  retainedUntil: string | null;
  deletedAt: string | null;
  publicationStatuses: string[];
};

export function isRetentionCleanupEligible(
  candidate: RetentionCleanupCandidate,
  nowMs = Date.now()
) {
  if (candidate.deletedAt) return false;
  if (!candidate.retainedUntil) return false;

  const retainedUntilMs = Date.parse(candidate.retainedUntil);
  if (!Number.isFinite(retainedUntilMs) || retainedUntilMs > nowMs) return false;

  return !candidate.publicationStatuses.some((status) => PROTECTED_STATUSES.has(status));
}
