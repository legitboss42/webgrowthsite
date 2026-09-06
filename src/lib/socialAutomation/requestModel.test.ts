import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAssetPrepareRequest,
  parseAssetRegistrationRequest,
  parseCreateJobRequest,
  parsePublishRequest,
} from "./requestModel";

test("create-job request requires a safe blog slug and commit SHA", () => {
  assert.deepEqual(
    parseCreateJobRequest({ slug: "seo-checklist", sourceCommitSha: "abc1234" }),
    { slug: "seo-checklist", sourceCommitSha: "abc1234", automationVersion: "v1" }
  );
  assert.equal(parseCreateJobRequest({ slug: "../secret", sourceCommitSha: "abc1234" }), null);
  assert.equal(parseCreateJobRequest({ slug: "seo-checklist", sourceCommitSha: "bad sha" }), null);
});

test("asset prepare request resolves a locked job/profile storage target", () => {
  assert.deepEqual(
    parseAssetPrepareRequest({
      jobId: "11111111-1111-4111-8111-111111111111",
      profile: "META",
    }),
    {
      jobId: "11111111-1111-4111-8111-111111111111",
      profile: "META",
      bucket: "social-automation",
      storagePath: "social/11111111-1111-4111-8111-111111111111/meta.mp4",
      filename: "meta.mp4",
    }
  );
  assert.equal(
    parseAssetPrepareRequest({
      jobId: "11111111-1111-4111-8111-111111111111",
      profile: "OTHER",
    }),
    null
  );
});

test("TikTok upload target uses the existing scheduler media bucket", () => {
  assert.equal(
    parseAssetPrepareRequest({
      jobId: "11111111-1111-4111-8111-111111111111",
      profile: "TIKTOK",
    })?.bucket,
    "tiktok-scheduler-media"
  );
});

test("asset registration is limited to known profiles and MP4 metadata", () => {
  const parsed = parseAssetRegistrationRequest({
    jobId: "11111111-1111-4111-8111-111111111111",
    profile: "META",
    storagePath: "social/11111111-1111-4111-8111-111111111111/meta.mp4",
    originalFilename: "meta.mp4",
    mimeType: "video/mp4",
    byteSize: 12345,
    width: 1080,
    height: 1920,
    durationSeconds: 42.5,
    checksum: "a".repeat(64),
  });
  assert.equal(parsed?.profile, "META");
  assert.equal(parsed?.byteSize, 12345);
  assert.equal(
    parseAssetRegistrationRequest({ ...parsed, profile: "OTHER" }),
    null
  );
});

test("publish request accepts only a UUID job id", () => {
  assert.deepEqual(parsePublishRequest({ jobId: "11111111-1111-4111-8111-111111111111" }), {
    jobId: "11111111-1111-4111-8111-111111111111",
  });
  assert.equal(parsePublishRequest({ jobId: "not-a-uuid" }), null);
});
