import assert from "node:assert/strict";
import test from "node:test";
import { getPostWorkflowStage, type PostWorkflowStage } from "./postWorkflow";
import type { PostStatus } from "./types";

test("workflow routing is exhaustive and only uses persisted approval identity within NEEDS_APPROVAL", () => {
  const expected = {
    DRAFT: "DRAFT",
    NEEDS_CONNECTION: "NEEDS_CONNECTION",
    NEEDS_APPROVAL: "APPROVE",
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
    assert.equal(getPostWorkflowStage({ status, approvalId: null }), stage);
  }
  assert.equal(getPostWorkflowStage({ status: "NEEDS_APPROVAL", approvalId: "approval-current" }), "SCHEDULE");
  assert.equal(getPostWorkflowStage({ status: "NEEDS_APPROVAL", approvalId: null }), "APPROVE", "missing or invalidated approval returns to approval controls");
});
