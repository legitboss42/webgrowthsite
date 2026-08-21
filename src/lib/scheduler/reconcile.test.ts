import assert from "node:assert/strict";
import test from "node:test";
import { mapTikTokPublishStatus } from "./publishStatus";

test("TikTok terminal states map to durable scheduler states", () => {
  assert.equal(mapTikTokPublishStatus("PUBLISH_COMPLETE"), "PUBLISHED");
  assert.equal(mapTikTokPublishStatus("FAILED"), "NEEDS_ATTENTION");
  assert.equal(mapTikTokPublishStatus("PROCESSING_DOWNLOAD"), "PROCESSING");
});
