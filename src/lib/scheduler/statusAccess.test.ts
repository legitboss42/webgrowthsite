import assert from "node:assert/strict";
import test from "node:test";
import { readOwnedPostStatus } from "./statusAccess";

test("owned status reads bind both the post ID and scheduler user ID", async () => {
  const calls: Array<[string, string]> = [];
  const query = {
    select() { return this; },
    eq(column: string, value: string) { calls.push([column, value]); return this; },
    async maybeSingle() { return { data: { status: "PUBLISHED" }, error: null }; },
  };
  const client = { from(table: string) { assert.equal(table, "scheduled_posts"); return query; } };
  await readOwnedPostStatus(client, "post-1", "user-1");
  assert.deepEqual(calls, [["id", "post-1"], ["user_id", "user-1"]]);
});
