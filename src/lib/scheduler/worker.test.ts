import assert from "node:assert/strict";
import test from "node:test";
import {
  processClaimedPost,
  processPostsIndependently,
  type PublishingContext,
} from "./worker";
import { classifyPublishFailure } from "./retry";

function context(overrides: Partial<PublishingContext> = {}): PublishingContext {
  return {
    postId: "post-1",
    attemptId: "attempt-1",
    kind: "PHOTO",
    title: "Title",
    caption: "Caption",
    accessToken: "token",
    approval: {
      privacyLevel: "PUBLIC_TO_EVERYONE",
      allowComment: true,
      allowDuet: false,
      allowStitch: false,
      brandContent: false,
      brandOrganic: false,
    },
    mediaUrls: ["https://webgrowth.info/slide.jpg"],
    publishId: null,
    attemptNumber: 1,
    ...overrides,
  };
}

test("unaudited publishing is forced to SELF_ONLY", async () => {
  let privacy = "";
  const result = await processClaimedPost(context(), {
    publicPostingEnabled: false,
    beginSubmission: async () => true,
    directPost: async (input) => { privacy = input.privacyLevel; return "pub-1"; },
    recordPublishId: async () => undefined,
  });
  assert.equal(privacy, "SELF_ONLY");
  assert.deepEqual(result, { status: "PROCESSING", publishId: "pub-1" });
});

test("a retry with a publish ID never submits a duplicate", async () => {
  let submissions = 0;
  const result = await processClaimedPost(context({ publishId: "pub-existing" }), {
    publicPostingEnabled: false,
    beginSubmission: async () => { throw new Error("must not begin"); },
    directPost: async () => { submissions += 1; return "unexpected"; },
    recordPublishId: async () => undefined,
  });
  assert.equal(submissions, 0);
  assert.deepEqual(result, { status: "RECONCILE", publishId: "pub-existing" });
});

// Mutation target: moving the durable-attempt CAS after Direct Post permits an untracked provider mutation.
test("the durable numbered attempt begins before TikTok mutation", async () => {
  const events: string[] = [];
  await processClaimedPost(context({ attemptId: "attempt-4", attemptNumber: 4 }), {
    publicPostingEnabled: false,
    beginSubmission: async (attemptId, postId, attemptNumber) => {
      events.push(`begin:${attemptId}:${postId}:${attemptNumber}`);
      return true;
    },
    directPost: async () => { events.push("direct-post"); return "publish-4"; },
    recordPublishId: async () => { events.push("record-publish-id"); },
  });
  assert.deepEqual(events, [
    "begin:attempt-4:post-1:4",
    "direct-post",
    "record-publish-id",
  ]);
});

test("a concurrent attempt-begin refusal never reaches TikTok", async () => {
  let directPosts = 0;
  await assert.rejects(() => processClaimedPost(context(), {
    publicPostingEnabled: false,
    beginSubmission: async () => false,
    directPost: async () => { directPosts += 1; return "duplicate"; },
    recordPublishId: async () => undefined,
  }), /publishing attempt is no longer safe/i);
  assert.equal(directPosts, 0);
});

test("attempt-begin infrastructure failure remains safely pre-acceptance", async () => {
  let directPosts = 0;
  await assert.rejects(() => processClaimedPost(context(), {
    publicPostingEnabled: false,
    beginSubmission: async () => { throw new Error("database secret"); },
    directPost: async () => { directPosts += 1; return "unexpected"; },
    recordPublishId: async () => undefined,
  }), (error: unknown) => {
    assert.equal(classifyPublishFailure(error).kind, "SAFE");
    return true;
  });
  assert.equal(directPosts, 0);
});

test("post-init and publish-ID persistence failures are ambiguous and sanitized", async () => {
  for (const dependencies of [
    {
      beginSubmission: async () => true,
      directPost: async () => { throw new Error("provider secret init error"); },
      recordPublishId: async () => undefined,
    },
    {
      beginSubmission: async () => true,
      directPost: async () => "publish-returned",
      recordPublishId: async () => { throw new Error("database secret write error"); },
    },
  ]) {
    await assert.rejects(() => processClaimedPost(context(), {
      publicPostingEnabled: false,
      ...dependencies,
    }), (error: unknown) => {
      assert.equal((error as { code?: string }).code, "POST_ACCEPTANCE_AMBIGUOUS");
      assert.doesNotMatch(String((error as Error).message), /secret|provider|database/);
      return true;
    });
  }
});

test("publish-ID persistence ambiguity retains the returned ID for reconciliation", async () => {
  await assert.rejects(() => processClaimedPost(context(), {
    publicPostingEnabled: false,
    beginSubmission: async () => true,
    directPost: async () => "publish-known",
    recordPublishId: async () => { throw new Error("database unavailable"); },
  }), (error: unknown) => {
    assert.equal((error as { publishId?: string }).publishId, "publish-known");
    return true;
  });
});

// Mutation target: allowing one post exception to escape the batch prevents later owned posts from publishing.
test("worker isolates each claimed post failure", async () => {
  const processed: string[] = [];
  const failed: string[] = [];
  const result = await processPostsIndependently([
    { id: "post-1" }, { id: "post-2" }, { id: "post-3" },
  ], async (post) => {
    processed.push(post.id);
    if (post.id === "post-2") throw new Error("boom");
    return "submitted";
  }, async (post) => { failed.push(post.id); });
  assert.deepEqual(processed, ["post-1", "post-2", "post-3"]);
  assert.deepEqual(failed, ["post-2"]);
  assert.deepEqual(result, ["submitted", null, "submitted"]);
});

test("worker isolation survives a failure-recording outage", async () => {
  const processed: string[] = [];
  const result = await processPostsIndependently([
    { id: "post-1" }, { id: "post-2" }, { id: "post-3" },
  ], async (post) => {
    processed.push(post.id);
    if (post.id === "post-2") throw new Error("publish failed");
    return post.id;
  }, async () => { throw new Error("audit database failed"); });
  assert.deepEqual(processed, ["post-1", "post-2", "post-3"]);
  assert.deepEqual(result, ["post-1", null, "post-3"]);
});
