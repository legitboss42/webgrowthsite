import type { PostStatus } from "./types";

export type PostWorkflowStage = "DRAFT" | "NEEDS_CONNECTION" | "APPROVE" | "SCHEDULE" | "SCHEDULED" | "STATUS";

export function getPostWorkflowStage(post: {
  status: PostStatus;
  approvalId: string | null;
}): PostWorkflowStage {
  switch (post.status) {
    case "DRAFT": return "DRAFT";
    case "NEEDS_CONNECTION": return "NEEDS_CONNECTION";
    case "NEEDS_APPROVAL": return post.approvalId ? "SCHEDULE" : "APPROVE";
    case "SCHEDULED": return "SCHEDULED";
    case "CLAIMED":
    case "SUBMITTING":
    case "PROCESSING":
    case "PUBLISHED":
    case "FAILED_RETRYABLE":
    case "NEEDS_ATTENTION":
    case "CANCELLED": return "STATUS";
  }
}
