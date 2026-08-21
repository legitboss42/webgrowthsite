import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/202608210001_tiktok_creator_scheduler.sql",
  import.meta.url
);

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
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(sql, /claim_due_tiktok_posts/);
  assert.match(sql, /reserve_tiktok_daily_slot/);
  assert.match(sql, /cancel_tiktok_connection_jobs/);
  assert.match(sql, /tiktok-scheduler-media/);
  assert.match(sql, /public[^\n]*false/);
  assert.match(sql, /revoke execute/);
});
