import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentCreatorVideoLimit,
  type CreatorVideoLimitAdapter,
  type CreatorVideoLimitDependencies,
} from "./creatorVideoLimit";

const currentRecord = {
  accessToken: "access", refreshToken: "refresh", openId: "creator", scope: "user.info.basic,video.publish",
  connectedAt: "2026-08-23T00:00:00.000Z", tokenType: "Bearer", expiresAt: "2026-08-23T13:00:00.000Z",
  refreshExpiresAt: "2026-09-23T00:00:00.000Z",
};

function fixture(overrides: Partial<CreatorVideoLimitAdapter> = {}) {
  const calls: string[] = [];
  const adapter: CreatorVideoLimitAdapter = {
    async readConnection() { calls.push("readConnection"); return { error: false, data: { encryptedTokens: "sealed", scopes: ["video.publish"], accessExpiresAt: currentRecord.expiresAt } }; },
    async saveRefreshedConnection() { calls.push("saveRefreshedConnection"); return { error: false, updatedCount: 1 }; },
    ...overrides,
  };
  return { adapter, calls };
}

const dependencies: CreatorVideoLimitDependencies = {
  decrypt: () => currentRecord,
  isExpiringSoon: () => false,
  refresh: async () => ({ ok: true as const, record: currentRecord }),
  queryCreatorInfo: async () => ({ maxVideoPostDurationSeconds: 180 }),
  encrypt: () => "refreshed-sealed",
};

test("creator duration boundary returns only a current positive provider maximum", async () => {
  const { adapter, calls } = fixture();
  assert.deepEqual(await getCurrentCreatorVideoLimit("user-1", adapter, dependencies), { ok: true, maxDurationSeconds: 180 });
  assert.deepEqual(calls, ["readConnection"]);
});

test("missing connection, scope, invalid token, provider failure, and nonpositive maximum are retryable", async () => {
  const variants: Array<[Partial<CreatorVideoLimitAdapter>, Partial<typeof dependencies>]> = [
    [{ readConnection: async () => ({ error: false, data: null }) }, {}],
    [{ readConnection: async () => ({ error: false, data: { encryptedTokens: "sealed", scopes: [], accessExpiresAt: currentRecord.expiresAt } }) }, {}],
    [{}, { decrypt: () => null }],
    [{}, { queryCreatorInfo: async () => { throw new Error("provider secret"); } }],
    [{}, { queryCreatorInfo: async () => ({ maxVideoPostDurationSeconds: 0 }) }],
  ];
  for (const [adapterOverrides, dependencyOverrides] of variants) {
    const { adapter } = fixture(adapterOverrides);
    assert.deepEqual(await getCurrentCreatorVideoLimit("user-1", adapter, { ...dependencies, ...dependencyOverrides }), { ok: false, error: "Current TikTok video duration limit is unavailable." });
  }
});

test("expiring tokens refresh and persist before querying creator info", async () => {
  let persisted: unknown;
  const { adapter, calls } = fixture({
    async saveRefreshedConnection(input) {
      calls.push("saveRefreshedConnection");
      persisted = input;
      return { error: false, updatedCount: 1 };
    },
  });
  const dependencyCalls: string[] = [];
  const result = await getCurrentCreatorVideoLimit("user-1", adapter, {
    ...dependencies, isExpiringSoon: () => true,
    async refresh() { dependencyCalls.push("refresh"); return { ok: true, record: { ...currentRecord, accessToken: "new-access" } }; },
    async queryCreatorInfo(accessToken) { dependencyCalls.push(`query:${accessToken}`); return { maxVideoPostDurationSeconds: 300 }; },
  });
  assert.deepEqual(result, { ok: true, maxDurationSeconds: 300 });
  assert.deepEqual(calls, ["readConnection", "saveRefreshedConnection"]);
  assert.deepEqual(dependencyCalls, ["refresh", "query:new-access"]);
  assert.deepEqual(persisted, {
    userId: "user-1",
    expectedEncryptedTokens: "sealed",
    encryptedTokens: "refreshed-sealed",
    accessExpiresAt: currentRecord.expiresAt,
    refreshExpiresAt: currentRecord.refreshExpiresAt,
    scopes: ["user.info.basic", "video.publish"],
  });
});

test("refresh failure, persistence failure, or stale refresh CAS miss is retryable and skips creator query", async () => {
  let queried = 0;
  for (const [refresh, saveRefreshedConnection] of [
    [async () => ({ ok: false as const, message: "secret" }), async () => ({ error: false, updatedCount: 1 })],
    [async () => ({ ok: true as const, record: currentRecord }), async () => ({ error: true, updatedCount: 0 })],
    [async () => ({ ok: true as const, record: currentRecord }), async () => ({ error: false, updatedCount: 0 })],
  ] as const) {
    const { adapter } = fixture({ saveRefreshedConnection });
    const result = await getCurrentCreatorVideoLimit("user-1", adapter, {
      ...dependencies, isExpiringSoon: () => true, refresh,
      async queryCreatorInfo() { queried += 1; return { maxVideoPostDurationSeconds: 180 }; },
    });
    assert.equal(result.ok, false);
  }
  assert.equal(queried, 0);
});
