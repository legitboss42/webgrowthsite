import assert from "node:assert/strict";
import test from "node:test";
import { saveRefreshedCreatorConnection } from "./creatorVideoLimitStore";

const input = {
  userId: "user-1",
  expectedEncryptedTokens: "sealed-old",
  encryptedTokens: "sealed-new",
  accessExpiresAt: "2026-08-24T00:00:00.000Z",
  refreshExpiresAt: "2026-09-24T00:00:00.000Z",
  scopes: ["video.publish"],
};

function storeFixture(rows: Array<{ user_id: string }>) {
  const filters: Array<[string, string]> = [];
  let updateValues: unknown;
  const query = {
    eq(column: string, value: string) {
      filters.push([column, value]);
      return query;
    },
    async select(columns: string) {
      assert.equal(columns, "user_id");
      return { data: rows, error: null };
    },
  };
  const client = {
    from(table: string) {
      assert.equal(table, "tiktok_connections");
      return {
        update(values: unknown) {
          updateValues = values;
          return query;
        },
      };
    },
  };
  return { client, filters, getUpdateValues: () => updateValues };
}

test("refreshed creator credentials persist with an exact old-credential compare-and-set", async () => {
  const fixture = storeFixture([{ user_id: "user-1" }]);
  assert.deepEqual(await saveRefreshedCreatorConnection(fixture.client, input), { error: false, updatedCount: 1 });
  assert.deepEqual(fixture.filters, [
    ["user_id", "user-1"],
    ["encrypted_tokens", "sealed-old"],
  ]);
  assert.deepEqual(fixture.getUpdateValues(), {
    encrypted_tokens: "sealed-new",
    access_expires_at: "2026-08-24T00:00:00.000Z",
    refresh_expires_at: "2026-09-24T00:00:00.000Z",
    scopes: ["video.publish"],
  });
});

test("a concurrent reconnect produces a zero-row stale refresh result", async () => {
  const fixture = storeFixture([]);
  assert.deepEqual(await saveRefreshedCreatorConnection(fixture.client, input), { error: false, updatedCount: 0 });
});
