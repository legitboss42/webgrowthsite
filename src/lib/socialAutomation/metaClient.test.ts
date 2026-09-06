import test from "node:test";
import assert from "node:assert/strict";

import { createMetaClient, MetaApiError } from "./metaClient";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("creates and publishes an Instagram Reel through a media container", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const replies = [
    jsonResponse({ id: "container-1" }),
    jsonResponse({ status_code: "FINISHED", status: "ready" }),
    jsonResponse({ id: "ig-media-1" }),
  ];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return replies.shift()!;
    },
  });

  const containerId = await client.createInstagramReel({
    accessToken: "page-token",
    igUserId: "ig-1",
    videoUrl: "https://cdn.example/video.mp4",
    caption: "Useful caption",
  });
  assert.equal(containerId, "container-1");
  assert.equal(await client.readInstagramContainer({ accessToken: "page-token", containerId }), "FINISHED");
  assert.equal(
    await client.publishInstagramContainer({ accessToken: "page-token", igUserId: "ig-1", containerId }),
    "ig-media-1"
  );
  assert.match(calls[0].url, /v99\.0\/ig-1\/media/);
  assert.match(calls[0].url, /media_type=REELS/);
  assert.match(calls[0].url, /video_url=https%3A%2F%2Fcdn\.example%2Fvideo\.mp4/);
  assert.doesNotMatch(calls[0].url, /page-token/);
});

test("publishes a hosted Facebook Page Reel using start, upload, finish", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const replies = [
    jsonResponse({ video_id: "video-1", upload_url: "https://rupload.facebook.com/upload/video-1" }),
    jsonResponse({ success: true }),
    jsonResponse({ success: true }),
  ];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return replies.shift()!;
    },
  });

  const videoId = await client.publishFacebookReel({
    pageAccessToken: "page-token",
    videoUrl: "https://cdn.example/meta.mp4",
    description: "Facebook description",
    title: "Article title",
  });
  assert.equal(videoId, "video-1");
  assert.match(calls[0].url, /\/me\/video_reels/);
  assert.equal(new Headers(calls[1].init?.headers).get("file_url"), "https://cdn.example/meta.mp4");
  assert.equal(new Headers(calls[1].init?.headers).get("Authorization"), "OAuth page-token");
  assert.match(calls[2].url, /upload_phase=finish/);
  assert.match(calls[2].url, /video_state=PUBLISHED/);
});

test("classifies provider 5xx as retryable without leaking a token", async () => {
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async () => jsonResponse({ error: { message: "bad page-token", code: 2 } }, 503),
  });
  await assert.rejects(
    () =>
      client.createInstagramReel({
        accessToken: "page-token",
        igUserId: "ig-1",
        videoUrl: "https://cdn.example/video.mp4",
        caption: "caption",
      }),
    (error: unknown) => {
      assert.ok(error instanceof MetaApiError);
      assert.equal(error.retryable, true);
      assert.doesNotMatch(error.message, /page-token/);
      return true;
    }
  );
});
