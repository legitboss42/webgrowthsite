import test from "node:test";
import assert from "node:assert/strict";

import { persistTikTokDraft } from "./tiktokBridgeStore";

test("persistTikTokDraft reuses an existing media-to-post link on retry", async () => {
  const mediaByPath = new Map<string, { id: string }>();
  const postByMedia = new Map<string, string>();
  let mediaInserts = 0;
  let postInserts = 0;

  const adapter = {
    async findMediaByPath(storagePath: string) {
      return mediaByPath.get(storagePath) ?? null;
    },
    async findPostIdByMedia(mediaId: string) {
      return postByMedia.get(mediaId) ?? null;
    },
    async insertMedia(row: Record<string, unknown>) {
      mediaInserts += 1;
      const media = { id: "media-1" };
      mediaByPath.set(String(row.storage_path), media);
      return media;
    },
    async insertPost(row: Record<string, unknown>) {
      postInserts += 1;
      assert.equal(row.status, "NEEDS_APPROVAL");
      return { id: "post-1" };
    },
    async linkPostMedia(postId: string, mediaId: string, position: number) {
      assert.equal(position, 0);
      postByMedia.set(mediaId, postId);
    },
  };

  const input = {
    userId: "00000000-0000-4000-8000-000000000001",
    articleSlug: "seo-checklist",
    storagePath: "social/11111111-1111-4111-8111-111111111111/tiktok.mp4",
    caption: "SEO starts before traffic #seo",
    checksum: "a".repeat(64),
    byteSize: 1000,
    durationSeconds: 22.5,
    title: "SEO checklist",
  };

  const first = await persistTikTokDraft(adapter, input);
  const second = await persistTikTokDraft(adapter, input);

  assert.deepEqual(first, { postId: "post-1", mediaId: "media-1" });
  assert.deepEqual(second, first);
  assert.equal(mediaInserts, 1);
  assert.equal(postInserts, 1);
});
