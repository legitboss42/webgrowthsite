import assert from "node:assert/strict";
import test from "node:test";
import { getStatusPresentation, shouldPollPostStatus } from "./statusPresentation";

test("published is the only durable success state", () => {
  assert.deepEqual(getStatusPresentation("PUBLISHED", null), {
    tone: "success",
    title: "Published successfully",
    detail: "TikTok confirmed that your post was published.",
    canRetry: false,
  });
  assert.notEqual(getStatusPresentation("SCHEDULED", null).title, "Published successfully");
  assert.notEqual(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_PUBLISH_FAILED").title, "Published successfully");
});

test("processing remains distinct from submission and publication", () => {
  assert.deepEqual(getStatusPresentation("PROCESSING", null), {
    tone: "progress",
    title: "TikTok is processing your post",
    detail: "TikTok accepted the post and is finishing publication. We will keep checking for the final result.",
    canRetry: false,
  });
  assert.equal(getStatusPresentation("CLAIMED", null).title, "Preparing your post");
  assert.equal(getStatusPresentation("SUBMITTING", null).title, "Sending your post to TikTok");
});

test("needs-attention failure codes give corrective, sanitized guidance", () => {
  assert.deepEqual(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_RECONNECT_REQUIRED"), {
    tone: "attention",
    title: "Reconnect TikTok to continue",
    detail: "Your TikTok connection needs to be refreshed before this post can continue.",
    canRetry: false,
  });
  assert.deepEqual(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_MEDIA_REJECTED"), {
    tone: "attention",
    title: "Your media needs attention",
    detail: "TikTok could not accept this media. Review the file, then retry when it is ready.",
    canRetry: false,
  });
  assert.deepEqual(getStatusPresentation("NEEDS_ATTENTION", "CREATOR_SETTINGS_CHANGED"), {
    tone: "attention",
    title: "Review your TikTok posting settings",
    detail: "Your selected privacy or interaction settings are no longer available. Review them before scheduling again.",
    canRetry: false,
  });
  assert.deepEqual(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_QUOTA_EXCEEDED"), {
    tone: "attention",
    title: "TikTok posting quota reached",
    detail: "TikTok cannot accept another post right now. Wait for the next available window before trying again.",
    canRetry: false,
  });
  assert.deepEqual(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_PUBLISH_FAILED"), {
    tone: "attention",
    title: "TikTok could not publish this post",
    detail: "Review the post details and TikTok connection before trying again.",
    canRetry: false,
  });
});

test("retry presentation matches automatic and explicit creator retry policy", () => {
  assert.deepEqual(getStatusPresentation("FAILED_RETRYABLE", "PUBLISH_RETRY_SCHEDULED", {
    retryEligible: true,
    nextRetryAt: "2026-08-24T12:15:00.000Z",
  }), {
    tone: "progress",
    title: "We will retry this post automatically",
    detail: "A temporary publishing problem occurred. The scheduler will retry when it is safe to do so.",
    canRetry: false,
  });
  assert.deepEqual(getStatusPresentation("FAILED_RETRYABLE", "TIKTOK_MEDIA_REJECTED", {
    retryEligible: true,
    nextRetryAt: null,
  }), {
    tone: "attention",
    title: "This post is ready for your retry",
    detail: "TikTok rejected the media. Review it, then choose Retry publishing when you are ready.",
    canRetry: true,
  });
  assert.equal(getStatusPresentation("NEEDS_ATTENTION", "TIKTOK_MEDIA_REJECTED", {
    retryEligible: true,
    nextRetryAt: null,
  }).canRetry, false);
});

test("every durable status has explicit copy", () => {
  const statuses = ["DRAFT", "NEEDS_CONNECTION", "NEEDS_APPROVAL", "SCHEDULED", "CLAIMED", "SUBMITTING", "PROCESSING", "PUBLISHED", "FAILED_RETRYABLE", "NEEDS_ATTENTION", "CANCELLED"];
  for (const status of statuses) {
    const presentation = getStatusPresentation(status, null, { retryEligible: false, nextRetryAt: null });
    assert.notEqual(presentation.title, "Publishing status unavailable", `${status} needs explicit status copy`);
  }
});

test("only active durable states are polled", () => {
  for (const status of ["CLAIMED", "SUBMITTING", "PROCESSING"]) {
    assert.equal(shouldPollPostStatus(status), true, `${status} should poll`);
  }
  for (const status of ["SCHEDULED", "PUBLISHED", "FAILED_RETRYABLE", "NEEDS_ATTENTION", "CANCELLED"]) {
    assert.equal(shouldPollPostStatus(status), false, `${status} should not poll`);
  }
});
