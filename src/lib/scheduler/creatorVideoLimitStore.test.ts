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

function storeFixture(data: boolean | null, error: unknown = null) {
  let invocation: { name: string; parameters: unknown } | null = null;
  const client = {
    from() {
      throw new Error("secret credential must never be placed in a PostgREST URL filter");
    },
    async rpc(name: string, parameters: unknown) {
      invocation = { name, parameters };
      return { data, error };
    },
  };
  return { client, invocation: () => invocation };
}

test("refreshed creator credentials use the security-definer RPC request body", async () => {
  const fixture = storeFixture(true);
  assert.deepEqual(await saveRefreshedCreatorConnection(fixture.client, input), { error: false, updatedCount: 1 });
  assert.deepEqual(fixture.invocation(), {
    name: "refresh_active_tiktok_connection",
    parameters: {
      p_user_id: "user-1",
      p_expected_encrypted_tokens: "sealed-old",
      p_encrypted_tokens: "sealed-new",
      p_scopes: ["video.publish"],
      p_access_expires_at: "2026-08-24T00:00:00.000Z",
      p_refresh_expires_at: "2026-09-24T00:00:00.000Z",
    },
  });
});

test("the refresh RPC false result reports a zero-row stale compare-and-set", async () => {
  const fixture = storeFixture(false);
  assert.deepEqual(await saveRefreshedCreatorConnection(fixture.client, input), { error: false, updatedCount: 0 });
});

test("the refresh RPC database failure remains sanitized and retryable", async () => {
  const fixture = storeFixture(null, new Error("database /secret"));
  assert.deepEqual(await saveRefreshedCreatorConnection(fixture.client, input), { error: true, updatedCount: 0 });
});
