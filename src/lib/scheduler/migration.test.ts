import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/202608210001_tiktok_creator_scheduler.sql",
  import.meta.url
);
const supabaseCronMigrationPath = new URL(
  "../../../supabase/migrations/202608210002_supabase_scheduler_cron.sql",
  import.meta.url
);
const vercelConfigPath = new URL("../../../vercel.json", import.meta.url);

test("scheduler migration enables isolation and atomic worker safeguards", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  for (const table of [
    "scheduler_users",
    "tiktok_connections",
    "media_assets",
    "scheduled_posts",
    "post_media",
    "post_approvals",
    "publish_attempts",
    "scheduler_audit_log",
    "media_staging_objects",
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(sql, /claim_due_tiktok_posts/);
  assert.match(sql, /reserve_tiktok_daily_slot/);
  assert.match(sql, /cancel_tiktok_connection_jobs/);
  assert.match(sql, /tiktok-scheduler-media/);
  assert.match(sql, /tiktok-publishing-staging/);
  assert.match(sql, /public[^\n]*false/);
  assert.match(sql, /revoke execute/);
});

test("scheduler cron runs from Supabase instead of Vercel Hobby cron", () => {
  assert.equal(existsSync(vercelConfigPath), false, "Vercel cron config should not be committed");

  const sql = readFileSync(supabaseCronMigrationPath, "utf8").toLowerCase();

  assert.match(sql, /create extension if not exists pg_cron/);
  assert.match(sql, /create extension if not exists pg_net/);
  assert.match(sql, /vault\./);
  assert.match(sql, /webgrowth-tiktok-publish-5m/);
  assert.match(sql, /\*\/5 \* \* \* \*/);
  assert.match(sql, /\/api\/scheduler\/cron\/publish\//);
  assert.match(sql, /webgrowth-tiktok-cleanup-daily/);
  assert.match(sql, /\/api\/scheduler\/cron\/cleanup\//);
  assert.match(sql, /authorization/);
  assert.match(sql, /bearer/);
  assert.match(sql, /revoke execute/);
});
