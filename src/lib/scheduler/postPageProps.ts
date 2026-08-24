import { createPublicStatusSnapshot, type PublicStatusSnapshot } from "./statusSnapshot";
import type { PostStatus } from "./types";

type PostPageRecord = Record<string, unknown> & {
  id: string;
  status: PostStatus;
  scheduled_for: string | null;
  timezone: string | null;
};

type ApprovalRecord = { id: string; invalidated_at: string | null } | null;

export type PostPageClientProps = {
  approvalPost: { id: string; status: PostStatus; approvalId: string | null };
  statusPanel: { postId: string; initialSnapshot: PublicStatusSnapshot; scheduledFor: string | null; timezone: string | null };
};

export function createPostPageClientProps(post: PostPageRecord, approval: ApprovalRecord): PostPageClientProps {
  const initialSnapshot = createPublicStatusSnapshot(post);
  if (!initialSnapshot) throw new Error("Invalid scheduler post status.");
  const approvalId = post.status === "NEEDS_APPROVAL" && approval && !approval.invalidated_at ? approval.id : null;
  return {
    approvalPost: { id: post.id, status: post.status, approvalId },
    statusPanel: { postId: post.id, initialSnapshot, scheduledFor: post.scheduled_for, timezone: post.timezone },
  };
}
