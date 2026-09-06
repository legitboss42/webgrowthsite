import test from "node:test";
import assert from "node:assert/strict";

import { createMetaClient, MetaApiError } from "./metaClient";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("exchanges a Meta OAuth code for a user token", async () => {
  const calls: string[] = [];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url) => {
      calls.push(String(url));
      return jsonResponse({ access_token: "user-token", token_type: "bearer", expires_in: 3600 });
    },
  });
  const token = await client.exchangeCode({
    appId: "app-1",
    appSecret: "app-secret",
    code: "auth-code",
    redirectUri: "https://webgrowth.info/api/admin/content-automation/meta/callback/",
    nowMs: Date.parse("2026-09-06T01:00:00.000Z"),
  });
  assert.equal(token.userAccessToken, "user-token");
  assert.equal(token.expiresAt, "2026-09-06T02:00:00.000Z");
  assert.match(calls[0], /oauth\/access_token/);
  assert.match(calls[0], /client_id=app-1/);
  assert.match(calls[0], /code=auth-code/);
});

test("exchanges the short-lived user token for a long-lived token without putting secrets in the URL", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ access_token: "long-user-token", token_type: "bearer", expires_in: 5_184_000 });
    },
  });

  const token = await client.exchangeLongLivedUserToken({
    appId: "app-1",
    appSecret: "app-secret",
    shortLivedUserAccessToken: "short-user-token",
    nowMs: Date.parse("2026-09-06T01:00:00.000Z"),
  });

  assert.equal(token.userAccessToken, "long-user-token");
  assert.equal(token.expiresAt, "2026-11-05T01:00:00.000Z");
  assert.equal(calls[0].init?.method, "POST");
  assert.doesNotMatch(calls[0].url, /app-secret|short-user-token/);
  const body = String(calls[0].init?.body || "");
  assert.match(body, /grant_type=fb_exchange_token/);
  assert.match(body, /client_secret=app-secret/);
  assert.match(body, /fb_exchange_token=short-user-token/);
});

test("resolves the only Facebook Page linked to an Instagram professional account", async () => {
  const calls: string[] = [];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url) => {
      calls.push(String(url));
      return jsonResponse({
        data: [
          { id: "page-without-ig", name: "Other", access_token: "other-token", tasks: ["CREATE_CONTENT"] },
          {
            id: "page-1",
            name: "Web Growth",
            access_token: "page-token",
            tasks: ["CREATE_CONTENT", "MANAGE"],
            instagram_business_account: { id: "ig-1", username: "web.growth", name: "Web Growth" },
          },
        ],
      });
    },
  });
  const connection = await client.resolveManagedPage({ userAccessToken: "user-token" });
  assert.equal(connection.facebookPageId, "page-1");
  assert.equal(connection.pageAccessToken, "page-token");
  assert.equal(connection.instagramAccountId, "ig-1");
  assert.equal(connection.instagramAccountName, "web.growth");
  assert.match(calls[0], /\/me\/accounts/);
  assert.match(calls[0], /instagram_business_account/);
});

test("requires an explicit Page choice when multiple Instagram-linked Pages exist", async () => {
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async () =>
      jsonResponse({
        data: [
          { id: "page-1", name: "One", access_token: "token-1", instagram_business_account: { id: "ig-1" } },
          { id: "page-2", name: "Two", access_token: "token-2", instagram_business_account: { id: "ig-2" } },
        ],
      }),
  });
  await assert.rejects(
    () => client.resolveManagedPage({ userAccessToken: "user-token" }),
    /More than one Instagram-linked Facebook Page/
  );
  const selected = await client.resolveManagedPage({ userAccessToken: "user-token", preferredPageId: "page-2" });
  assert.equal(selected.facebookPageId, "page-2");
});

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

test("exposes Facebook start, upload, and finish as retry-safe stages", async () => {
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

  const session = await client.startFacebookReel({ pageAccessToken: "page-token" });
  assert.deepEqual(session, {
    videoId: "video-1",
    uploadUrl: "https://rupload.facebook.com/upload/video-1",
  });
  await client.uploadFacebookReel({
    pageAccessToken: "page-token",
    uploadUrl: session.uploadUrl,
    videoUrl: "https://cdn.example/meta.mp4",
  });
  await client.finishFacebookReel({
    pageAccessToken: "page-token",
    videoId: session.videoId,
    description: "Facebook description",
    title: "Article title",
  });

  assert.match(calls[0].url, /\/me\/video_reels/);
  assert.equal(new Headers(calls[1].init?.headers).get("file_url"), "https://cdn.example/meta.mp4");
  assert.equal(new Headers(calls[1].init?.headers).get("Authorization"), "OAuth page-token");
  assert.match(calls[2].url, /upload_phase=finish/);
  assert.match(calls[2].url, /video_state=PUBLISHED/);
});

test("publishes a hosted Facebook Page Reel using the staged methods", async () => {
  const replies = [
    jsonResponse({ video_id: "video-1", upload_url: "https://rupload.facebook.com/upload/video-1" }),
    jsonResponse({ success: true }),
    jsonResponse({ success: true }),
  ];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async () => replies.shift()!,
  });
  assert.equal(
    await client.publishFacebookReel({
      pageAccessToken: "page-token",
      videoUrl: "https://cdn.example/meta.mp4",
      description: "Facebook description",
      title: "Article title",
    }),
    "video-1"
  );
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
