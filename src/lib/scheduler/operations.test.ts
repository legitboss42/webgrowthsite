import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createSchedulerOperations,
  formatWorkerHeartbeatAge,
  sanitizeWorkerHealthCode,
} from "./operations";

function fakeOperationsClient(results: Record<string, unknown> = {}) {
  const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
  return {
    calls,
    client: {
      async rpc(name: string, input: Record<string, unknown>) {
        calls.push({ name, input });
        return results[name] ?? true;
      },
    },
  };
}

// Mutation target: allowing a raw provider/database error into health storage leaks operational detail.
test("worker health records only sanitized failure codes", async () => {
  const { calls, client } = fakeOperationsClient();
  const operations = createSchedulerOperations(client);

  await operations.recordWorkerStarted("2026-08-24T12:00:00.000Z");
  await operations.recordWorkerSucceeded("2026-08-24T12:01:00.000Z");
  await operations.recordWorkerFailure("provider token=private-value", "2026-08-24T12:02:00.000Z");

  assert.deepEqual(calls, [
    {
      name: "record_scheduler_worker_started",
      input: { p_worker_name: "tiktok-publishing", p_started_at: "2026-08-24T12:00:00.000Z" },
    },
    {
      name: "record_scheduler_worker_succeeded",
      input: { p_worker_name: "tiktok-publishing", p_succeeded_at: "2026-08-24T12:01:00.000Z" },
    },
    {
      name: "record_scheduler_worker_failure",
      input: { p_worker_name: "tiktok-publishing", p_error_code: "WORKER_FAILURE", p_failed_at: "2026-08-24T12:02:00.000Z" },
    },
  ]);
  assert.equal(sanitizeWorkerHealthCode("TIKTOK_RATE_LIMITED"), "WORKER_FAILURE");
  assert.equal(sanitizeWorkerHealthCode("POST_ACCEPTANCE_AMBIGUOUS"), "POST_ACCEPTANCE_AMBIGUOUS");
});

// Mutation target: returning the raw aggregate RPC payload exposes token/media fields when the database view changes.
test("owner operations projection excludes encrypted tokens and media content", async () => {
  const { client } = fakeOperationsClient({
    get_scheduler_owner_operations: {
      users: { total: 12, active: 9, suspended: 1 },
      workflow: { scheduled: 4, submitting: 1, processing: 2, published: 5, failed: 1, cancelled: 3 },
      heartbeat: { lastStartedAt: "2026-08-24T12:00:00.000Z", lastSucceededAt: "2026-08-24T12:01:00.000Z", lastErrorCode: null },
      cleanup: { pending: 3, overdue: 1 },
      reconnectRequired: 2,
      failureCategories: { PUBLISH_BLOCKED: 1 },
      encrypted_tokens: "must-never-leave-the-database",
      media_content: "must-never-leave-the-database",
    },
  });

  const overview = await createSchedulerOperations(client).getOwnerOverview();

  assert.deepEqual(overview, {
    users: { total: 12, active: 9, suspended: 1 },
    workflow: { scheduled: 4, overdue: 0, submitting: 1, processing: 2, published: 5, failed: 1, cancelled: 3 },
    heartbeat: { lastStartedAt: "2026-08-24T12:00:00.000Z", lastSucceededAt: "2026-08-24T12:01:00.000Z", lastErrorCode: null },
    cleanup: { pending: 3, overdue: 1 },
    reconnectRequired: 2,
    failureCategories: { PUBLISH_BLOCKED: 1 },
  });
  assert.equal("encrypted_tokens" in overview, false);
  assert.equal("media_content" in overview, false);
});

// Task 12 executes this under real PostgreSQL concurrency. This source contract protects the intended query shape now.
test("due-job claim ranks each creator and caps a batch at two posts per creator", () => {
  const migration = readFileSync(new URL("../../../supabase/migrations/202608230001_public_scheduler_beta.sql", import.meta.url), "utf8").toLowerCase();
  const start = migration.indexOf("create or replace function public.claim_due_tiktok_posts");
  const end = migration.indexOf("create or replace function public.reserve_public_scheduler_slot", start);
  const claim = migration.slice(start, end);

  assert.match(claim, /row_number\(\) over \(\s*partition by post\.user_id/);
  assert.match(claim, /user_rank <= 2/);
  assert.match(claim, /for update of post skip locked/);
});

test("admin heartbeat reports an absent or stale successful cycle without exposing raw errors", () => {
  assert.equal(formatWorkerHeartbeatAge(null, new Date("2026-08-24T12:10:00.000Z")), "No successful cycle recorded");
  assert.equal(formatWorkerHeartbeatAge("2026-08-24T11:04:00.000Z", new Date("2026-08-24T12:10:00.000Z")), "66 minutes ago");
});

test("owner aggregate matches retry, active-account, token-readiness, and cleanup claim boundaries", () => {
  const migration = readFileSync(new URL("../../../supabase/migrations/202608230001_public_scheduler_beta.sql", import.meta.url), "utf8").toLowerCase();
  const start = migration.indexOf("create or replace function public.get_scheduler_owner_operations");
  const end = migration.indexOf("create or replace function public.suspend_scheduler_user", start);
  const overview = migration.slice(start, end);

  assert.match(overview, /status = 'failed_retryable' and next_retry_at <= now\(\)/);
  assert.doesNotMatch(overview, /status in \('scheduled', 'failed_retryable'\) and scheduled_for < now\(\)/);
  assert.match(overview, /user_record\.deletion_requested_at is null/);
  assert.match(overview, /connection_record\.refresh_expires_at <= now\(\)/);
  assert.match(overview, /connection_record\.reconnect_required/);
  assert.match(overview, /connection_record\.scopes @> array\['video\.publish'\]::text\[\]/);
  assert.match(overview, /public\.media_staging_objects staging/);
  assert.match(overview, /asset\.created_at <= now\(\) - interval '24 hours'/);
  assert.match(overview, /post\.terminal_at > now\(\) - interval '7 days'/);
  assert.match(overview, /staging\.expires_at <= now\(\)/);
  assert.doesNotMatch(overview, /asset\.created_at <= now\(\) - interval '7 days'/);
});
