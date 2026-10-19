# Web Growth internal Supabase usage cleanup — 2026-10-19

## Approval and deployment boundary
- User approved implementation on 2026-10-19.
- Do NOT merge into `main`, apply the migration to production, or trigger any deployment before a second explicit user approval.
- Exactly one coordinated production release: application revision (if needed) plus one migration; avoid repeated deployments.
- Once the branch is merged/pushed to `main`, delete the feature branch; NEVER delete `main`.
- Implementation branch: `perf/supabase-log-retention-20261019`.

## Production audit (read-only, 2026-10-19)
- Supabase project: `ockqdqlmzilrnilclwwa`.
- Screenshot: Logs Ingest 1.33/1 GB for the current billing period, database 405/500 MB.
- SQL snapshot: database ~372 MiB; dashboard measures may lag.
- Largest internal relations: `net._http_response` ~231 MB with 159 live rows (6h TTL); `cron.job_run_details` ~120 MB with 152,289 rows.
- Retainable 7-day cron history: ~22,183 rows. Historical cron jobs 5 and 6 alone account for ~127,502 old completed rows.
- All of `public` including WhatsApp user data: ~7.2 MB.
- Latest 24h: 3,234 edge events (~135/h), versus the previously reported ~1,200/h, roughly an 89% lower API Gateway event rate (nonidentical periods).
- The 24h logs were led by Postgres 6,909 events. Cron jobs 7 and 8 generated four start/complete log lines per minute combined. TikTok's 5-minute processor causes avoidable idle REST/RPC calls.
- TikTok production at inspection: no due scheduled posts or unresolved publish attempts. Two unremoved terminal staging rows still require periodic cleanup.
- WhatsApp worker backoff verified idle; due check for both queues false.

## Approved implementation
- [x] Audit current workloads, storage and required publishing behavior.
- [x] Design seven-day cron retention and six-hour HTTP response preservation.
- [x] Implement one-time internal-table compact-and-restore in a single transaction.
- [x] Configure low-threshold autovacuum on both internal tables.
- [x] Schedule daily automatic seven-day cron-history pruning.
- [x] Merge the two one-minute WhatsApp CRON ticks into one minute tick, preserving separate exception handling, due-work checks, per-worker backoff and HTTP processor endpoints.
- [x] Gate TikTok's five-minute HTTP callback by due posts / unresolved publish attempts, with hourly recovery + cleanup, retaining the existing five-minute schedule and daily cleanup job.
- [x] Replace the scheduler-reconfiguration function so future credential rotation cannot silently undo the optimization.
- [x] Add read-only SQL post-release assertions and verification queries.
- [ ] Execute production migration (requires separate deployment approval).
- [ ] Verify production tables, history retention, active jobs, scheduled post behavior, hourly logs, and HTTP endpoints after deployment.
- [ ] Merge/release and delete the feature branch while preserving `main` (requires approval).

## Operational safety
The migration temporarily obtains ACCESS EXCLUSIVE locks on `cron.job_run_details` and `net._http_response`, then copies and restores recent rows after TRUNCATE. This reclaims allocated relation pages; ordinary DELETE alone would not. It never modifies WhatsApp messages, customers, credentials, TikTok media, or published content. The operation may briefly block inserts into those two internal tables; schedule a quiet window. If any SQL fails, migration transaction must roll back as a unit. Never run the one-time compaction in fragments.

The new daily job deletes old **completed** cron rows after seven days; ongoing jobs are exempt. The autovacuum tuning supports reuse of pages as new records arrive. TikTok still checks for due work every five minutes; hourly probe handles terminal staging cleanup/health and reconciliation. If user-facing scheduler health UI depends on a five-minute heartbeat, update that expectation accordingly (idle heartbeat can be up to ~65 minutes).

On release, ensure database migration happens at most once. This change has no Next.js code changes, so if none are needed an SQL-only deployment is sufficient; do not create an unnecessary Vercel deployment.

## Verification
Run `supabase/tests/20261019_internal_usage_regression.sql` read-only post-migration. Monitor 60 minutes of post-release edge / Postgres events, after allowing the console's cumulative billing meter to catch up. The total Logs Ingest counter should **never** be expected to decrease within its current billing cycle.

## Rollback
1. Restore old separate one-minute WhatsApp cron schedules using the prior migration's stored SQL, if combined job fails.
2. Restore original unconditional TikTok five-minute schedule and reconfiguration function from the 2026-08-21 migration if gated reconciliation causes problems.
3. Unschedule the new daily log-retention job if it interferes with support needs.
4. Historical old diagnostic log rows are intentionally removed; they cannot be restored from a rollback. For this reason, verify that preserving seven days is acceptable before applying the migration.
