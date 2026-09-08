import assert from "node:assert/strict";
import test from "node:test";

import {
  WEB_GROWTH_SESSION_COOKIE,
  createWebGrowthSessionValue,
  mergeWebGrowthSchedulerIdentity,
  readWebGrowthSession,
  readWebGrowthSessionFromCookieStore,
} from "./webGrowthSession";

type CookieStore = { get(name: string): { value?: string } | undefined };

function cookieStore(value?: string): CookieStore {
  return {
    get(name: string) {
      if (name !== WEB_GROWTH_SESSION_COOKIE || !value) return undefined;
      return { value };
    },
  };
}

function withSecret<T>(run: () => T) {
  const previous = process.env.WEB_GROWTH_SESSION_SECRET;
  process.env.WEB_GROWTH_SESSION_SECRET = "test-web-growth-session-secret-32-bytes-minimum";
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.WEB_GROWTH_SESSION_SECRET;
    else process.env.WEB_GROWTH_SESSION_SECRET = previous;
  }
}

test("creates and reads a canonical Google Web Growth session", () => withSecret(() => {
  const value = createWebGrowthSessionValue({
    provider: "google",
    userId: "google-user-1",
    email: "Owner@Example.com",
    fullName: "  Web Growth Owner  ",
  }, 1_000, 60);

  const session = readWebGrowthSession(value, 2_000);
  assert.equal(session?.provider, "google");
  assert.equal(session?.userId, "google-user-1");
  assert.equal(session?.email, "owner@example.com");
  assert.equal(session?.fullName, "Web Growth Owner");
  assert.equal(session?.schedulerUserId, null);
  assert.equal(session?.tiktokOpenId, null);
}));

test("creates password and TikTok primary identities without inventing privileges", () => withSecret(() => {
  const password = readWebGrowthSession(createWebGrowthSessionValue({
    provider: "password",
    userId: "password-user-1",
    email: "member@example.com",
    fullName: null,
    workspaceId: "11111111-1111-4111-8111-111111111111",
    workspaceRole: "agent",
  }, 5_000, 60), 6_000);
  assert.equal(password?.provider, "password");
  assert.equal(password?.workspaceRole, "agent");
  assert.equal(password?.schedulerUserId, null);

  const tiktok = readWebGrowthSession(createWebGrowthSessionValue({
    provider: "tiktok",
    userId: "scheduler-user-1",
    schedulerUserId: "scheduler-user-1",
    tiktokOpenId: "open-id-1",
  }, 5_000, 60), 6_000);
  assert.equal(tiktok?.provider, "tiktok");
  assert.equal(tiktok?.email, null);
  assert.equal(tiktok?.schedulerUserId, "scheduler-user-1");
  assert.equal(tiktok?.tiktokOpenId, "open-id-1");
}));

test("scheduler identity augments the same account instead of replacing its provider", () => withSecret(() => {
  const original = readWebGrowthSession(createWebGrowthSessionValue({
    provider: "google",
    userId: "google-user-1",
    email: "owner@example.com",
    fullName: "Owner",
  }, 10_000, 60), 11_000);
  assert.ok(original);

  const merged = mergeWebGrowthSchedulerIdentity(original, {
    userId: "scheduler-user-1",
    openId: "owner-open-id",
  });
  assert.equal(merged.provider, "google");
  assert.equal(merged.email, "owner@example.com");
  assert.equal(merged.schedulerUserId, "scheduler-user-1");
  assert.equal(merged.tiktokOpenId, "owner-open-id");
}));

test("expired or malformed canonical sessions fail closed", () => withSecret(() => {
  const value = createWebGrowthSessionValue({
    provider: "google",
    userId: "google-user-1",
    email: "owner@example.com",
  }, 20_000, 1);
  assert.equal(readWebGrowthSession(value, 21_001), null);
  assert.equal(readWebGrowthSession("not-a-cookie", 20_500), null);
}));

test("cookie-store reader uses only the canonical Web Growth cookie", () => withSecret(() => {
  const value = createWebGrowthSessionValue({
    provider: "google",
    userId: "google-user-1",
    email: "owner@example.com",
  }, 30_000, 60);
  assert.equal(readWebGrowthSessionFromCookieStore(cookieStore(value), 31_000)?.email, "owner@example.com");
  assert.equal(readWebGrowthSessionFromCookieStore(cookieStore(), 31_000), null);
}));
