import assert from "node:assert/strict";
import test from "node:test";
import { POST_STATUSES, isPostStatus } from "./types";

test("scheduler states cover durable worker boundaries", () => {
  assert.equal(isPostStatus("SCHEDULED"), true);
  assert.equal(isPostStatus("PROCESSING"), true);
  assert.equal(isPostStatus("UNKNOWN"), false);
  assert.equal(new Set(POST_STATUSES).size, POST_STATUSES.length);
});
