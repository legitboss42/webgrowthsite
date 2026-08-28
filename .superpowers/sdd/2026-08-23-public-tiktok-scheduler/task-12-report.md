# Task 12 Report: Public TikTok Scheduler Supabase Migration

## Status

**COMPLETE FOR THE QUOTA BLOCKER — the linked scheduler migration contract now counts legacy schedule events, admits the real final slot, and serializes concurrent final-slot requests.**

No applied migration was edited. Two forward-only scheduler corrections were applied because the first correction's executable live green check exposed an over-broad fallback and the already-applied file had to remain immutable. No WhatsApp migration was applied. Nothing was pushed or deployed.

## Exact root cause

The earlier report's claimed concurrency reproduction was not a valid final-slot test. Its recorded fixture SQL created two `NEEDS_APPROVAL` candidate posts and **zero** already-consumed daily slots. Under a three-per-24-hour limit, both reservations were expected to succeed. A corrected pre-fix test with two real quota events and two candidates used two distinct database backends and produced exactly one accepted reservation, proving that the advisory transaction lock plus the locked `scheduler_users` row already serialized same-user calls.

The real applied defect was migration-transition data:

- `202608230001_public_scheduler_beta.sql` added nullable `scheduled_at` without backfilling pre-existing scheduled posts.
- `reserve_public_scheduler_slot` counted only `post.scheduled_at` in its rolling window.
- Fresh live inspection found three non-draft quota events with `scheduled_at IS NULL`, so those legacy events were invisible to the daily limit.

## TDD evidence

The executable regression is `supabase/tests/public_scheduler_legacy_quota_regression.sql`. It creates two rollback-only legacy schedule events plus two approved candidates for one user and requires the first reservation to return `true` and the second `false`.

RED against the original live contract:

```text
Legacy daily quota regression: expected first=true and second=false, got first=t and second=t.
```

That failed transaction left users `0`, posts `0`, and approvals `0` for the exact marker.

`202608280001_public_scheduler_legacy_quota.sql` then backfilled rows with `scheduled_for IS NOT NULL` and added a `created_at` fallback. The immediate live green check correctly caught that the fallback was too broad:

```text
Legacy daily quota regression: expected first=true and second=false, got first=f and second=f.
```

The unconditional fallback counted unscheduled candidate rows. Because `202608280001` was already applied, it was not edited. The separately authorized forward-only `202608280002_public_scheduler_legacy_quota_fallback.sql` narrowed the fallback to:

```sql
post.scheduled_at >= p_now - interval '24 hours'
or (
  post.scheduled_at is null
  and post.scheduled_for is not null
  and post.created_at >= p_now - interval '24 hours'
)
```

GREEN against the final live contract: the executable regression exited `0`. This proves legacy events consume their slots without turning newly created, unscheduled candidates into false quota usage.

## Linked migration safety and application

The ordinary checkout dry-run was unsafe: it proposed the unrelated pending `202608250001_whatsapp_quick_replies.sql`, `202608260001_whatsapp_settings.sql`, and `202608260002_whatsapp_delivery_error.sql` before the scheduler correction.

An isolated Supabase work directory contained only the exact remote-matched history (`202608130001` through the applied `202608250001_automation_waitlist.sql`) plus the scheduler correction. Its first dry-run listed only `202608280001_public_scheduler_legacy_quota.sql`; its second dry-run listed only `202608280002_public_scheduler_legacy_quota_fallback.sql`. Both isolated pushes exited `0` and applied exactly the listed scheduler migration.

The linked ledger now matches local scheduler versions `202608230001`, `202608240002`, `202608280001`, and `202608280002`. The unrelated duplicate/pending WhatsApp files remain local-only and unapplied.

## Final live verification

- The live function is still `SECURITY DEFINER`, has `search_path=public`, and retains its advisory transaction lock plus same-user row lock.
- `public`, `anon`, and `authenticated` execute privileges are false; `service_role` execute is true.
- The live function contains the scheduled-row-gated fallback and no unconditional `coalesce(scheduled_at, created_at)` fallback.
- Live rows with `scheduled_at IS NULL AND scheduled_for IS NOT NULL`: `0` after the backfill.
- Rollback-safe sequential legacy regression: exit `0`, proving first `true` and second `false` with two used daily slots.
- Correct bounded two-backend final-slot fixture: two legacy events and two candidates were committed for one marked user. The CLI harness timed out while collecting both process outputs, so persisted state was inspected before any retry. No fixture query remained active; exactly one candidate was `SCHEDULED` and one remained `NEEDS_APPROVAL`. An explicit call for the remaining candidate returned `false`.
- Exact cleanup audit after deleting the marked fixture user: users `0`, posts `0`, approvals `0`, attempts `0`.
- Earlier pre-fix corrected race fixture cleanup was also verified at users `0`, posts `0`, approvals `0`, attempts `0`.

## Local verification

- Focused quota/store/migration tests: `34/34` passed before the first live mutation.
- Final `npm run test:scheduler`: `280/280` passed, `0` failed.
- Final `.\node_modules\.bin\tsc.cmd --noEmit`: exit `0`.
- Final `git diff --check`: exit `0` (only the existing Git line-ending warning was emitted).

## Delivery boundary

- Code and tests: complete in the local checkout.
- Git commit: completed in the Task 12 correction commit.
- Linked Supabase migrations: `202608280001` and `202608280002` applied and verified.
- Unrelated WhatsApp migrations: not applied.
- Push: not performed.
- Deployment: not performed.
