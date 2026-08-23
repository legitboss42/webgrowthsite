import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSchedulerAuthorizeUrl,
  createSchedulerOAuthState,
  getSchedulerCallbackRelay,
  normalizeSchedulerReturnPath,
  schedulerRedirectUri,
  SCHEDULER_OAUTH_STATE_COOKIE,
} from "./oauth";
import { canStartSchedulerOAuth } from "./legal";

test("scheduler publishing authorization requests Direct Post scope", () => {
  process.env.TIKTOK_CLIENT_KEY = "client";
  process.env.TIKTOK_SCHEDULER_REDIRECT_URI = "https://webgrowth.info/connect/tiktok/callback/";
  const url = new URL(buildSchedulerAuthorizeUrl("state", "publishing"));
  assert.equal(url.searchParams.get("scope"), "user.info.basic,video.publish");
  assert.equal(url.searchParams.get("redirect_uri"), "https://webgrowth.info/connect/tiktok/callback/");
});

test("scheduler redirects cannot escape scheduler routes", () => {
  assert.equal(normalizeSchedulerReturnPath("/scheduler/dashboard/"), "/scheduler/dashboard/");
  assert.equal(normalizeSchedulerReturnPath("//evil.test"), "/scheduler/dashboard/");
  assert.equal(normalizeSchedulerReturnPath("/admin/whatsapp"), "/scheduler/dashboard/");
});

test("scheduler defaults to the registered TikTok callback alias", () => {
  delete process.env.TIKTOK_SCHEDULER_REDIRECT_URI;
  delete process.env.TIKTOK_REDIRECT_URI;

  assert.equal(schedulerRedirectUri(), "https://webgrowth.info/connect/tiktok/callback/");
});

test("scheduler ignores the unregistered legacy callback override", () => {
  process.env.TIKTOK_SCHEDULER_REDIRECT_URI = "https://webgrowth.info/api/scheduler/auth/callback/";
  process.env.TIKTOK_REDIRECT_URI = "https://webgrowth.info/connect/tiktok/callback/";

  assert.equal(schedulerRedirectUri(), "https://webgrowth.info/connect/tiktok/callback/");
});

test("registered TikTok callback relays matching scheduler OAuth state", () => {
  process.env.SCHEDULER_SESSION_SECRET = "scheduler-test-secret-at-least-32-characters";
  const { payload, cookie } = createSchedulerOAuthState("/scheduler/settings/", "publishing");
  const callbackUrl = new URL("https://webgrowth.info/connect/tiktok/callback/");
  callbackUrl.searchParams.set("code", "sandbox-code");
  callbackUrl.searchParams.set("state", payload.state);

  const relay = getSchedulerCallbackRelay(
    callbackUrl,
    `${SCHEDULER_OAUTH_STATE_COOKIE}=${cookie}`,
  );

  assert.equal(
    relay?.toString(),
    `https://webgrowth.info/api/scheduler/auth/callback/?code=sandbox-code&state=${payload.state}`,
  );
});

const activeAccount = { status: "ACTIVE", suspendedAt: null, deletionRequestedAt: null } as const;

test("disabled public enrollment denies unauthenticated OAuth before state is created", () => {
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: false }, null, null), false);
});

test("configured Sandbox targets retain an explicit server-side OAuth allowance", () => {
  process.env.SCHEDULER_SANDBOX_TIKTOK_OPEN_IDS = "sandbox-owner,sandbox-target";
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: false }, "sandbox-target", activeAccount), true);
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: false }, "sandbox", activeAccount), false);
});

test("public enrollment permits a genuinely new creator without a scheduler session", () => {
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: true }, null, null), true);
});

test("suspended and deletion-requested signed sessions cannot start OAuth", () => {
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: true }, "creator-1", { status: "SUSPENDED", suspendedAt: null, deletionRequestedAt: null }), false);
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: true }, "creator-1", { status: "ACTIVE", suspendedAt: null, deletionRequestedAt: "2026-08-23T00:00:00.000Z" }), false);
  assert.equal(canStartSchedulerOAuth({ publicEnrollment: false }, "sandbox-target", { status: "ACTIVE", suspendedAt: "2026-08-23T00:00:00.000Z", deletionRequestedAt: null }), false);
});

test("authorize route returns 503 before creating OAuth state when enrollment is unavailable", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../../app/api/scheduler/auth/authorize/route.ts", import.meta.url), "utf8"),
  );
  assert.match(source, /canStartSchedulerOAuth/);
  assert.match(source, /getUser\(session\.userId\)/);
  assert.match(source, /status:\s*503/);
  assert.ok(source.indexOf("canStartSchedulerOAuth") < source.indexOf("createSchedulerOAuthState"));
});
