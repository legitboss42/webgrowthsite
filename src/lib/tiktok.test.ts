import assert from "node:assert/strict";
import test from "node:test";
import { exchangeTikTokCode } from "./tiktok";

test("TikTok code exchange can use a caller-provided redirect URI", async () => {
  const originalFetch = globalThis.fetch;
  const originalClientKey = process.env.TIKTOK_CLIENT_KEY;
  const originalClientSecret = process.env.TIKTOK_CLIENT_SECRET;

  process.env.TIKTOK_CLIENT_KEY = "client-key";
  process.env.TIKTOK_CLIENT_SECRET = "client-secret";

  let requestBody = "";
  globalThis.fetch = async (_url, init) => {
    requestBody = String(init?.body);
    return new Response(JSON.stringify({
      access_token: "access",
      expires_in: 3600,
      open_id: "creator-open-id",
      refresh_expires_in: 86400,
      refresh_token: "refresh",
      scope: "user.info.basic,video.publish",
      token_type: "Bearer",
    }), { status: 200 });
  };

  try {
    const result = await exchangeTikTokCode("auth-code", "https://webgrowth.info/custom/scheduler/callback/");

    assert.equal(result.ok, true);
    assert.match(requestBody, /redirect_uri=https%3A%2F%2Fwebgrowth\.info%2Fcustom%2Fscheduler%2Fcallback%2F/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalClientKey === undefined) delete process.env.TIKTOK_CLIENT_KEY;
    else process.env.TIKTOK_CLIENT_KEY = originalClientKey;
    if (originalClientSecret === undefined) delete process.env.TIKTOK_CLIENT_SECRET;
    else process.env.TIKTOK_CLIENT_SECRET = originalClientSecret;
  }
});
