import assert from "node:assert/strict";
import test from "node:test";
import { createWhatsAppServerCache } from "./serverCache";

test("coalesces identical in-flight requests", async () => {
  let calls = 0;
  const cache = createWhatsAppServerCache();
  let release!: (value: string) => void;
  const pending = new Promise<string>((resolve) => { release = resolve; });
  const loader = async () => { calls += 1; return pending; };

  const first = cache.get("workspace:list", 60_000, loader);
  const second = cache.get("workspace:list", 60_000, loader);
  assert.equal(calls, 1);
  release("ok");
  assert.equal(await first, "ok");
  assert.equal(await second, "ok");
});

test("serves cached values until ttl expiry", async () => {
  let now = 1_000;
  let calls = 0;
  const cache = createWhatsAppServerCache({ now: () => now });
  const loader = async () => ++calls;

  assert.equal(await cache.get("team:a", 100, loader), 1);
  now = 1_099;
  assert.equal(await cache.get("team:a", 100, loader), 1);
  now = 1_101;
  assert.equal(await cache.get("team:a", 100, loader), 2);
});

test("evicts failed loads and supports prefix invalidation", async () => {
  const cache = createWhatsAppServerCache();
  let calls = 0;
  await assert.rejects(() => cache.get("team:a", 60_000, async () => { calls += 1; throw new Error("boom"); }));
  assert.equal(await cache.get("team:a", 60_000, async () => { calls += 1; return "recovered"; }), "recovered");
  assert.equal(calls, 2);

  await cache.get("team:b", 60_000, async () => "b");
  await cache.get("workspace:a", 60_000, async () => "workspace");
  cache.invalidate("team:");
  assert.equal(cache.has("team:a"), false);
  assert.equal(cache.has("team:b"), false);
  assert.equal(cache.has("workspace:a"), true);
});
