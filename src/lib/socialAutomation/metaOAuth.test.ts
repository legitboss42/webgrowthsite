import test from "node:test";
import assert from "node:assert/strict";

import { createMetaClient } from "./metaClient";
import {
  buildMetaAuthorizeUrl,
  buildMetaSdkLoginOptions,
  createMetaOAuthState,
  createMetaPendingConnection,
  readMetaOAuthState,
  readMetaPendingConnection,
} from "./metaOAuth";

test("Meta OAuth state is sealed, expires, and preserves only a safe return path", () => {
  const now = Date.parse("2026-09-06T02:00:00.000Z");
  const state = createMetaOAuthState("test-secret", "/admin/content-automation/?tab=connections", now);
  assert.notEqual(state.cookieValue.includes("content-automation"), true);

  const parsed = readMetaOAuthState(state.cookieValue, "test-secret", now + 60_000);
  assert.equal(parsed?.state, state.state);
  assert.equal(parsed?.returnTo, "/admin/content-automation/?tab=connections");
  assert.equal(readMetaOAuthState(`${state.cookieValue}x`, "test-secret", now + 60_000), null);
  assert.equal(readMetaOAuthState(state.cookieValue, "test-secret", now + 11 * 60_000), null);

  const unsafe = createMetaOAuthState("test-secret", "https://evil.example/steal", now);
  assert.equal(readMetaOAuthState(unsafe.cookieValue, "test-secret", now)?.returnTo, "/admin/content-automation/");
});

test("Meta pending selection state is encrypted, tamper-resistant, and expires", () => {
  const now = Date.parse("2026-09-07T09:00:00.000Z");
  const pending = createMetaPendingConnection(
    "pending-secret",
    {
      userAccessToken: "long-lived-user-token",
      expiresAt: "2026-11-06T09:00:00.000Z",
    },
    now
  );

  assert.equal(pending.cookieValue.includes("long-lived-user-token"), false);
  const parsed = readMetaPendingConnection(pending.cookieValue, "pending-secret", now + 60_000);
  assert.deepEqual(parsed, {
    userAccessToken: "long-lived-user-token",
    expiresAt: "2026-11-06T09:00:00.000Z",
    createdAt: now,
  });
  assert.equal(readMetaPendingConnection(`${pending.cookieValue}x`, "pending-secret", now + 60_000), null);
  assert.equal(readMetaPendingConnection(pending.cookieValue, "pending-secret", now + 11 * 60_000), null);
});

test("Meta SDK Business Login options use config_id and authorization-code response", () => {
  const options = buildMetaSdkLoginOptions("config-123");
  assert.deepEqual(options, {
    config_id: "config-123",
    response_type: "code",
    override_default_response_type: true,
  });
  assert.equal("scope" in options, false);
});

test("Meta authorize URL requests only the publishing permissions used by the feature", () => {
  const url = new URL(
    buildMetaAuthorizeUrl({
      graphVersion: "v99.0",
      appId: "app-1",
      redirectUri: "https://webgrowth.info/api/admin/content-automation/meta/callback/",
      state: "state-1",
    })
  );
  assert.equal(url.hostname, "www.facebook.com");
  assert.equal(url.searchParams.get("client_id"), "app-1");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("auth_type"), "rerequest");
  const scopes = new Set((url.searchParams.get("scope") || "").split(","));
  for (const scope of [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ]) {
    assert.equal(scopes.has(scope), true);
  }
});

test("Meta Business Login uses config_id instead of a raw scope bundle", () => {
  const url = new URL(
    buildMetaAuthorizeUrl({
      graphVersion: "v99.0",
      appId: "app-1",
      redirectUri: "https://webgrowth.info/api/admin/content-automation/meta/callback/",
      state: "state-1",
      configId: "config-123",
    })
  );

  assert.equal(url.searchParams.get("config_id"), "config-123");
  assert.equal(url.searchParams.get("override_default_response_type"), "true");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("auth_type"), "rerequest");
  assert.equal(url.searchParams.get("scope"), null);
});

test("initial Meta code exchange keeps the app secret and authorization code out of the URL", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = createMetaClient({
    graphVersion: "v99.0",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ access_token: "short-token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.exchangeCode({
    appId: "app-1",
    appSecret: "super-secret",
    code: "authorization-code",
    redirectUri: "https://webgrowth.info/api/admin/content-automation/meta/callback/",
  });

  assert.equal(calls[0].init?.method, "POST");
  assert.doesNotMatch(calls[0].url, /super-secret|authorization-code/);
  const body = String(calls[0].init?.body || "");
  assert.match(body, /client_secret=super-secret/);
  assert.match(body, /code=authorization-code/);
});