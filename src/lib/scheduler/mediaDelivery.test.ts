import assert from "node:assert/strict";
import test from "node:test";
import { getTikTokMediaHeaders, normalizeTikTokMediaPath } from "./mediaDelivery";

test("normalizes a staged TikTok media object path", () => {
  assert.equal(
    normalizeTikTokMediaPath(["attempt-id", "asset-name.webp"]),
    "attempt-id/asset-name.webp",
  );
});

test("rejects unsafe TikTok media object paths", () => {
  assert.throws(() => normalizeTikTokMediaPath(["..", "private.webp"]));
  assert.throws(() => normalizeTikTokMediaPath([]));
});

test("returns pull-safe media response headers", () => {
  assert.deepEqual(getTikTokMediaHeaders("image/webp", 123), {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600, immutable",
    "Content-Length": "123",
    "Content-Type": "image/webp",
  });
});
