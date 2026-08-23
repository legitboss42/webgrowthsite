import assert from "node:assert/strict";
import test from "node:test";
import { runMediaPostComposer, type ComposerFile, type MediaPostComposerAdapter } from "./composerFlow";

const files: ComposerFile[] = [
  { name: "first.png", type: "image/png", size: 101 },
  { name: "second.jpg", type: "image/jpeg", size: 102 },
  { name: "third.webp", type: "image/webp", size: 103 },
];

// Mutation target: Promise.all/unbounded uploads or sorting IDs must change max concurrency or submitted order.
test("composer flow uploads several files serially and creates one post in selected order", async () => {
  const events: string[] = [];
  let active = 0;
  let maximumActive = 0;
  let postInput: unknown;
  const adapter: MediaPostComposerAdapter = {
    async uploadFile(file) {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      events.push(`start:${file.name}`);
      await new Promise<void>((resolve) => setImmediate(resolve));
      events.push(`end:${file.name}`);
      active -= 1;
      return `asset:${file.name}`;
    },
    async createPost(input) {
      events.push("create-post");
      postInput = input;
      return { postId: "post-1" };
    },
  };

  assert.deepEqual(await runMediaPostComposer({ files, title: "Title", caption: "Caption" }, adapter), { postId: "post-1" });
  assert.equal(maximumActive, 1);
  assert.deepEqual(events, [
    "start:first.png", "end:first.png",
    "start:second.jpg", "end:second.jpg",
    "start:third.webp", "end:third.webp",
    "create-post",
  ]);
  assert.deepEqual(postInput, {
    mediaIds: ["asset:first.png", "asset:second.jpg", "asset:third.webp"],
    title: "Title",
    caption: "Caption",
  });
});

// Mutation target: catching an upload error and continuing must upload later files or create a partial post.
test("composer flow stops on first upload failure and reports exact filename and reason", async () => {
  const uploaded: string[] = [];
  let createCalls = 0;
  const adapter: MediaPostComposerAdapter = {
    async uploadFile(file) {
      uploaded.push(file.name);
      if (file.name === "second.jpg") throw new Error("Storage upload failed.");
      return `asset:${file.name}`;
    },
    async createPost() {
      createCalls += 1;
      return { postId: "must-not-exist" };
    },
  };

  await assert.rejects(
    runMediaPostComposer({ files, title: "", caption: "" }, adapter),
    { message: "Unable to upload second.jpg: Storage upload failed." },
  );
  assert.deepEqual(uploaded, ["first.png", "second.jpg"]);
  assert.equal(createCalls, 0);
});

// Mutation target: swallowing finalization failure must create a post with an unvalidated or missing asset ID.
test("composer flow stops on finalize failure and never calls post creation", async () => {
  let createCalls = 0;
  const adapter: MediaPostComposerAdapter = {
    async uploadFile(file) {
      if (file.name === "first.png") throw new Error("Stored media did not pass validation.");
      return `asset:${file.name}`;
    },
    async createPost() {
      createCalls += 1;
      return { postId: "must-not-exist" };
    },
  };

  await assert.rejects(
    runMediaPostComposer({ files, title: "", caption: "" }, adapter),
    { message: "Unable to upload first.png: Stored media did not pass validation." },
  );
  assert.equal(createCalls, 0);
});

// Mutation target: allowing eleven files or mixed kinds client-side must call the request adapter.
test("composer flow rejects over-limit and mixed selections before any request", async () => {
  let requests = 0;
  const adapter: MediaPostComposerAdapter = {
    async uploadFile() { requests += 1; return "asset"; },
    async createPost() { requests += 1; return { postId: "post" }; },
  };
  const eleven = Array.from({ length: 11 }, (_, index) => ({ name: `${index}.jpg`, type: "image/jpeg", size: 1 }));
  await assert.rejects(runMediaPostComposer({ files: eleven, title: "", caption: "" }, adapter), { message: "Select no more than 10 media files." });
  await assert.rejects(runMediaPostComposer({ files: [files[0]!, { name: "clip.mp4", type: "video/mp4", size: 1 }], title: "", caption: "" }, adapter), { message: "Choose either one video or up to 10 photos." });
  assert.equal(requests, 0);
});
