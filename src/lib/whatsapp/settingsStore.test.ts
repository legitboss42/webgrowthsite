import assert from "node:assert/strict";
import test from "node:test";
import { WHATSAPP_DEFAULT_SETTINGS } from "./settings";
import {
  invalidateWhatsAppSettingsCache,
  loadWhatsAppSettings,
  saveWhatsAppSettings,
} from "./settingsStore";

const URL_BASE = "https://example.supabase.co";
const KEY = "test-service-role-key";
const CREDS = { url: URL_BASE, serviceRoleKey: KEY };

type Call = { url: string; init: RequestInit | undefined };

/**
 * Records every request and replies with the queued responses in order. The last
 * queued response repeats, so a test that only cares about one shape can queue one.
 */
function stubFetch(responses: Array<Response | (() => Response | never)>) {
  const calls: Call[] = [];
  let index = 0;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const entry = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return typeof entry === "function" ? entry() : entry.clone();
  }) as unknown as typeof globalThis.fetch;
  return { fetcher, calls };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** The store logs failures on purpose; tests capture that instead of printing it. */
async function withSilencedErrors<T>(run: () => Promise<T>): Promise<{ result: T; logs: unknown[][] }> {
  const original = console.error;
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logs.push(args);
  };
  try {
    return { result: await run(), logs };
  } finally {
    console.error = original;
  }
}

test.beforeEach(() => {
  invalidateWhatsAppSettingsCache();
});

/* Loading ------------------------------------------------------------------ */

test("missing credentials return defaults instead of throwing", async () => {
  const { fetcher, calls } = stubFetch([json([])]);
  const load = await loadWhatsAppSettings({
    fetch: fetcher,
    url: "",
    serviceRoleKey: "",
    maxAgeMs: 0,
  });
  assert.equal(load.reason, "unconfigured");
  assert.equal(load.source, "defaults");
  assert.deepEqual(load.settings, WHATSAPP_DEFAULT_SETTINGS);
  assert.equal(calls.length, 0, "an unconfigured load must not call the database");
});

test("a stored document is read from the single settings row and parsed", async () => {
  const { fetcher, calls } = stubFetch([
    json([{ settings: { console: { activityWindowDays: 30 }, targetFirstResponseMinutes: 45 } }]),
  ]);
  const load = await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, maxAgeMs: 0 });

  assert.equal(load.source, "database");
  assert.equal(load.reason, "ok");
  assert.equal(load.settings.console.activityWindowDays, 30);
  assert.equal(load.settings.targetFirstResponseMinutes, 45);
  assert.match(calls[0]?.url ?? "", /whatsapp_settings\?select=settings&id=eq\.default&limit=1$/);
  assert.equal(calls[0]?.init?.cache, "no-store");
});

test("a second read inside the cache window does not hit the database", async () => {
  const { fetcher, calls } = stubFetch([json([{ settings: {} }])]);
  const at = 1_000_000;
  await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, now: at });
  await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, now: at + 30_000 });
  assert.equal(calls.length, 1, "the receive path must not pay for a round trip per message");
});

test("the cache expires, and maxAgeMs 0 always reads fresh", async () => {
  const { fetcher, calls } = stubFetch([json([{ settings: {} }])]);
  const at = 2_000_000;
  await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, now: at });
  await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, now: at + 60_001 });
  assert.equal(calls.length, 2);
  await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, now: at + 60_002, maxAgeMs: 0 });
  assert.equal(calls.length, 3, "the console reads fresh so a save is visible immediately");
});

test("a missing table reports missing-table and keeps working on defaults", async () => {
  const { fetcher } = stubFetch([json({ code: "PGRST205" }, 404)]);
  const load = await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, maxAgeMs: 0 });
  assert.equal(load.reason, "missing-table");
  assert.deepEqual(load.settings, WHATSAPP_DEFAULT_SETTINGS);
});

test("a rejected read reports unreachable and logs the status", async () => {
  const { fetcher } = stubFetch([json({ message: "boom" }, 500)]);
  const { result, logs } = await withSilencedErrors(() =>
    loadWhatsAppSettings({ ...CREDS, fetch: fetcher, maxAgeMs: 0 }),
  );
  assert.equal(result.reason, "unreachable");
  assert.deepEqual(result.settings, WHATSAPP_DEFAULT_SETTINGS);
  assert.equal(logs.length, 1);
});

test("a network failure reports unreachable rather than propagating", async () => {
  const { fetcher } = stubFetch([
    () => {
      throw new Error("socket hang up");
    },
  ]);
  const { result } = await withSilencedErrors(() =>
    loadWhatsAppSettings({ ...CREDS, fetch: fetcher, maxAgeMs: 0 }),
  );
  assert.equal(result.reason, "unreachable");
  assert.deepEqual(result.settings, WHATSAPP_DEFAULT_SETTINGS);
});

test("a table with no seed row is healthy, not broken", async () => {
  const { fetcher } = stubFetch([json([])]);
  const load = await loadWhatsAppSettings({ ...CREDS, fetch: fetcher, maxAgeMs: 0 });
  assert.equal(load.reason, "ok");
  assert.equal(load.source, "defaults");
});

/* Saving ------------------------------------------------------------------- */

test("saving upserts the single row so it is created if the seed is gone", async () => {
  const { fetcher, calls } = stubFetch([json([{ id: "default" }])]);
  const settings = { ...WHATSAPP_DEFAULT_SETTINGS, targetFirstResponseMinutes: 30 };
  const result = await saveWhatsAppSettings(settings, { ...CREDS, fetch: fetcher });

  assert.equal(result.ok, true);
  const call = calls[0];
  assert.match(call?.url ?? "", /whatsapp_settings\?on_conflict=id$/);
  assert.equal(call?.init?.method, "POST");
  const headers = (call?.init?.headers ?? {}) as Record<string, string>;
  assert.equal(headers.Prefer, "resolution=merge-duplicates,return=representation");
  const body = JSON.parse(String(call?.init?.body)) as Record<string, unknown>;
  assert.equal(body.id, "default");
  assert.deepEqual(body.settings, settings);
  assert.equal(typeof body.updated_at, "string");
});

test("saving without credentials fails with a message an operator can act on", async () => {
  const result = await saveWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS, {
    url: "",
    serviceRoleKey: "",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "unconfigured");
  assert.match(result.message, /not configured/i);
});

test("saving before the migration is applied says exactly what to run", async () => {
  const notFound = stubFetch([json({ code: "PGRST205" }, 404)]);
  const first = await saveWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS, {
    ...CREDS,
    fetch: notFound.fetcher,
  });
  assert.equal(first.ok, false);
  if (first.ok) return;
  assert.equal(first.reason, "missing-table");
  assert.match(first.message, /whatsapp_settings migration/);

  // PostgREST also reports an unknown relation as 400 with a code.
  const badRequest = stubFetch([json({ code: "42P01", message: 'relation "x" does not exist' }, 400)]);
  const second = await saveWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS, {
    ...CREDS,
    fetch: badRequest.fetcher,
  });
  assert.equal(second.ok, false);
  if (second.ok) return;
  assert.equal(second.reason, "missing-table");
});

test("a rejected write never returns the database's own error text", async () => {
  const { fetcher } = stubFetch([
    json({ code: "23514", message: 'violates check constraint "whatsapp_settings_single_row"' }, 400),
  ]);
  const { result, logs } = await withSilencedErrors(() =>
    saveWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS, { ...CREDS, fetch: fetcher }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, "failed");
  assert.equal(result.message, "The settings could not be saved.");
  assert.doesNotMatch(result.message, /constraint|relation|column/i);
  assert.equal(logs.length, 1, "the detail belongs in the server log, not the browser");
});

test("a successful save clears the cache so the next read sees the new document", async () => {
  const load = stubFetch([json([{ settings: {} }])]);
  const at = 3_000_000;
  await loadWhatsAppSettings({ ...CREDS, fetch: load.fetcher, now: at });
  assert.equal(load.calls.length, 1);

  const save = stubFetch([json([{ id: "default" }])]);
  await saveWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS, { ...CREDS, fetch: save.fetcher });

  await loadWhatsAppSettings({ ...CREDS, fetch: load.fetcher, now: at + 1 });
  assert.equal(load.calls.length, 2, "a save inside the cache window must not be masked");
});
