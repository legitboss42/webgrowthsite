import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
function source(path: string) {
  return readFileSync(`${root}/${path}`, "utf8");
}

test("Google callback writes the canonical Web Growth session", () => {
  const text = source("src/app/api/auth/google/callback/route.ts");
  assert.match(text, /WEB_GROWTH_SESSION_COOKIE/);
  assert.match(text, /createWebGrowthGoogleSessionValue/);
  assert.match(text, /response\.cookies\.set\(\{[\s\S]*name:\s*WEB_GROWTH_SESSION_COOKIE/);
});

test("Google ID-token session route writes the canonical Web Growth session", () => {
  const text = source("src/app/api/auth/google/session/route.ts");
  assert.match(text, /WEB_GROWTH_SESSION_COOKIE/);
  assert.match(text, /createWebGrowthGoogleSessionValue/);
});

test("workspace password sign-in writes one canonical Web Growth session", () => {
  const text = source("src/app/api/auth/password/session/route.ts");
  assert.match(text, /WEB_GROWTH_SESSION_COOKIE/);
  assert.match(text, /createWebGrowthPasswordSessionValue/);
  assert.doesNotMatch(text, /name:\s*getWorkspacePasswordCookieName\(\)/);
});

test("workspace password sign-in accepts the unified dashboard as a safe destination", () => {
  const text = source("src/app/api/auth/password/session/route.ts");
  assert.match(text, /path\.startsWith\("\/dashboard\/"\)/);
});

test("TikTok OAuth augments an existing canonical account session", () => {
  const text = source("src/app/api/scheduler/auth/callback/route.ts");
  assert.match(text, /readWebGrowthSessionFromCookieStore/);
  assert.match(text, /mergeWebGrowthSchedulerIdentity/);
  assert.match(text, /WEB_GROWTH_SESSION_COOKIE/);
});

test("workspace logout clears canonical and legacy auth cookies", () => {
  const text = source("src/app/api/auth/workspace/logout/route.ts");
  assert.match(text, /WEB_GROWTH_SESSION_COOKIE/);
  assert.match(text, /clearCookie\(response, WEB_GROWTH_SESSION_COOKIE\)/);
  assert.match(text, /getGoogleAuthCookieName/);
  assert.match(text, /getWorkspacePasswordCookieName/);
});

test("canonical logout route exists and delegates to the shared logout handler", () => {
  const routePath = `${root}/src/app/api/auth/logout/route.ts`;
  assert.equal(existsSync(routePath), true, "expected /api/auth/logout/ route to exist");
  const text = readFileSync(routePath, "utf8");
  assert.match(text, /workspace\/logout\/route/);
  assert.match(text, /POST/);
});

test("scheduler store can resolve the existing user by TikTok open id", () => {
  const text = source("src/lib/scheduler/store.ts");
  assert.match(text, /getUserByTikTokOpenId\(openId:\s*string\)/);
  assert.match(text, /client\.find\("scheduler_users",\s*"tiktok_open_id",\s*openId\)/);
});
