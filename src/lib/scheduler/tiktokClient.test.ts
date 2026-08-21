import assert from "node:assert/strict";
import test from "node:test";
import { createTikTokSchedulerClient } from "./tiktokClient";

test("photo Direct Post sends explicit creator-controlled settings", async () => {
  const sent: Record<string, unknown>[] = [];
  const client = createTikTokSchedulerClient(async (_url, init) => {
    sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ data: { publish_id: "pub-1" }, error: { code: "ok" } }));
  });
  const result = await client.directPostPhotos({
    accessToken: "token",
    title: "Title",
    description: "Caption",
    privacyLevel: "SELF_ONLY",
    disableComment: false,
    autoAddMusic: false,
    brandContentToggle: false,
    brandOrganicToggle: true,
    photoCoverIndex: 0,
    photoImages: ["https://webgrowth.info/api/scheduler/media/one"],
  });
  assert.equal(result.publishId, "pub-1");
  assert.equal(sent[0]?.post_mode, "DIRECT_POST");
  assert.deepEqual((sent[0]?.post_info as Record<string, unknown>).privacy_level, "SELF_ONLY");
});

test("creator info exposes only TikTok-returned publishing choices", async () => {
  const client = createTikTokSchedulerClient(async () => new Response(JSON.stringify({
    data: {
      creator_username: "creator",
      creator_nickname: "Creator",
      privacy_level_options: ["SELF_ONLY"],
      comment_disabled: false,
      duet_disabled: true,
      stitch_disabled: true,
      max_video_post_duration_sec: 180,
    },
    error: { code: "ok" },
  })));
  const info = await client.queryCreatorInfo("token");
  assert.deepEqual(info.privacyLevelOptions, ["SELF_ONLY"]);
  assert.equal(info.maxVideoPostDurationSeconds, 180);
});
