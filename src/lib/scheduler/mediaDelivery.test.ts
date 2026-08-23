import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  getTikTokMediaHeaders,
  normalizeTikTokMediaPath,
  normalizeTikTokPhoto,
  validateTikTokPhotoSource,
} from "./mediaDelivery";

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

// Mutation target: removing PNG decoding or JPEG output must preserve the source format incorrectly.
test("normalizes PNG photo sources to JPEG delivery", async () => {
  const source = await sharp({
    create: { width: 64, height: 32, channels: 4, background: "#112233ff" },
  }).png().toBuffer();
  const normalized = await normalizeTikTokPhoto(source);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 64);
  assert.equal(metadata.height, 32);
  assert.deepEqual(getTikTokMediaHeaders("image/jpeg", normalized.byteLength), {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600, immutable",
    "Content-Length": String(normalized.byteLength),
    "Content-Type": "image/jpeg",
  });
});

// Mutation target: removing the resize ceiling must deliver a dimension above 1080 pixels.
test("normalizes 5120 by 2880 photos within TikTok's 1080 by 1080 limit", async () => {
  const source = await sharp({
    create: { width: 5120, height: 2880, channels: 3, background: "#112233" },
  }).jpeg().toBuffer();
  const normalized = await normalizeTikTokPhoto(source);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 608);
});

// Mutation target: swallowing the decoder failure must mark arbitrary bytes as a valid photo.
test("rejects corrupt photo sources after real decoding", async () => {
  const result = await validateTikTokPhotoSource(
    Buffer.from("this is not an image"),
    "image/jpeg",
    20,
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Photo could not be decoded.");
});

// Mutation target: validating only container metadata must accept a truncated image whose pixels cannot be fully decoded.
test("rejects truncated photos that expose metadata but cannot be fully decoded", async () => {
  const complete = await sharp({
    create: { width: 200, height: 100, channels: 3, background: "#123456" },
  }).jpeg().toBuffer();
  const truncated = complete.subarray(0, complete.byteLength - 20);
  const readableHeader = await sharp(truncated, { failOn: "error" }).metadata();
  assert.equal(readableHeader.format, "jpeg");

  const result = await validateTikTokPhotoSource(truncated, "image/jpeg", truncated.byteLength);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Photo could not be decoded.");
});

// Mutation target: trusting the upload Content-Type must accept JPEG bytes labelled as PNG.
test("rejects disguised photo MIME using the decoded source format", async () => {
  const source = await sharp({
    create: { width: 32, height: 16, channels: 3, background: "#334455" },
  }).jpeg().toBuffer();
  const result = await validateTikTokPhotoSource(source, "image/png", source.byteLength);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Photo content does not match its MIME type.");
});
