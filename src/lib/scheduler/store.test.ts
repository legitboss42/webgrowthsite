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
