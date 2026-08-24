export type PostWorkflowStage = "NEEDS_APPROVAL" | "READY_TO_SCHEDULE" | "STATUS";

export function getPostWorkflowStage(post: {
  status: string;
  approvalId: string | null;
  scheduledFor: string | null;
}): PostWorkflowStage {
  if (post.scheduledFor || ["SCHEDULED", "CLAIMED", "SUBMITTING", "PROCESSING", "PUBLISHED", "FAILED_RETRYABLE", "NEEDS_ATTENTION", "CANCELLED"].includes(post.status)) return "STATUS";
  if (post.approvalId) return "READY_TO_SCHEDULE";
  return "NEEDS_APPROVAL";
}
