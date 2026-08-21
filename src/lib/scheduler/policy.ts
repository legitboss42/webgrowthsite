import type { PostStatus } from "./types";

const transitions: Partial<Record<PostStatus, PostStatus[]>> = {
  DRAFT: ["NEEDS_CONNECTION", "NEEDS_APPROVAL"],
  NEEDS_CONNECTION: ["NEEDS_APPROVAL", "CANCELLED"],
  NEEDS_APPROVAL: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["CLAIMED", "CANCELLED", "NEEDS_APPROVAL", "NEEDS_CONNECTION"],
  CLAIMED: ["SUBMITTING", "FAILED_RETRYABLE", "NEEDS_ATTENTION"],
  SUBMITTING: ["PROCESSING", "FAILED_RETRYABLE", "NEEDS_ATTENTION"],
  PROCESSING: ["PUBLISHED", "NEEDS_ATTENTION"],
  FAILED_RETRYABLE: ["CLAIMED", "CANCELLED", "NEEDS_ATTENTION"],
};

export function canTransitionPost(from: PostStatus, to: PostStatus) {
  return transitions[from]?.includes(to) || false;
}

export function isSameOriginMutation(originHeader: string | null, requestUrl: string) {
  if (!originHeader) return false;
  try { return new URL(originHeader).origin === new URL(requestUrl).origin; } catch { return false; }
}
