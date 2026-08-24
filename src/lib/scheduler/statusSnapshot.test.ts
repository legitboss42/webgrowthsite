import assert from "node:assert/strict";
import test from "node:test";
import { createPublicStatusSnapshot, parsePublicStatusSnapshot } from "./statusSnapshot";

test("status snapshots expose only allowlisted creator-safe status fields", () => {
  const snapshot = createPublicStatusSnapshot({
    status: "FAILED_RETRYABLE",
    terminal_at: "2026-08-24T12:00:00.000Z",
    user_failure_code: "TIKTOK_MEDIA_REJECTED",
    retry_eligible: true,
    next_retry_at: null,
    encrypted_tokens: "secret",
    publish_id: "private-provider-id",
  });
  assert.deepEqual(snapshot, {
    status: "FAILED_RETRYABLE",
    publishedAt: null,
    failureCode: "TIKTOK_MEDIA_REJECTED",
    retryEligible: true,
    nextRetryAt: null,
    nextPollAfterMs: null,
  });
  assert.doesNotMatch(JSON.stringify(snapshot), /secret|private-provider-id/);
});

test("unknown status and raw failure codes fail closed in snapshots", () => {
  assert.equal(createPublicStatusSnapshot({
    status: "NOT_A_STATUS",
    terminal_at: null,
    user_failure_code: "provider error token=secret",
    retry_eligible: true,
    next_retry_at: "2026-08-24T12:00:00.000Z",
  }), null);
  assert.deepEqual(createPublicStatusSnapshot({
    status: "NEEDS_ATTENTION",
    terminal_at: null,
    user_failure_code: "provider error token=secret",
    retry_eligible: true,
    next_retry_at: null,
  }), {
    status: "NEEDS_ATTENTION",
    publishedAt: null,
    failureCode: null,
    retryEligible: true,
    nextRetryAt: null,
    nextPollAfterMs: null,
  });
});

test("poll responses use the same failure-code sanitizer as the initial snapshot", () => {
  assert.deepEqual(parsePublicStatusSnapshot({
    status: "PUBLISHED",
    publishedAt: "2026-08-24T12:00:00.000Z",
    failureCode: "provider secret",
    retryEligible: false,
    nextRetryAt: null,
  }), {
    status: "PUBLISHED",
    publishedAt: "2026-08-24T12:00:00.000Z",
    failureCode: null,
    retryEligible: false,
    nextRetryAt: null,
    nextPollAfterMs: null,
  });
});
