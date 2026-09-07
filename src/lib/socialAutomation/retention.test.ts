import test from "node:test";
import assert from "node:assert/strict";

import { isRetentionCleanupEligible } from "./retention";

const now = Date.parse("2026-09-14T12:00:00.000Z");

function candidate(overrides: Partial<{
  profile: "META" | "TIKTOK";
  retainedUntil: string | null;
  deletedAt: string | null;
  publicationStatuses: string[];
  schedulerTerminalAt: string | null;
}> = {}) {
  return {
    profile: "META" as const,
    retainedUntil: "2026-09-13T12:00:00.000Z",
    deletedAt: null,
    publicationStatuses: ["PUBLISHED", "PUBLISHED"],
    schedulerTerminalAt: null,
    ...overrides,
  };
}

test("expired terminal media is eligible for cleanup", () => {
  assert.equal(isRetentionCleanupEligible(candidate(), now), true);
});

test("media inside its retention window is kept", () => {
  assert.equal(
    isRetentionCleanupEligible(
      candidate({ retainedUntil: "2026-09-15T12:00:00.000Z" }),
      now
    ),
    false
  );
});

test("non-terminal Meta publication states protect the shared Meta render", () => {
  assert.equal(
    isRetentionCleanupEligible(candidate({ publicationStatuses: ["PUBLISHED", "PROCESSING"] }), now),
    false
  );
  assert.equal(
    isRetentionCleanupEligible(candidate({ publicationStatuses: ["FAILED_RETRYABLE", "PUBLISHED"] }), now),
    false
  );
  assert.equal(
    isRetentionCleanupEligible(candidate({ publicationStatuses: ["NEEDS_ATTENTION", "PUBLISHED"] }), now),
    false
  );
});

test("TikTok consent-pending media is never cleaned up", () => {
  assert.equal(
    isRetentionCleanupEligible(
      candidate({ profile: "TIKTOK", publicationStatuses: ["NEEDS_APPROVAL"] }),
      now
    ),
    false
  );
});

test("TikTok media keeps the scheduler's seven-day post-terminal retention window", () => {
  assert.equal(
    isRetentionCleanupEligible(
      candidate({
        profile: "TIKTOK",
        publicationStatuses: ["PUBLISHED"],
        schedulerTerminalAt: "2026-09-13T12:00:00.000Z",
      }),
      now
    ),
    false
  );
  assert.equal(
    isRetentionCleanupEligible(
      candidate({
        profile: "TIKTOK",
        publicationStatuses: ["PUBLISHED"],
        schedulerTerminalAt: "2026-09-07T12:00:00.000Z",
      }),
      now
    ),
    true
  );
});

test("TikTok terminal cleanup requires a real scheduler terminal timestamp", () => {
  assert.equal(
    isRetentionCleanupEligible(
      candidate({
        profile: "TIKTOK",
        publicationStatuses: ["PUBLISHED"],
        schedulerTerminalAt: null,
      }),
      now
    ),
    false
  );
});

test("already deleted or malformed retention rows are not selected again", () => {
  assert.equal(
    isRetentionCleanupEligible(candidate({ deletedAt: "2026-09-13T13:00:00.000Z" }), now),
    false
  );
  assert.equal(isRetentionCleanupEligible(candidate({ retainedUntil: null }), now), false);
  assert.equal(isRetentionCleanupEligible(candidate({ retainedUntil: "not-a-date" }), now), false);
});
