import assert from "node:assert/strict";
import test from "node:test";
import { POST_STATUSES, isPostStatus, type ScheduledPost } from "./types";

test("scheduler states cover durable worker boundaries", () => {
  assert.equal(isPostStatus("SCHEDULED"), true);
  assert.equal(isPostStatus("PROCESSING"), true);
  assert.equal(isPostStatus("UNKNOWN"), false);
  assert.equal(new Set(POST_STATUSES).size, POST_STATUSES.length);
});

test("scheduled-post contract includes the scheduling event timestamp", () => {
  const scheduledPost: Pick<ScheduledPost, "scheduledAt"> = { scheduledAt: null };
  assert.equal(scheduledPost.scheduledAt, null);
});
