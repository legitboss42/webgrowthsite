# WhatsApp idle egress fix (2026-10-27)

## Diagnosis

Production `ockqdqlmzilrnilclwwa` continued issuing about 85–90 REST calls per full hour with no pending automation jobs or campaign recipients. The worker state had reached maximum idle backoff. All 13 conversations were closed, but the automation processor still woke every five minutes to scan for no-reply timers; the campaign processor still woke every 15 minutes despite an empty campaign queue.

The separate `paperclip` database was deleted; its Supavisor connection pool stopped emitting activity on 2026-10-27 around 08:15 UTC. Historic egress remains in the current billing-cycle total and is not reset by this fix.

## Change

- `whatsapp_should_invoke_worker('campaign')` now returns false when there are no due or stale campaign recipients. Cron still checks the queue every minute, waking immediately when recipients are due.
- `whatsapp_should_invoke_worker('automation')` now returns false when there are no due automation jobs, no open conversations to scan for no-reply timers, and no active BUSINESS_HOURS workflow.
- Preserves the existing 1/2/4/5-minute backoff for automation timer scans when open conversations or BUSINESS_HOURS workflows exist.
- No application/API changes, no scheduled jobs removed, no messages or recipient records modified.

## Verification

Run the production smoke test in a transaction with `next_probe_at` deliberately set to the past, and rollback afterward. The regression assertion fails on the old function and passes after applying this migration. Observe the Supabase API log path counts after the change, and check the org-level bandwidth usage page for actual egress. A lower HTTP call count does not establish a precise reduction in gigabytes.

## Recovery

Reapply the prior version of `whatsapp_should_invoke_worker(text)` from `20261016150000_whatsapp_realtime_invalidation_and_worker_backoff.sql` if timed processing shows unexpected delays. The new guard is limited to the two documented idle states.
