import assert from "node:assert/strict";
import test from "node:test";
import { createSchedulerMediaUploadAdapter } from "./composerUploadAdapter";

const file = {
  name: "launch.jpg",
  type: "image/jpeg",
  size: 3,
  async arrayBuffer() { return new Uint8Array([1, 2, 3]).buffer; },
};

function response(ok: boolean, payload: unknown) {
  return { ok, async json() { return payload; } };
}

function harness(overrides: Record<string, unknown> = {}) {
  const calls: Array<{ name: string; input?: unknown }> = [];
  const uploadFile = createSchedulerMediaUploadAdapter({
    async request(url, init) {
      const body = JSON.parse(String(init.body));
      calls.push({ name: "request", input: { url, body } });
      return body.action === "create"
        ? response(true, { assetId: "asset-1", path: "user/asset/upload.jpg", token: "signed-token" })
        : response(true, { assetId: "asset-1", status: "VALID" });
    },
    async uploadSigned(input) { calls.push({ name: "uploadSigned", input }); return { error: null }; },
    async sha256() { calls.push({ name: "sha256" }); return new Uint8Array([0, 15, 255]); },
    ...overrides,
  });
  return { uploadFile, calls };
}

// Mutation target: reordering or omitting reserve/upload/checksum/finalize must change observable dependency order and payloads.
test("media upload adapter executes the real flow and sends the computed checksum", async () => {
  const { uploadFile, calls } = harness();
  assert.equal(await uploadFile(file), "asset-1");
  assert.deepEqual(calls.map((call) => call.name), ["request", "uploadSigned", "sha256", "request"]);
  assert.deepEqual(calls[0]?.input, { url: "/api/scheduler/uploads/", body: {
    action: "create", kind: "PHOTO", filename: "launch.jpg", mimeType: "image/jpeg", byteSize: 3,
  } });
  assert.deepEqual(calls[3]?.input, { url: "/api/scheduler/uploads/", body: {
    action: "finalize", assetId: "asset-1", checksum: "000fff",
  } });
});

// Mutation target: continuing after reserve failure must attempt storage or finalization for an unreserved asset.
test("media upload adapter stops on reserve failure and surfaces the sanitized server reason", async () => {
  const { uploadFile, calls } = harness({
    request: async () => { calls.push({ name: "request" }); return response(false, { error: "Scheduler access is inactive." }); },
  });
  await assert.rejects(() => uploadFile(file), /Scheduler access is inactive\./);
  assert.deepEqual(calls.map((call) => call.name), ["request"]);
});

// Mutation target: continuing after storage failure must checksum/finalize bytes that were never persisted.
test("media upload adapter stops on storage failure", async () => {
  const { uploadFile, calls } = harness({
    uploadSigned: async () => { calls.push({ name: "uploadSigned" }); return { error: { message: "Bucket temporarily unavailable." } }; },
  });
  await assert.rejects(() => uploadFile(file), /Bucket temporarily unavailable\./);
  assert.deepEqual(calls.map((call) => call.name), ["request", "uploadSigned"]);
});

// Mutation target: accepting failed finalization must return an asset ID that is not VALID.
test("media upload adapter rejects finalize failure without leaking non-string details", async () => {
  const { uploadFile } = harness({
    request: async (_url: string, init: { body?: unknown }) => {
      const body = JSON.parse(String(init.body));
      return body.action === "create"
        ? response(true, { assetId: "asset-1", path: "path", token: "token" })
        : response(false, { error: { internal: "database secret" } });
    },
  });
  await assert.rejects(() => uploadFile(file), /^Error: Media validation failed\.$/);
});

