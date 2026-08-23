import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStagingObjectPath,
  canMutateSchedulerContent,
  createMediaRetrievalSignature,
  validateMediaMetadata,
  validatePhotoMetadata,
  validatePostMediaSelection,
  verifyMediaRetrievalSignature,
} from "./media";

const currentLegalUser = {
  status: "ACTIVE",
  suspendedAt: null,
  deletionRequestedAt: null,
  termsVersion: "2026-08-23",
  privacyVersion: "2026-08-23",
};

test("media validation enforces beta byte and MIME boundaries", () => {
  assert.equal(validateMediaMetadata({ kind: "PHOTO", mimeType: "image/webp", byteSize: 20 * 1024 * 1024 }).ok, true);
  assert.equal(validateMediaMetadata({ kind: "PHOTO", mimeType: "image/svg+xml", byteSize: 100 }).ok, false);
  assert.equal(validateMediaMetadata({ kind: "VIDEO", mimeType: "video/mp4", byteSize: 500 * 1024 * 1024 + 1 }).ok, false);
});

// Mutation target: checking only the signed session must let a suspended account upload or create a post.
test("scheduler content mutations require a currently active account", () => {
  assert.equal(canMutateSchedulerContent(currentLegalUser), true);
  assert.equal(canMutateSchedulerContent({ ...currentLegalUser, status: "SUSPENDED", suspendedAt: "2026-08-23T12:00:00Z" }), false);
  assert.equal(canMutateSchedulerContent({ ...currentLegalUser, deletionRequestedAt: "2026-08-23T12:00:00Z" }), false);
});

// Mutation target: omitting the exact legal-version check must let stale acceptance mutate scheduler content.
test("scheduler content mutations require current terms and privacy acceptance", () => {
  assert.equal(canMutateSchedulerContent({ ...currentLegalUser, termsVersion: "2026-08-22" }), false);
  assert.equal(canMutateSchedulerContent({ ...currentLegalUser, privacyVersion: null }), false);
});

// Mutation target: raising or bypassing the beta media cap must not allow an eleventh asset.
test("post media selection rejects eleven assets", () => {
  const mediaIds = Array.from({ length: 11 }, (_, index) => `photo-${index + 1}`);
  const media = mediaIds.map((id) => ({ id, kind: "PHOTO" as const }));

  const result = validatePostMediaSelection(mediaIds, media);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Select between 1 and 10 media files.");
});

// Mutation target: lowering MAX_MEDIA_PER_POST below ten must reject the documented beta boundary.
test("post media selection accepts exactly ten photo assets", () => {
  const mediaIds = Array.from({ length: 10 }, (_, index) => `photo-${index + 1}`);
  const media = mediaIds.map((id) => ({ id, kind: "PHOTO" as const }));

  assert.equal(validatePostMediaSelection(mediaIds, media).ok, true);
});

// Mutation target: removing the single-kind branch must not allow a photo/video post.
test("post media selection rejects mixed photo and video assets", () => {
  const result = validatePostMediaSelection(
    ["photo-1", "video-1"],
    [{ id: "photo-1", kind: "PHOTO" }, { id: "video-1", kind: "VIDEO" }],
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Post media cannot be mixed.");
});

// Mutation target: comparing fetched rows with the raw request length must not accept duplicate IDs.
test("post media selection rejects duplicate requested IDs", () => {
  const result = validatePostMediaSelection(
    ["photo-1", "photo-1"],
    [{ id: "photo-1", kind: "PHOTO" }],
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Select distinct media files.");
});

// Mutation target: accepting a partial authenticated-user query must not admit another user's asset.
test("post media selection rejects when any requested owned asset is missing", () => {
  const result = validatePostMediaSelection(
    ["owned-photo", "other-user-photo"],
    [{ id: "owned-photo", kind: "PHOTO" }],
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Media ownership check failed.");
});

// Mutation target: preserving database return order instead of submitted order must change this result.
test("post media selection restores the submitted media order", () => {
  const result = validatePostMediaSelection(
    ["photo-2", "photo-1", "photo-3"],
    [
      { id: "photo-1", kind: "PHOTO" },
      { id: "photo-2", kind: "PHOTO" },
      { id: "photo-3", kind: "PHOTO" },
    ],
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.orderedMedia.map((asset) => asset.id), ["photo-2", "photo-1", "photo-3"]);
});

// Mutation target: trusting a declared MIME without comparing decoded format must allow disguised bytes.
test("photo metadata rejects a declared MIME that differs from the decoded format", () => {
  const result = validatePhotoMetadata({
    mimeType: "image/png",
    byteSize: 512,
    decodedFormat: "jpeg",
    width: 20,
    height: 10,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Photo content does not match its MIME type.");
});

// Mutation target: changing the 20 MB comparison from greater-than to greater-than-or-equal must reject the boundary or allow one byte over it.
test("photo metadata accepts exactly 20 MB and rejects one byte more", () => {
  const common = { mimeType: "image/webp", decodedFormat: "webp", width: 20, height: 10 };

  assert.equal(validatePhotoMetadata({ ...common, byteSize: 20 * 1024 * 1024 }).ok, true);
  const result = validatePhotoMetadata({ ...common, byteSize: 20 * 1024 * 1024 + 1 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Photo size is outside the allowed range.");
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
