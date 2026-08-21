import assert from "node:assert/strict";
import test from "node:test";
import { buildStagingObjectPath, createMediaRetrievalSignature, validateMediaMetadata, verifyMediaRetrievalSignature } from "./media";

test("media validation enforces beta byte and MIME boundaries", () => {
  assert.equal(validateMediaMetadata({ kind: "PHOTO", mimeType: "image/webp", byteSize: 20 * 1024 * 1024 }).ok, true);
  assert.equal(validateMediaMetadata({ kind: "PHOTO", mimeType: "image/svg+xml", byteSize: 100 }).ok, false);
  assert.equal(validateMediaMetadata({ kind: "VIDEO", mimeType: "video/mp4", byteSize: 500 * 1024 * 1024 + 1 }).ok, false);
});

test("staging paths are unguessable and contain no creator filename", () => {
  const path = buildStagingObjectPath("attempt-1", "video.mp4", () => "random-object-id");
  assert.equal(path, "attempt-1/random-object-id.mp4");
  assert.equal(path.includes("video"), false);
});

test("retrieval signatures bind media, attempt, and expiry", () => {
  process.env.SCHEDULER_MEDIA_SIGNING_SECRET = "media-test-secret";
  const signature = createMediaRetrievalSignature("media-1", "attempt-1", 2_000);
  assert.equal(verifyMediaRetrievalSignature("media-1", "attempt-1", 2_000, signature, 1_999), true);
  assert.equal(verifyMediaRetrievalSignature("media-2", "attempt-1", 2_000, signature, 1_999), false);
  assert.equal(verifyMediaRetrievalSignature("media-1", "attempt-1", 2_000, signature, 2_000), false);
});
