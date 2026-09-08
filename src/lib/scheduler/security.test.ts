import assert from "node:assert/strict";
import test from "node:test";
import { getSchedulerConfig, isOwnerOpenId } from "./config";
import { decryptTikTokTokens, encryptTikTokTokens } from "./crypto";
import {
  LEGACY_SCHEDULER_SESSION_COOKIE,
  createSchedulerSession,
  readSchedulerSession,
  readSchedulerSessionFromCookieStore,
} from "./session";
import {
  WEB_GROWTH_SESSION_COOKIE,
  createWebGrowthSessionValue,
} from "../webGrowthSession";

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

test("scheduler resolves identity from the canonical Web Growth session", () => {
  process.env.WEB_GROWTH_SESSION_SECRET = "web-growth-session-secret-at-least-32-characters";
  const canonical = createWebGrowthSessionValue({
    provider: "google",
    userId: "google-user",
    email: "owner@example.com",
    schedulerUserId: "scheduler-user",
    tiktokOpenId: "owner-open-id",
  }, 1_000, 60);
  const store = {
    get(name: string) {
      return name === WEB_GROWTH_SESSION_COOKIE ? { value: canonical } : undefined;
    },
  };
  assert.deepEqual(readSchedulerSessionFromCookieStore(store, 2_000), {
    userId: "scheduler-user",
    openId: "owner-open-id",
  });
});

test("scheduler legacy cookie remains readable during migration", () => {
  process.env.SCHEDULER_SESSION_SECRET = "session-test-secret";
  const legacy = createSchedulerSession("legacy-user", "legacy-open", 1_000, 60);
  const store = {
    get(name: string) {
      return name === LEGACY_SCHEDULER_SESSION_COOKIE ? { value: legacy } : undefined;
    },
  };
  assert.equal(readSchedulerSessionFromCookieStore(store, 2_000)?.userId, "legacy-user");
});
