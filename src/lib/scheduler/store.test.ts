import assert from "node:assert/strict";
import test from "node:test";
import { createSchedulerStore, type SchedulerDatabaseClient } from "./store";

function fakeClient() {
  const calls: Array<{ kind: string; name: string; input: unknown }> = [];
  const client: SchedulerDatabaseClient = {
    async insert(table, input) {
      calls.push({ kind: "insert", name: table, input });
      return { id: "row-1", ...input };
    },
    async find(table, column, value) {
      calls.push({ kind: "find", name: table, input: { column, value } });
      return null;
    },
    async rpc(name, input) {
      calls.push({ kind: "rpc", name, input });
      return name === "save_active_tiktok_connection";
    },
    async update(table, id, input) {
      calls.push({ kind: "update", name: table, input: { id, ...input } });
      return { id, ...input };
    },
    async remove(table, column, value) {
      calls.push({ kind: "remove", name: table, input: { column, value } });
    },
  };
  return { calls, client };
}

test("user writes preserve the authenticated TikTok identity", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.upsertUser({
    tiktokOpenId: "open-1",
    displayName: "Creator",
    avatarUrl: null,
  });
  assert.deepEqual(calls[0], {
    kind: "insert",
    name: "scheduler_users",
    input: {
      tiktok_open_id: "open-1",
      display_name: "Creator",
      avatar_url: null,
      last_login_at: calls[0]?.input && (calls[0].input as Record<string, unknown>).last_login_at,
    },
  });
});

test("callback user writes do not overwrite suspension state", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.upsertUser({
    tiktokOpenId: "suspended-open-id",
    displayName: "Suspended creator",
    avatarUrl: null,
  });
  const input = calls[0]?.input as Record<string, unknown>;
  assert.equal("status" in input, false);
  assert.equal("suspended_at" in input, false);
});

test("legal acceptance writes only the current authenticated user record", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.acceptLegalAcceptance("user-1", {
    termsVersion: "2026-08-23",
    privacyVersion: "2026-08-23",
  });
  assert.deepEqual(calls[0], {
    kind: "update",
    name: "scheduler_users",
    input: {
      id: "user-1",
      terms_version: "2026-08-23",
      privacy_version: "2026-08-23",
      terms_accepted_at: (calls[0]?.input as Record<string, unknown>).terms_accepted_at,
      privacy_accepted_at: (calls[0]?.input as Record<string, unknown>).privacy_accepted_at,
    },
  });
});

test("publish IDs are persisted on the existing attempt", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.recordPublishId("attempt-1", "publish-1");
  assert.deepEqual(calls[0], {
    kind: "update",
    name: "publish_attempts",
    input: { id: "attempt-1", publish_id: "publish-1", status: "PROCESSING" },
  });
});

test("TikTok connections are persisted only by the active-user database RPC", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  const saved = await store.saveActiveConnection({
    userId: "user-1",
    tiktokOpenId: "open-1",
    encryptedTokens: "sealed",
    scopes: ["user.info.basic", "video.publish"],
    accessExpiresAt: "2026-08-22T00:00:00.000Z",
    refreshExpiresAt: "2027-08-22T00:00:00.000Z",
  });
  assert.equal(saved, true);
  assert.deepEqual(calls[0], {
    kind: "rpc",
    name: "save_active_tiktok_connection",
    input: {
      p_user_id: "user-1",
      p_tiktok_open_id: "open-1",
      p_encrypted_tokens: "sealed",
      p_scopes: ["user.info.basic", "video.publish"],
      p_access_expires_at: "2026-08-22T00:00:00.000Z",
      p_refresh_expires_at: "2027-08-22T00:00:00.000Z",
    },
  });
});

test("due jobs are claimed only through the atomic database RPC", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.claimDuePosts("2026-08-21T12:00:00.000Z", 10);
  assert.deepEqual(calls[0], {
    kind: "rpc",
    name: "claim_due_tiktok_posts",
    input: { p_now: "2026-08-21T12:00:00.000Z", p_limit: 10 },
  });
});

test("disconnect removes the user's token record and cancels future jobs", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.disconnectUser("user-1");
  assert.equal(calls[0]?.kind, "remove");
  assert.equal(calls[1]?.name, "cancel_tiktok_connection_jobs");
});
