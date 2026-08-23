import assert from "node:assert/strict";
import test from "node:test";
import {
  finalizeSchedulerUpload,
  type UploadFinalizationAdapter,
  type UploadFinalizationAsset,
} from "./uploadFinalization";

const asset: UploadFinalizationAsset = {
  id: "11111111-1111-4111-8111-111111111111",
  storagePath: "user-1/11111111-1111-4111-8111-111111111111/upload.jpg",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  byteSize: 3,
};

function fakeAdapter(overrides: Partial<UploadFinalizationAdapter> = {}) {
  const calls: Array<{ name: string; input?: unknown }> = [];
  const adapter: UploadFinalizationAdapter = {
    async findOwnedAsset(input) {
      calls.push({ name: "findOwnedAsset", input });
      return { data: asset, error: false };
    },
    async inspectObject(input) {
      calls.push({ name: "inspectObject", input });
      return { data: { byteSize: 3, mimeType: "image/jpeg" }, error: false };
    },
    async downloadObject(input) {
      calls.push({ name: "downloadObject", input });
      return { data: new Uint8Array([1, 2, 3]), error: false };
    },
    async validatePhoto() {
      calls.push({ name: "validatePhoto" });
      return { ok: true, width: 20, height: 10, mimeType: "image/jpeg" };
    },
    async markInvalid(input) {
      calls.push({ name: "markInvalid", input });
      return { error: false, updatedCount: 1 };
    },
    async markValid(input) {
      calls.push({ name: "markValid", input });
      return { error: false, updatedCount: 1 };
    },
    ...overrides,
  };
  return { adapter, calls };
}

const input = { userId: "user-1", assetId: "11111111-1111-4111-8111-111111111111", checksum: "checksum-1" };
const videoAsset: UploadFinalizationAsset = {
  ...asset,
  storagePath: "user-1/11111111-1111-4111-8111-111111111111/upload.mp4",
  kind: "VIDEO",
  mimeType: "video/mp4",
};
const videoProbe = {
  formatName: "mov,mp4,m4a,3gp,3g2,mj2",
  codecName: "h264",
  width: 1080,
  height: 1920,
  frameRate: 30,
  durationSeconds: 60,
};

// Mutation target: sending malformed IDs to the database must turn caller input into a false infrastructure outage.
test("upload finalization rejects malformed asset IDs before the adapter", async () => {
  const { adapter, calls } = fakeAdapter();
  assert.deepEqual(await finalizeSchedulerUpload({ ...input, assetId: "not-a-uuid" }, adapter), {
    ok: false, status: 400, error: "Invalid finalization request.",
  });
  assert.equal(calls.length, 0);
});

// Mutation target: collapsing an authenticated asset-query outage into 404 must change this retryable response.
test("upload finalization returns 502 without invalidation on asset-query errors", async () => {
  const { adapter, calls } = fakeAdapter({ findOwnedAsset: async () => ({ data: null, error: true }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to read media asset.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
});

// Mutation target: an unexpected adapter throw must not leak or become an unhandled route failure.
test("upload finalization sanitizes unexpected infrastructure throws", async () => {
  const { adapter, calls } = fakeAdapter({
    findOwnedAsset: async () => { throw new Error("connection string and internal detail"); },
  });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to finalize media asset.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
});

// Mutation target: treating a scoped missing row as infrastructure failure must change this authenticated 404.
test("upload finalization returns 404 for a missing owned asset", async () => {
  const { adapter, calls } = fakeAdapter({ findOwnedAsset: async () => ({ data: null, error: false }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 404, error: "Media asset not found.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
});

// Mutation target: treating storage-list outages as invalid media must set INVALID or return 400.
test("upload finalization returns retryable 502 without invalidation on object-inspection errors", async () => {
  const { adapter, calls } = fakeAdapter({ inspectObject: async () => ({ data: null, error: true }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to inspect stored media.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
});

// Mutation target: treating storage-download outages as corrupt photos must set INVALID or return 400.
test("upload finalization returns retryable 502 without invalidation on download errors", async () => {
  const { adapter, calls } = fakeAdapter({ downloadObject: async () => ({ data: null, error: true }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to download stored media for validation.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
});

// Mutation target: failing to persist INVALID must not return a definitive validation response.
test("upload finalization checks invalidation-update errors", async () => {
  const { adapter, calls } = fakeAdapter({
    inspectObject: async () => ({ data: { byteSize: 4, mimeType: "image/jpeg" }, error: false }),
    markInvalid: async () => ({ error: true, updatedCount: 0 }),
  });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to record invalid media.",
  });
  assert.equal(calls.some((call) => call.name === "downloadObject"), false);
});

// Mutation target: treating a successful zero-row INVALID update as persisted must return a definitive 400.
test("upload finalization treats a zero-row invalidation as retryable", async () => {
  const { adapter } = fakeAdapter({
    inspectObject: async () => ({ data: { byteSize: 4, mimeType: "image/jpeg" }, error: false }),
    markInvalid: async () => ({ error: false, updatedCount: 0 }),
  });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to record invalid media.",
  });
});

// Mutation target: proven byte/MIME/decode failures must not stay PENDING or become VALID.
test("upload finalization marks only proven media failures invalid", async () => {
  const { adapter, calls } = fakeAdapter({
    validatePhoto: async () => ({ ok: false, error: "Photo could not be decoded." }),
  });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 400, error: "Stored media did not pass validation.",
  });
  assert.equal(calls.filter((call) => call.name === "markInvalid").length, 1);
  assert.equal(calls.some((call) => call.name === "markValid"), false);
});

// Mutation target: ignoring the final VALID update error must return success for a still-pending asset.
test("upload finalization returns 502 when the valid-state update fails", async () => {
  const { adapter } = fakeAdapter({ markValid: async () => ({ error: true, updatedCount: 0 }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to finalize media asset.",
  });
});

// Mutation target: treating a stale-state zero-row VALID update as success must produce a false finalized response.
test("upload finalization treats a zero-row valid update as retryable", async () => {
  const { adapter } = fakeAdapter({ markValid: async () => ({ error: false, updatedCount: 0 }) });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to finalize media asset.",
  });
});

// Mutation target: omitting decoded metadata or checksum from the one valid update must change this call.
test("upload finalization stores validated photo metadata after all checks", async () => {
  const { adapter, calls } = fakeAdapter();
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: true, status: 200, assetId: "11111111-1111-4111-8111-111111111111", validationStatus: "VALID",
  });
  assert.deepEqual(calls.at(-1), { name: "markValid", input: {
    userId: "user-1",
    assetId: "11111111-1111-4111-8111-111111111111",
    checksum: "checksum-1",
    mimeType: "image/jpeg",
    byteSize: 3,
    width: 20,
    height: 10,
    expectedValidationStatus: "PENDING",
  } });
});

// Mutation target: trusting stored browser metadata must mark a video VALID without downloading and probing its bytes.
test("upload finalization stores probe metadata only after stored-video validation succeeds", async () => {
  const { adapter, calls } = fakeAdapter({
    findOwnedAsset: async () => ({ data: videoAsset, error: false }),
    inspectObject: async () => ({ data: { byteSize: 3, mimeType: "video/quicktime" }, error: false }),
    async validateVideo() {
      calls.push({ name: "validateVideo" });
      return { ok: true, probe: videoProbe, validationVersion: "tiktok-video-beta-v1" };
    },
  });

  assert.equal((await finalizeSchedulerUpload(input, adapter)).ok, true);
  assert.deepEqual(calls.map((call) => call.name), [
    "downloadObject", "validateVideo", "markValid",
  ]);
  assert.deepEqual(calls.at(-1), { name: "markValid", input: {
    userId: "user-1",
    assetId: input.assetId,
    checksum: "checksum-1",
    mimeType: "video/mp4",
    byteSize: 3,
    width: 1080,
    height: 1920,
    durationSeconds: 60,
    videoCodec: "h264",
    frameRate: 30,
    validationVersion: "tiktok-video-beta-v1",
    probeMetadata: videoProbe,
    expectedValidationStatus: "PENDING",
  } });
});

// Mutation target: classifying a temp-file or probe-infrastructure failure as bad media must persist INVALID.
test("upload finalization leaves video PENDING on probe infrastructure failure", async () => {
  const { adapter, calls } = fakeAdapter({
    findOwnedAsset: async () => ({ data: videoAsset, error: false }),
    inspectObject: async () => ({ data: { byteSize: 3, mimeType: "video/mp4" }, error: false }),
    async validateVideo() {
      return { ok: false, infrastructureError: true, error: "Video validation infrastructure is unavailable." };
    },
  });

  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to probe stored video.",
  });
  assert.equal(calls.some((call) => call.name === "markInvalid"), false);
  assert.equal(calls.some((call) => call.name === "markValid"), false);
});

// Mutation target: a proven unsupported stored codec must stay PENDING or be marked VALID if the video branch is bypassed.
test("upload finalization marks proven stored-video policy failures invalid", async () => {
  const { adapter, calls } = fakeAdapter({
    findOwnedAsset: async () => ({ data: videoAsset, error: false }),
    inspectObject: async () => ({ data: { byteSize: 3, mimeType: "video/mp4" }, error: false }),
    async validateVideo() {
      return { ok: false, error: "Video codec must be H.264." };
    },
  });

  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 400, error: "Stored media did not pass validation.",
  });
  assert.equal(calls.filter((call) => call.name === "markInvalid").length, 1);
  assert.equal(calls.some((call) => call.name === "markValid"), false);
});
