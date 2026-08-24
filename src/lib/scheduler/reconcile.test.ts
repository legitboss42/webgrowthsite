import assert from "node:assert/strict";
import test from "node:test";
import { mapTikTokPublishStatus } from "./publishStatus";
import { buildTerminalReconciliation, reconciliationWritesSucceeded } from "./retry";

test("TikTok terminal states map to durable scheduler states", () => {
  assert.equal(mapTikTokPublishStatus("PUBLISH_COMPLETE"), "PUBLISHED");
  assert.equal(mapTikTokPublishStatus("FAILED"), "NEEDS_ATTENTION");
  assert.equal(mapTikTokPublishStatus("PROCESSING_DOWNLOAD"), "PROCESSING");
});

// Mutation target: treating a proven terminal media rejection as an automatic retry can resubmit without creator intent.
test("TikTok terminal media failure enables only an explicit creator retry", () => {
  const result = buildTerminalReconciliation({ status: "FAILED", fail_reason: "file_format_check_failed" }, "2026-08-24T12:00:00.000Z");
  assert.deepEqual(result, {
    attempt: {
      status: "NEEDS_ATTENTION",
      completed_at: "2026-08-24T12:00:00.000Z",
      error_code: "FILE_FORMAT_CHECK_FAILED",
    },
    post: {
      status: "FAILED_RETRYABLE",
      retry_eligible: true,
      next_retry_at: null,
      user_failure_code: "TIKTOK_MEDIA_REJECTED",
      terminal_at: null,
    },
    outcome: "FAILED",
  });
  assert.equal("publish_id" in result.attempt, false, "terminal reconciliation must not clear the historical publish ID");
});

test("documented frame-rate and picture-size terminal codes are normalized for creator retry", () => {
  for (const failReason of ["frame_rate_check_failed", " picture_size_check_failed "]) {
    const result = buildTerminalReconciliation({ status: "FAILED", fail_reason: failReason }, "2026-08-24T12:00:00.000Z");
    assert.equal(result.post.status, "FAILED_RETRYABLE");
    assert.equal(result.post.retry_eligible, true);
    assert.equal(result.post.next_retry_at, null);
  }
});

test("unknown TikTok terminal errors go to attention with a sanitized code", () => {
  const result = buildTerminalReconciliation({
    status: "FAILED",
    fail_reason: "secret-token=abc\ninternal host",
  }, "2026-08-24T12:00:00.000Z");
  assert.equal(result.attempt.error_code, "TIKTOK_FAILED");
  assert.equal(result.post.status, "NEEDS_ATTENTION");
  assert.equal(result.post.retry_eligible, false);
  assert.equal(result.post.terminal_at, "2026-08-24T12:00:00.000Z");
  assert.doesNotMatch(JSON.stringify(result), /secret-token|internal host/);
});

test("successful reconciliation marks terminal completion without making a retry eligible", () => {
  const result = buildTerminalReconciliation({ status: "PUBLISH_COMPLETE" }, "2026-08-24T12:00:00.000Z");
  assert.equal(result.attempt.status, "PUBLISHED");
  assert.equal(result.post.status, "PUBLISHED");
  assert.equal(result.post.retry_eligible, false);
  assert.equal(result.post.terminal_at, "2026-08-24T12:00:00.000Z");
});

test("reconciliation remains pending when either durable state write fails", () => {
  assert.equal(reconciliationWritesSucceeded([
    { data: [{ id: "post-1" }], error: null },
    { data: [{ id: "attempt-1" }], error: null },
  ]), true);
  assert.equal(reconciliationWritesSucceeded([
    { data: [{ id: "post-1" }], error: null },
    { data: [], error: null },
  ]), false);
  assert.equal(reconciliationWritesSucceeded([
    { data: [{ id: "post-1" }], error: null },
    { data: [{ id: "attempt-1" }], error: { code: "XX000" } },
  ]), false);
});
