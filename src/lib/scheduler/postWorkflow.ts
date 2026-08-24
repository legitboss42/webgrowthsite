import type { PostStatus } from "./types";

export type PostWorkflowStage = "DRAFT" | "NEEDS_CONNECTION" | "NEEDS_APPROVAL" | "SCHEDULED" | "STATUS";

export function getPostWorkflowStage(post: {
  status: PostStatus;
}): PostWorkflowStage {
  switch (post.status) {
    case "DRAFT": return "DRAFT";
    case "NEEDS_CONNECTION": return "NEEDS_CONNECTION";
    case "NEEDS_APPROVAL": return "NEEDS_APPROVAL";
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
