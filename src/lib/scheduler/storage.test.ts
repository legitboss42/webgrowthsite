import assert from "node:assert/strict";
import test from "node:test";
import { createMediaStorage } from "./storage";

test("staging copies from private originals and returns the Web Growth CDN URL", async () => {
  const calls: string[] = [];
  const storage = createMediaStorage({
    async copy(fromBucket, fromPath, toBucket, toPath) {
      calls.push(`${fromBucket}:${fromPath}->${toBucket}:${toPath}`);
    },
    async remove() {},
  });
  const result = await storage.stage("attempt-1", "private/user/file.mp4", "file.mp4", () => "opaque");
  assert.equal(result.publicPath, "/tiktok-media/attempt-1/opaque.mp4");
  assert.deepEqual(calls, ["tiktok-scheduler-media:private/user/file.mp4->tiktok-publishing-staging:attempt-1/opaque.mp4"]);
});
