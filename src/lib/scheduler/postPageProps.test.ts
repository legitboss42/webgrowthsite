import assert from "node:assert/strict";
import test from "node:test";
import { createPostPageClientProps } from "./postPageProps";

test("post page client props omit raw scheduler/provider fields and retain current approval only", () => {
  const result = createPostPageClientProps({
    id: "post-1",
    status: "NEEDS_APPROVAL",
    approval_id: "approval-old",
    scheduled_for: "2026-08-24T12:00:00.000Z",
    timezone: "Africa/Lagos",
    terminal_at: null,
    user_failure_code: "provider secret",
    retry_eligible: true,
    next_retry_at: null,
    publish_id: "provider-private-id",
    claim_token: "claim-secret",
    storage_path: "private/video.mp4",
  }, { id: "approval-current", invalidated_at: null });

  assert.deepEqual(result.approvalPost, { id: "post-1", status: "NEEDS_APPROVAL", approvalId: "approval-current" });
  assert.deepEqual(result.statusPanel, {
    postId: "post-1",
    initialSnapshot: {
      status: "NEEDS_APPROVAL", publishedAt: null, failureCode: null, retryEligible: true, nextRetryAt: null, nextPollAfterMs: null,
    },
    scheduledFor: "2026-08-24T12:00:00.000Z",
    timezone: "Africa/Lagos",
  });
  assert.doesNotMatch(JSON.stringify(result), /provider secret|provider-private-id|claim-secret|private\/video|approval-old/);
});

test("missing or invalidated persisted approval never unlocks schedule controls", () => {
  const input = { id: "post-1", status: "NEEDS_APPROVAL" as const, approval_id: "approval-old", scheduled_for: null, timezone: null, terminal_at: null, user_failure_code: null, retry_eligible: false, next_retry_at: null };
  assert.equal(createPostPageClientProps(input, null).approvalPost.approvalId, null);
  assert.equal(createPostPageClientProps(input, { id: "approval-old", invalidated_at: "2026-08-24T12:00:00.000Z" }).approvalPost.approvalId, null);
});
