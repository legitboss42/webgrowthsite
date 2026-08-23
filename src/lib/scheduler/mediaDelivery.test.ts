import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { getTikTokMediaHeaders, normalizeTikTokMediaPath, normalizeTikTokPhoto } from "./mediaDelivery";

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

test("normalizes oversized photos to TikTok's 1080p JPEG limit", async () => {
  const source = await sharp({
    create: { width: 2000, height: 1200, channels: 3, background: "#112233" },
  }).jpeg().toBuffer();
  const normalized = await normalizeTikTokPhoto(source);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 648);
});
