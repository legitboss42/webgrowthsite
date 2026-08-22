import assert from "node:assert/strict";
import test from "node:test";
import { getPostWorkflowStage } from "./postWorkflow";

test("a scheduled post renders confirmation instead of another scheduling form", () => {
  assert.equal(
    getPostWorkflowStage({ status: "SCHEDULED", approvalId: "approval-1", scheduledFor: "2026-08-22T17:00:00.000Z" }),
    "SCHEDULED",
  );
});

test("an approved unscheduled post remains ready for scheduling", () => {
  assert.equal(
    getPostWorkflowStage({ status: "NEEDS_APPROVAL", approvalId: "approval-1", scheduledFor: null }),
    "READY_TO_SCHEDULE",
  );
});
