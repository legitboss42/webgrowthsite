const PROTECTED_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "NEEDS_APPROVAL",
  "FAILED_RETRYABLE",
  "NEEDS_ATTENTION",
]);

const TIKTOK_TERMINAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type RetentionCleanupCandidate = {
  profile: "META" | "TIKTOK";
  retainedUntil: string | null;
  deletedAt: string | null;
  publicationStatuses: string[];
  schedulerTerminalAt?: string | null;
};

export function isRetentionCleanupEligible(
  candidate: RetentionCleanupCandidate,
  nowMs = Date.now()
) {
  if (candidate.deletedAt) return false;
  if (!candidate.retainedUntil) return false;

  const retainedUntilMs = Date.parse(candidate.retainedUntil);
  if (!Number.isFinite(retainedUntilMs) || retainedUntilMs > nowMs) return false;
  if (candidate.publicationStatuses.some((status) => PROTECTED_STATUSES.has(status))) {
    return false;
  }

  if (candidate.profile === "TIKTOK") {
    const terminalAtMs = candidate.schedulerTerminalAt
      ? Date.parse(candidate.schedulerTerminalAt)
      : Number.NaN;
    if (!Number.isFinite(terminalAtMs)) return false;
    if (nowMs - terminalAtMs < TIKTOK_TERMINAL_RETENTION_MS) return false;
  }

  return true;
}
