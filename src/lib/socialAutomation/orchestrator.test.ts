import test from "node:test";
import assert from "node:assert/strict";

import { isArticleAvailabilityExpired, runPlatformWorkflows } from "./orchestrator";

test("one platform failure does not block the other platforms", async () => {
  const result = await runPlatformWorkflows({
    settings: { instagram: true, facebook: true, tiktok: true },
    publishInstagram: async () => {
      throw Object.assign(new Error("temporary"), { retryable: true });
    },
    publishFacebook: async () => ({ externalId: "fb-1" }),
    prepareTikTok: async () => ({ postId: "tt-draft-1" }),
  });

  assert.equal(result.instagram.status, "FAILED_RETRYABLE");
  assert.equal(result.facebook.status, "PUBLISHED");
  assert.equal(result.tiktok.status, "NEEDS_APPROVAL");
});

test("disabled platform is skipped without blocking enabled work", async () => {
  const result = await runPlatformWorkflows({
    settings: { instagram: false, facebook: true, tiktok: false },
    publishInstagram: async () => ({ externalId: "should-not-run" }),
    publishFacebook: async () => ({ externalId: "fb-1" }),
    prepareTikTok: async () => ({ postId: "should-not-run" }),
  });
  assert.equal(result.instagram.status, "SKIPPED");
  assert.equal(result.facebook.status, "PUBLISHED");
  assert.equal(result.tiktok.status, "SKIPPED");
});

test("article availability expires after the 15 minute bounded window", () => {
  const startedAt = Date.parse("2026-09-06T01:00:00.000Z");
  assert.equal(isArticleAvailabilityExpired(startedAt, startedAt + 14 * 60_000 + 59_000), false);
  assert.equal(isArticleAvailabilityExpired(startedAt, startedAt + 15 * 60_000 + 1), true);
});
