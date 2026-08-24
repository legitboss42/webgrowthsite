import assert from "node:assert/strict";
import test from "node:test";
import { getPostWorkflowStage } from "./postWorkflow";

test("durable publishing states are handed to the live status panel, not the approval panel", () => {
  assert.equal(
    getPostWorkflowStage({ status: "SCHEDULED", approvalId: "approval-1", scheduledFor: "2026-08-22T17:00:00.000Z" }),
    "STATUS",
  );
  assert.equal(getPostWorkflowStage({ status: "PUBLISHED", approvalId: "approval-1", scheduledFor: "2026-08-22T17:00:00.000Z" }), "STATUS");
  assert.equal(getPostWorkflowStage({ status: "NEEDS_ATTENTION", approvalId: "approval-1", scheduledFor: "2026-08-22T17:00:00.000Z" }), "STATUS");
});

test("an approved unscheduled post remains ready for scheduling", () => {
  assert.equal(
    getPostWorkflowStage({ status: "NEEDS_APPROVAL", approvalId: "approval-1", scheduledFor: null }),
    "READY_TO_SCHEDULE",
  );
});
