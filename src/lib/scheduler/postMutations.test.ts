import assert from "node:assert/strict";
import test from "node:test";
import {
  approvePostAtBoundary,
  classifyApprovalMediaRead,
  classifyApprovalPostRead,
  createPostAtBoundary,
  isSchedulerPostMutationAction,
  type AtomicPostMutationStore,
} from "./postMutations";

function fakeStore(overrides: Partial<AtomicPostMutationStore> = {}) {
  const calls: Array<{ name: string; input: unknown }> = [];
  const store: AtomicPostMutationStore = {
    async createPost(input) {
      calls.push({ name: "createPost", input });
      return { ok: true, postId: "post-1" };
    },
    async approvePost(input) {
      calls.push({ name: "approvePost", input });
      return { ok: true, postId: input.postId, approvalId: "approval-1" };
    },
    ...overrides,
  };
  return { calls, store };
}

// Mutation target: omitting approve from the guarded action set must let approval bypass active/legal checks.
test("both create and approve are scheduler post mutation actions", () => {
  assert.equal(isSchedulerPostMutationAction("create"), true);
  assert.equal(isSchedulerPostMutationAction("approve"), true);
  assert.equal(isSchedulerPostMutationAction("read"), false);
  assert.equal(isSchedulerPostMutationAction(undefined), false);
});

// Mutation target: collapsing approval source read errors and missing rows into the same 404 must change these results.
test("approval boundary distinguishes post and media read outages from missing state", () => {
  assert.deepEqual(classifyApprovalPostRead({ data: null, error: true }), {
    ok: false, status: 502, error: "Unable to read post.",
  });
  assert.deepEqual(classifyApprovalPostRead({ data: null, error: false }), {
    ok: false, status: 404, error: "Post not found.",
  });
  assert.deepEqual(classifyApprovalMediaRead({ data: null, error: true }), {
    ok: false, status: 502, error: "Unable to read post media.",
  });
  assert.deepEqual(classifyApprovalMediaRead({ data: [], error: false }), {
    ok: false, status: 409, error: "Post media or content changed before approval.",
  });
});

// Mutation target: rebuilding or sorting media IDs at the route boundary must change the one atomic call.
test("post creation boundary passes submitted order to one atomic store operation", async () => {
  const { calls, store } = fakeStore();
  const result = await createPostAtBoundary(store, {
    userId: "user-1",
    mediaIds: ["media-2", "media-1"],
    title: "Title",
    caption: "Caption",
  });

  assert.deepEqual(result, { ok: true, status: 201, postId: "post-1" });
  assert.deepEqual(calls, [{ name: "createPost", input: {
    userId: "user-1",
    mediaIds: ["media-2", "media-1"],
    title: "Title",
    caption: "Caption",
  } }]);
});

// Mutation target: collapsing access/media policy failures into success or generic 500 must change these responses.
test("post creation boundary truthfully classifies atomic policy refusals", async () => {
  for (const [code, status, error] of [
    ["ACCESS_DENIED", 403, "Active scheduler access and current legal acceptance are required."],
    ["INVALID_MEDIA", 400, "Select valid unmixed media within the scheduler limit."],
    ["MEDIA_OWNERSHIP", 403, "Media ownership check failed."],
  ] as const) {
    const { store } = fakeStore({ createPost: async () => ({ ok: false, code }) });
    assert.deepEqual(await createPostAtBoundary(store, {
      userId: "user-1", mediaIds: ["media-1"], title: "", caption: "",
    }), { ok: false, status, error });
  }
});

// Mutation target: exposing raw database text or returning success after an RPC error must change the sanitized 502.
test("post creation boundary preserves only sanitized database operation errors", async () => {
  const { store } = fakeStore({
    createPost: async () => { throw new Error("Scheduler database operation failed (42501)."); },
  });
  assert.deepEqual(await createPostAtBoundary(store, {
    userId: "user-1", mediaIds: ["media-1"], title: "", caption: "",
  }), { ok: false, status: 502, error: "Scheduler database operation failed (42501)." });

  const raw = fakeStore({ createPost: async () => { throw new Error("password=secret internal SQL"); } });
  assert.deepEqual(await createPostAtBoundary(raw.store, {
    userId: "user-1", mediaIds: ["media-1"], title: "", caption: "",
  }), { ok: false, status: 502, error: "Unable to create post." });
});

// Mutation target: splitting approval insertion and post update must make more than this single atomic call.
test("post approval boundary commits snapshot and fingerprint through one atomic store operation", async () => {
  const { calls, store } = fakeStore();
  const snapshot = { version: 1, title: "Title", media: [{ id: "media-1", checksum: "abc", position: 0 }] };
  const result = await approvePostAtBoundary(store, {
    userId: "user-1", postId: "post-1", fingerprint: "a".repeat(64), snapshot,
  });

  assert.deepEqual(result, { ok: true, status: 200, postId: "post-1", approvalId: "approval-1", fingerprint: "a".repeat(64) });
  assert.deepEqual(calls, [{ name: "approvePost", input: {
    userId: "user-1", postId: "post-1", fingerprint: "a".repeat(64), snapshot,
  } }]);
});

// Mutation target: collapsing concurrent access/not-found/snapshot changes into 404 must change these classifications.
test("post approval boundary truthfully classifies atomic refusals", async () => {
  for (const [code, status, error] of [
    ["ACCESS_DENIED", 403, "Active scheduler access and current legal acceptance are required."],
    ["POST_NOT_FOUND", 404, "Post not found."],
    ["POST_CHANGED", 409, "Post media or content changed before approval."],
  ] as const) {
    const { store } = fakeStore({ approvePost: async () => ({ ok: false, code }) });
    assert.deepEqual(await approvePostAtBoundary(store, {
      userId: "user-1", postId: "post-1", fingerprint: "a".repeat(64), snapshot: {},
    }), { ok: false, status, error });
  }
});

// Mutation target: ignored approval update/RPC errors must not return an approval ID.
test("post approval boundary returns sanitized retryable database failures", async () => {
  const { store } = fakeStore({
    approvePost: async () => { throw new Error("Scheduler database operation failed (PGRST202)."); },
  });
  assert.deepEqual(await approvePostAtBoundary(store, {
    userId: "user-1", postId: "post-1", fingerprint: "a".repeat(64), snapshot: {},
  }), { ok: false, status: 502, error: "Scheduler database operation failed (PGRST202)." });
});
