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
const publicSchedulerBetaMigrationPath = new URL(
  "../../../supabase/migrations/202608230001_public_scheduler_beta.sql",
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

test("public scheduler beta migration defines legal, retry, and worker contracts", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();

  for (const expected of [
    "privacy_version",
    "privacy_accepted_at",
    "suspended_at",
    "deletion_requested_at",
    "terminal_at",
    "attempt_number",
    "retry_eligible",
    "next_retry_at",
    "reserve_public_scheduler_slot",
    "create_safe_publish_retry",
    "save_active_tiktok_connection",
    "scheduler_worker_health",
  ]) assert.match(sql, new RegExp(expected));
});

// Mutation target: omitting any server-probed field must force video finalization to mark VALID without durable evidence.
test("public scheduler beta migration adds durable stored-video validation evidence", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();
  for (const expected of ["video_codec", "frame_rate", "validation_version", "probe_metadata"]) {
    assert.match(sql, new RegExp(`add column if not exists ${expected}`));
  }
});

test("public scheduler beta migration saves connection tokens only for the exact active user", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();
  const start = sql.indexOf("create or replace function public.save_active_tiktok_connection");
  const end = sql.indexOf("revoke execute", start);
  assert.notEqual(start, -1);
  const connectionFunction = sql.slice(start, end);
  assert.match(connectionFunction, /p_user_id uuid/);
  assert.match(connectionFunction, /p_tiktok_open_id text/);
  assert.match(connectionFunction, /returns boolean/);
  assert.match(connectionFunction, /security definer/);
  assert.match(connectionFunction, /set search_path = public/);
  assert.match(connectionFunction, /user_record\.id = p_user_id/);
  assert.match(connectionFunction, /user_record\.tiktok_open_id = p_tiktok_open_id/);
  assert.match(connectionFunction, /user_record\.status = 'active'/);
  assert.match(connectionFunction, /user_record\.suspended_at is null/);
  assert.match(connectionFunction, /user_record\.deletion_requested_at is null/);
  assert.match(connectionFunction, /for update/);
  assert.match(connectionFunction, /insert into public\.tiktok_connections/);
  assert.match(connectionFunction, /on conflict \(user_id\) do update/);
  assert.match(sql, /revoke execute on function public\.save_active_tiktok_connection\(uuid, text, text, text\[\], timestamptz, timestamptz\) from public, anon, authenticated/);
});

test("public scheduler beta migration reserves a fixed quota by scheduling the owned post atomically", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();
  const reserveStart = sql.indexOf("create or replace function public.reserve_public_scheduler_slot");
  const retryStart = sql.indexOf("create or replace function public.create_safe_publish_retry");
  assert.notEqual(reserveStart, -1);
  assert.notEqual(retryStart, -1);
  const reserveFunction = sql.slice(reserveStart, retryStart);
  const retryFunction = sql.slice(retryStart, sql.indexOf("revoke execute", retryStart));

  assert.match(reserveFunction, /p_post_id uuid/);
  assert.match(reserveFunction, /p_user_id uuid/);
  assert.match(reserveFunction, /p_scheduled_for timestamptz/);
  assert.match(reserveFunction, /p_now timestamptz/);
  assert.doesNotMatch(reserveFunction, /p_daily_limit|p_active_limit/);
  assert.match(reserveFunction, /security definer/);
  assert.match(reserveFunction, /set search_path = public/);
  assert.match(sql, /add column if not exists scheduled_at timestamptz/);
  assert.match(reserveFunction, /pg_advisory_xact_lock/);
  assert.match(reserveFunction, /post\.id = p_post_id/);
  assert.match(reserveFunction, /post\.user_id = p_user_id/);
  assert.match(reserveFunction, /approval\.post_id = post\.id/);
  assert.match(reserveFunction, /approval\.user_id = post\.user_id/);
  assert.match(reserveFunction, /approval\.invalidated_at is null/);
  assert.match(reserveFunction, /post\.scheduled_at >= p_now - interval '24 hours'/);
  assert.doesNotMatch(reserveFunction, /post\.created_at/);
  assert.match(reserveFunction, /post\.scheduled_for > p_now/);
  assert.match(reserveFunction, /v_daily_used >= 3/);
  assert.match(reserveFunction, /v_active_used >= 20/);
  assert.match(reserveFunction, /update public\.scheduled_posts post[\s\S]*status = 'scheduled'[\s\S]*scheduled_for = p_scheduled_for[\s\S]*scheduled_at = p_now/);
  assert.match(reserveFunction, /for update/);
  assert.match(sql, /on public\.scheduled_posts\(user_id, scheduled_for\)/);
  assert.ok(
    sql.indexOf("create unique index if not exists publish_attempts_number_idx")
      < sql.indexOf("drop constraint if exists publish_attempts_post_id_approval_id_request_fingerprint_key"),
    "numbered unique index must precede removal of the legacy constraint"
  );
  assert.match(sql, /alter table public\.scheduler_worker_health enable row level security/);
  assert.match(sql, /revoke execute on function public\.reserve_public_scheduler_slot\(uuid, uuid, timestamptz, timestamptz\) from public, anon, authenticated/);
  assert.match(sql, /revoke execute on function public\.create_safe_publish_retry\(uuid, uuid\) from public, anon, authenticated/);
  assert.match(retryFunction, /security definer/);
  assert.match(retryFunction, /set search_path = public/);
  assert.match(retryFunction, /post\.user_id = p_user_id/);
  assert.match(retryFunction, /approval\.post_id = post\.id/);
  assert.match(retryFunction, /approval\.user_id = post\.user_id/);
  assert.match(retryFunction, /post\.retry_eligible = true/);
  assert.match(retryFunction, /post\.terminal_at is null/);
  assert.match(retryFunction, /attempt\.publish_id is not null/);
  assert.match(retryFunction, /retry_eligible = false/);
});

// Mutation target: moving either insert outside the function must permit a zero-media partial post.
test("public scheduler beta migration creates posts and ordered media atomically", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();
  const start = sql.indexOf("create or replace function public.create_public_scheduler_post");
  const end = sql.indexOf("create or replace function public.approve_public_scheduler_post", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const fn = sql.slice(start, end);

  assert.match(fn, /returns jsonb/);
  assert.match(fn, /security definer/);
  assert.match(fn, /set search_path = public/);
  assert.match(fn, /user_record\.id = p_user_id/);
  assert.match(fn, /user_record\.status = 'active'/);
  assert.match(fn, /user_record\.suspended_at is null/);
  assert.match(fn, /user_record\.deletion_requested_at is null/);
  assert.match(fn, /user_record\.terms_version = '2026-08-23'/);
  assert.match(fn, /user_record\.privacy_version = '2026-08-23'/);
  assert.match(fn, /cardinality\(p_media_ids\) between 1 and 10/);
  assert.match(fn, /count\(distinct requested_id\)[\s\S]*cardinality\(p_media_ids\)/);
  assert.match(fn, /asset\.user_id = p_user_id/);
  assert.match(fn, /asset\.validation_status = 'valid'/);
  // Mutation target: removing the deterministic media row lock must reopen finalize/invalidate TOCTOU.
  assert.match(fn, /for v_locked_asset_id in[\s\S]*order by asset\.id[\s\S]*for update of asset[\s\S]*loop/);
  assert.ok(fn.indexOf("for v_locked_asset_id in") < fn.indexOf("count(distinct asset.kind)"));
  assert.match(fn, /count\(distinct asset\.kind\) = 1/);
  assert.match(fn, /asset\.kind = 'video'[\s\S]*cardinality\(p_media_ids\) <> 1/);
  assert.match(fn, /insert into public\.scheduled_posts/);
  assert.match(fn, /insert into public\.post_media/);
  assert.match(fn, /unnest\(p_media_ids\) with ordinality/);
  assert.match(fn, /ordinality - 1/);
  assert.match(sql, /revoke execute on function public\.create_public_scheduler_post\(uuid, uuid\[\], text, text\) from public, anon, authenticated/);
});

// Mutation target: a separate approval insert/update or mutable upsert must allow partial or rewritten approval state.
test("public scheduler beta migration approves an owned immutable snapshot atomically", () => {
  const sql = readFileSync(publicSchedulerBetaMigrationPath, "utf8").toLowerCase();
  const start = sql.indexOf("create or replace function public.approve_public_scheduler_post");
  const end = sql.indexOf("revoke execute", start);
  assert.notEqual(start, -1);
  const fn = sql.slice(start, end);

  assert.match(fn, /returns jsonb/);
  assert.match(fn, /security definer/);
  assert.match(fn, /set search_path = public/);
  assert.match(fn, /user_record\.id = p_user_id/);
  assert.match(fn, /user_record\.status = 'active'/);
  assert.match(fn, /user_record\.terms_version = '2026-08-23'/);
  assert.match(fn, /user_record\.privacy_version = '2026-08-23'/);
  assert.match(fn, /post\.id = p_post_id/);
  assert.match(fn, /post\.user_id = p_user_id/);
  assert.match(fn, /for update/);
  assert.match(fn, /p_snapshot ->> 'creatoropenid'[\s\S]*user_record\.tiktok_open_id/);
  assert.match(fn, /p_snapshot ->> 'title'[\s\S]*post\.title/);
  assert.match(fn, /p_snapshot ->> 'caption'[\s\S]*post\.caption/);
  assert.match(fn, /jsonb_array_length\(p_snapshot -> 'media'\)/);
  // Mutation target: removing either exact snapshot lock must allow attachments/checksums to change after validation.
  assert.match(fn, /for v_locked_media_id in[\s\S]*order by post_media\.position[\s\S]*for update of post_media[\s\S]*loop/);
  assert.match(fn, /for v_locked_asset_id in[\s\S]*order by asset\.id[\s\S]*for update of asset[\s\S]*loop/);
  assert.ok(fn.indexOf("for v_locked_media_id in") < fn.indexOf("select count(*)\n  into v_total_media_count"));
  assert.match(fn, /v_total_media_count <> v_media_count/);
  assert.match(fn, /asset\.checksum/);
  assert.match(fn, /count\(distinct post_media\.position\)/);
  assert.match(fn, /media_item ->> 'position'/);
  assert.match(fn, /insert into public\.post_approvals/);
  assert.match(fn, /on conflict \(post_id, fingerprint\) do nothing/);
  assert.match(fn, /approval\.snapshot = p_snapshot/);
  assert.match(fn, /update public\.scheduled_posts post[\s\S]*approval_id = v_approval_id[\s\S]*status = 'needs_approval'/);
  assert.match(sql, /revoke execute on function public\.approve_public_scheduler_post\(uuid, uuid, text, jsonb\) from public, anon, authenticated/);
});
