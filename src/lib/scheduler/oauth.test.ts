import assert from "node:assert/strict";
import test from "node:test";
import { buildSchedulerAuthorizeUrl, normalizeSchedulerReturnPath } from "./oauth";

test("scheduler publishing authorization requests Direct Post scope", () => {
  process.env.TIKTOK_CLIENT_KEY = "client";
  process.env.TIKTOK_SCHEDULER_REDIRECT_URI = "https://webgrowth.info/api/scheduler/auth/callback/";
  const url = new URL(buildSchedulerAuthorizeUrl("state", "publishing"));
  assert.equal(url.searchParams.get("scope"), "user.info.basic,video.publish");
});

test("scheduler redirects cannot escape scheduler routes", () => {
  assert.equal(normalizeSchedulerReturnPath("/scheduler/dashboard/"), "/scheduler/dashboard/");
  assert.equal(normalizeSchedulerReturnPath("//evil.test"), "/scheduler/dashboard/");
  assert.equal(normalizeSchedulerReturnPath("/admin/whatsapp"), "/scheduler/dashboard/");
});
