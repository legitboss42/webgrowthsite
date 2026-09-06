import test from "node:test";
import assert from "node:assert/strict";

import { summarizeJobPublicationStatus } from "./publicationState";

test("published Meta posts plus TikTok consent draft completes automation preparation", () => {
  assert.equal(
    summarizeJobPublicationStatus(["PUBLISHED", "PUBLISHED", "NEEDS_APPROVAL"]),
    "COMPLETE"
  );
});

test("an in-flight or retryable publication keeps the job publishing", () => {
  assert.equal(
    summarizeJobPublicationStatus(["PUBLISHED", "PROCESSING", "NEEDS_APPROVAL"]),
    "PUBLISHING"
  );
  assert.equal(
    summarizeJobPublicationStatus(["FAILED_RETRYABLE", "PUBLISHED", "NEEDS_APPROVAL"]),
    "PUBLISHING"
  );
});

test("mixed success and permanent attention becomes partial publication", () => {
  assert.equal(
    summarizeJobPublicationStatus(["PUBLISHED", "NEEDS_ATTENTION", "NEEDS_APPROVAL"]),
    "PARTIALLY_PUBLISHED"
  );
});

test("only permanent failures become needs attention", () => {
  assert.equal(
    summarizeJobPublicationStatus(["NEEDS_ATTENTION", "NEEDS_ATTENTION", "SKIPPED"]),
    "NEEDS_ATTENTION"
  );
});
