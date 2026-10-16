import assert from "node:assert/strict";
import test from "node:test";
import { createWhatsAppTtlCache } from "./ttlCache";

test("deduplicates concurrent loads for the same key", async () => {
  let loads = 0;
  const cache = createWhatsAppTtlCache<string, number>({ ttlMs: 1_000 });
  let resolve!: (value: number) => void;
  const pending = new Promise<number>((done) => { resolve = done; });
  const loader = async () => { loads += 1; return pending; };

  const first = cache.get("same", loader);
  const second = cache.get("same", loader);
  assert.equal(loads, 1);
  resolve(42);
  assert.deepEqual(await Promise.all([first, second]), [42, 42]);
});

test("reuses a fresh value and reloads after ttl expiry", async () => {
  let now = 1_000;
  let loads = 0;
  const cache = createWhatsAppTtlCache<string, number>({ ttlMs: 100, now: () => now });
  const loader = async () => ++loads;

  assert.equal(await cache.get("key", loader), 1);
  now += 99;
  assert.equal(await cache.get("key", loader), 1);
  now += 2;
  assert.equal(await cache.get("key", loader), 2);
});

test("delete and clear force fresh loads", async () => {
  let loads = 0;
  const cache = createWhatsAppTtlCache<string, number>({ ttlMs: 10_000 });
  const loader = async () => ++loads;

  assert.equal(await cache.get("a", loader), 1);
  cache.delete("a");
  assert.equal(await cache.get("a", loader), 2);
  assert.equal(await cache.get("b", loader), 3);
  cache.clear();
  assert.equal(await cache.get("b", loader), 4);
});

test("failed loads are never cached", async () => {
  let loads = 0;
  const cache = createWhatsAppTtlCache<string, number>({ ttlMs: 10_000 });
  await assert.rejects(cache.get("bad", async () => { loads += 1; throw new Error("boom"); }));
  assert.equal(await cache.get("bad", async () => { loads += 1; return 9; }), 9);
  assert.equal(loads, 2);
});
