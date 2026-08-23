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
      return { error: false };
    },
    async markValid(input) {
      calls.push({ name: "markValid", input });
      return { error: false };
    },
    ...overrides,
  };
  return { adapter, calls };
}

const input = { userId: "user-1", assetId: "11111111-1111-4111-8111-111111111111", checksum: "checksum-1" };

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
    markInvalid: async () => ({ error: true }),
  });
  assert.deepEqual(await finalizeSchedulerUpload(input, adapter), {
    ok: false, status: 502, error: "Unable to record invalid media.",
  });
  assert.equal(calls.some((call) => call.name === "downloadObject"), false);
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
  const { adapter } = fakeAdapter({ markValid: async () => ({ error: true }) });
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
  } });
});
