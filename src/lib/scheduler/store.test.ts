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
    async rpc(name, input) {
      calls.push({ kind: "rpc", name, input });
      return [];
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

test("TikTok connections are persisted as encrypted server records", async () => {
  const { calls, client } = fakeClient();
  const store = createSchedulerStore(client);
  await store.saveConnection({
    userId: "user-1",
    encryptedTokens: "sealed",
    scopes: ["user.info.basic", "video.publish"],
    accessExpiresAt: "2026-08-22T00:00:00.000Z",
    refreshExpiresAt: "2027-08-22T00:00:00.000Z",
  });
  assert.equal(calls[0]?.name, "tiktok_connections");
  assert.equal((calls[0]?.input as Record<string, unknown>).encrypted_tokens, "sealed");
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
