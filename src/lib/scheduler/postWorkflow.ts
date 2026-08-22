export type PostWorkflowStage = "NEEDS_APPROVAL" | "READY_TO_SCHEDULE" | "SCHEDULED";

export function getPostWorkflowStage(post: {
  status: string;
  approvalId: string | null;
  scheduledFor: string | null;
}): PostWorkflowStage {
  if (post.scheduledFor || post.status === "SCHEDULED") return "SCHEDULED";
  if (post.approvalId) return "READY_TO_SCHEDULE";
  return "NEEDS_APPROVAL";
}
