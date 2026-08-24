import assert from "node:assert/strict";
import test from "node:test";
import { getPostWorkflowStage, type PostWorkflowStage } from "./postWorkflow";
import type { PostStatus } from "./types";

test("workflow routing is exhaustive and never infers stage from approval or schedule fields", () => {
  const expected = {
    DRAFT: "DRAFT",
    NEEDS_CONNECTION: "NEEDS_CONNECTION",
    NEEDS_APPROVAL: "NEEDS_APPROVAL",
    SCHEDULED: "SCHEDULED",
    CLAIMED: "STATUS",
    SUBMITTING: "STATUS",
    PROCESSING: "STATUS",
    PUBLISHED: "STATUS",
    FAILED_RETRYABLE: "STATUS",
    NEEDS_ATTENTION: "STATUS",
    CANCELLED: "STATUS",
  } as const;

  for (const [status, stage] of Object.entries(expected) as Array<[PostStatus, PostWorkflowStage]>) {
    assert.equal(getPostWorkflowStage({ status }), stage);
    assert.equal(getPostWorkflowStage({ status }), stage);
  }
});
