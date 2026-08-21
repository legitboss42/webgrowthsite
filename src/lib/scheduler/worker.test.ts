import assert from "node:assert/strict";
import test from "node:test";
import { processClaimedPost, type PublishingContext } from "./worker";

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
    ...overrides,
  };
}

test("unaudited publishing is forced to SELF_ONLY", async () => {
  let privacy = "";
  const result = await processClaimedPost(context(), {
    publicPostingEnabled: false,
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
    directPost: async () => { submissions += 1; return "unexpected"; },
    recordPublishId: async () => undefined,
  });
  assert.equal(submissions, 0);
  assert.deepEqual(result, { status: "PROCESSING", publishId: "pub-existing" });
});
