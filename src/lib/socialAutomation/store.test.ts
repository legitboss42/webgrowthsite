import test from "node:test";
import assert from "node:assert/strict";

import { createSocialAutomationStoreFromClient } from "./store";

type Row = Record<string, unknown>;

function fakeClient(seed: Record<string, Row[]> = {}) {
  const tables = new Map<string, Row[]>(Object.entries(seed).map(([k, v]) => [k, [...v]]));

  function table(name: string) {
    const rows = tables.get(name) ?? [];
    tables.set(name, rows);

    const query: any = {
      select() { return query; },
      eq(column: string, value: unknown) {
        const source = query._filtered ?? rows;
        query._filtered = source.filter((row: Row) => row[column] === value);
        return query;
      },
      single: async () => ({ data: (query._filtered ?? rows)[0] ?? null, error: null }),
      maybeSingle: async () => ({ data: (query._filtered ?? rows)[0] ?? null, error: null }),
      insert(values: Row | Row[]) {
        const input = Array.isArray(values) ? values : [values];
        for (const value of input) rows.push({ id: value.id ?? crypto.randomUUID(), ...value });
        query._inserted = input.map((value) => rows.find((row) => row.id === value.id) ?? value);
        return {
          select() {
            return {
              single: async () => ({ data: rows[rows.length - 1] ?? null, error: null }),
            };
          },
        };
      },
      upsert(values: Row, options?: { onConflict?: string }) {
        const keys = (options?.onConflict ?? "id").split(",").map((key) => key.trim());
        const existing = rows.find((row) => keys.every((key) => row[key] === values[key]));
        if (existing) Object.assign(existing, values);
        else rows.push({ id: values.id ?? crypto.randomUUID(), ...values });
        return {
          select() {
            return {
              single: async () => ({ data: existing ?? rows[rows.length - 1], error: null }),
            };
          },
        };
      },
      update(values: Row) {
        return {
          eq: async (column: string, value: unknown) => {
            const matches = rows.filter((row) => row[column] === value);
            matches.forEach((row) => Object.assign(row, values));
            return { data: matches, error: null };
          },
        };
      },
      order() { return query; },
      limit() { return query; },
      then(resolve: (value: unknown) => void) {
        resolve({ data: query._filtered ?? rows, error: null });
      },
    };

    return query;
  }

  return {
    from: table,
    dump(name: string) { return tables.get(name) ?? []; },
  };
}

test("createJob returns existing job for the same idempotency key", async () => {
  const client = fakeClient();
  const store = createSocialAutomationStoreFromClient(client as any);
  const input = {
    articleSlug: "seo-checklist",
    sourceCommitSha: "abc123",
    automationVersion: "v1",
    idempotencyKey: "seo-checklist:abc123:v1",
    articleSnapshot: { title: "SEO Checklist" },
  };

  const first = await store.createJob(input);
  const second = await store.createJob(input);

  assert.equal(first.id, second.id);
  assert.equal(client.dump("social_automation_jobs").length, 1);
});

test("upsertPublication keeps one row per job and platform", async () => {
  const client = fakeClient();
  const store = createSocialAutomationStoreFromClient(client as any);

  await store.upsertPublication({ jobId: "job-1", platform: "FACEBOOK", caption: "One", status: "PENDING" });
  await store.upsertPublication({ jobId: "job-1", platform: "FACEBOOK", caption: "Two", status: "PROCESSING" });

  const rows = client.dump("social_publications");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].caption, "Two");
  assert.equal(rows[0].status, "PROCESSING");
});

test("upsertPublication persists opaque provider state for retry-safe staged APIs", async () => {
  const client = fakeClient();
  const store = createSocialAutomationStoreFromClient(client as any);

  await store.upsertPublication({
    jobId: "job-1",
    platform: "FACEBOOK",
    caption: "Caption",
    status: "PROCESSING",
    providerState: { videoId: "video-1", uploadUrl: "https://rupload.facebook.com/upload/video-1", uploaded: true },
  });

  const row = client.dump("social_publications")[0];
  assert.deepEqual(row.provider_state, {
    videoId: "video-1",
    uploadUrl: "https://rupload.facebook.com/upload/video-1",
    uploaded: true,
  });
});

test("listAssets returns only assets belonging to the requested job", async () => {
  const client = fakeClient({
    social_media_assets: [
      { id: "a1", job_id: "job-1", profile: "META", storage_path: "one/meta.mp4" },
      { id: "a2", job_id: "job-1", profile: "TIKTOK", storage_path: "one/tiktok.mp4" },
      { id: "a3", job_id: "job-2", profile: "META", storage_path: "two/meta.mp4" },
    ],
  });
  const store = createSocialAutomationStoreFromClient(client as any);

  const assets = await store.listAssets("job-1");
  assert.deepEqual(assets.map((asset) => asset.id), ["a1", "a2"]);
});

test("connection summaries never expose encrypted tokens", async () => {
  const client = fakeClient({
    social_connections: [{ id: "c1", provider: "META", encrypted_tokens: "cipher", facebook_page_name: "Web Growth" }],
  });
  const store = createSocialAutomationStoreFromClient(client as any);

  const summary = await store.getConnectionSummary("META");
  assert.deepEqual(summary, {
    id: "c1",
    provider: "META",
    facebookPageId: null,
    facebookPageName: "Web Growth",
    instagramAccountId: null,
    instagramAccountName: null,
    scopes: [],
    accessExpiresAt: null,
    reconnectRequired: false,
  });
  assert.equal("encryptedTokens" in (summary as any), false);
});
