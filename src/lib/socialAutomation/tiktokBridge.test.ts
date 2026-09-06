import test from "node:test";
import assert from "node:assert/strict";

import { buildTikTokSchedulerRecords } from "./tiktokBridge";

test("automated TikTok video enters existing consent flow", () => {
  const records = buildTikTokSchedulerRecords({
    userId: "00000000-0000-0000-0000-000000000001",
    articleSlug: "seo-checklist",
    storagePath: "social-automation/seo-checklist/job/tiktok.mp4",
    caption: "SEO starts before traffic #seo",
    checksum: "abc123",
    byteSize: 1000,
    durationSeconds: 22.5,
    title: "SEO checklist",
  });

  assert.equal(records.media.kind, "VIDEO");
  assert.equal(records.media.validation_status, "VALID");
  assert.equal(records.media.article_slug, "seo-checklist");
  assert.equal(records.post.kind, "VIDEO");
  assert.equal(records.post.status, "NEEDS_APPROVAL");
  assert.equal(records.postMedia.position, 0);
});
