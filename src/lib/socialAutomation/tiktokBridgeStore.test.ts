import test from "node:test";
import assert from "node:assert/strict";

import { persistTikTokDraft } from "./tiktokBridgeStore";

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

test("persistTikTokDraft finalizes a new stored video before creating its approval post", async () => {
  const calls: string[] = [];
  const adapter = {
    async findMediaByPath() {
      return null;
    },
    async findPostIdByMedia() {
      return null;
    },
    async insertMedia() {
      calls.push("insert-media");
      return { id: "media-1" };
    },
    async finalizeMedia(mediaId: string, checksum: string) {
      calls.push(`finalize:${mediaId}:${checksum.slice(0, 4)}`);
    },
    async insertPost(row: Record<string, unknown>) {
      calls.push("insert-post");
      assert.equal(row.status, "NEEDS_APPROVAL");
      return { id: "post-1" };
    },
    async linkPostMedia() {
      calls.push("link-media");
    },
  };

  const result = await persistTikTokDraft(adapter, input);

  assert.deepEqual(result, { postId: "post-1", mediaId: "media-1" });
  assert.deepEqual(calls, ["insert-media", "finalize:media-1:aaaa", "insert-post", "link-media"]);
});

test("persistTikTokDraft reuses an existing media-to-post link on retry without duplicate validation", async () => {
  const mediaByPath = new Map<string, { id: string }>();
  const postByMedia = new Map<string, string>();
  let mediaInserts = 0;
  let postInserts = 0;
  let finalizations = 0;

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
    async finalizeMedia(mediaId: string, checksum: string) {
      finalizations += 1;
      assert.equal(mediaId, "media-1");
      assert.equal(checksum, input.checksum);
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

  const first = await persistTikTokDraft(adapter, input);
  const second = await persistTikTokDraft(adapter, input);

  assert.deepEqual(first, { postId: "post-1", mediaId: "media-1" });
  assert.deepEqual(second, first);
  assert.equal(mediaInserts, 1);
  assert.equal(postInserts, 1);
  assert.equal(finalizations, 1);
});

test("failed stored-video finalization never creates an approval post", async () => {
  let postInserts = 0;
  const adapter = {
    async findMediaByPath() {
      return null;
    },
    async findPostIdByMedia() {
      return null;
    },
    async insertMedia() {
      return { id: "media-1" };
    },
    async finalizeMedia() {
      throw new Error("validation failed");
    },
    async insertPost() {
      postInserts += 1;
      return { id: "post-1" };
    },
    async linkPostMedia() {},
  };

  await assert.rejects(() => persistTikTokDraft(adapter, input), /validation failed/);
  assert.equal(postInserts, 0);
});
