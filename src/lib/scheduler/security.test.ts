import assert from "node:assert/strict";
import test from "node:test";
import { getSchedulerConfig, isOwnerOpenId } from "./config";
import { decryptTikTokTokens, encryptTikTokTokens } from "./crypto";
import { createSchedulerSession, readSchedulerSession } from "./session";

test("publishing gates fail closed and owner IDs are exact", () => {
  process.env.OWNER_TIKTOK_OPEN_IDS = "owner-1, owner-2";
  delete process.env.TIKTOK_DIRECT_POST_ENABLED;
  process.env.TIKTOK_PUBLIC_POSTING_ENABLED = "true";
  const config = getSchedulerConfig();
  assert.equal(config.directPostEnabled, false);
  assert.equal(config.publicPostingEnabled, false);
  assert.equal(isOwnerOpenId("owner-1"), true);
  assert.equal(isOwnerOpenId("owner"), false);
});

test("TikTok token encryption rejects tampering", () => {
  process.env.TIKTOK_TOKEN_ENCRYPTION_KEY = "token-test-secret";
  const sealed = encryptTikTokTokens({ accessToken: "access", refreshToken: "refresh" });
  assert.deepEqual(decryptTikTokTokens(sealed), {
    accessToken: "access",
    refreshToken: "refresh",
  });
  assert.equal(decryptTikTokTokens(`${sealed}x`), null);
});

test("scheduler sessions expire at their signed boundary", () => {
  process.env.SCHEDULER_SESSION_SECRET = "session-test-secret";
  const value = createSchedulerSession("user-1", "open-1", 1_000, 60);
  assert.equal(readSchedulerSession(value, 60_999)?.userId, "user-1");
  assert.equal(readSchedulerSession(value, 61_000), null);
});
