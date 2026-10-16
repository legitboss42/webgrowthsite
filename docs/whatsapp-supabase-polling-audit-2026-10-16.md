# WhatsApp Supabase polling audit — 2026-10-16

## Scope

Production Supabase project `ockqdqlmzilrnilclwwa` and the Web Growth WhatsApp module were audited for unnecessary or duplicate Supabase REST/RPC traffic, with special focus on:

- `whatsapp_conversations`
- `whatsapp_workspaces`
- `whatsapp_team_members`
- `whatsapp_automation_jobs`
- `whatsapp_automation_runtime_config`
- `whatsapp_note_mentions`
- `claim_whatsapp_campaign_recipients`

The implementation is isolated on `perf/whatsapp-supabase-polling`. Nothing in this change has been merged to `main` or deployed to production.

## Production evidence

Three-hour sample: **2026-10-16 12:00–15:00 UTC**.

| Supabase API path | Requests / 3h | Approx. / hour |
| --- | ---: | ---: |
| `whatsapp_workspaces` | 879 | 293 |
| `whatsapp_conversations` | 324 | 108 |
| `whatsapp_team_members` | 321 | 107 |
| `whatsapp_automation_runtime_config` | 319 | 106 |
| `whatsapp_automation_jobs` | 165 | 55 |
| `whatsapp_campaign_recipients` | 156 | 52 |
| `rpc/claim_whatsapp_campaign_recipients` | 152 | 51 |
| `whatsapp_note_mentions` | 69 | 23 |

All sampled REST/RPC calls used the server-side Node user agent. This confirms the dominant idle load is server routes/background workers rather than direct browser-to-Supabase reads.

Repeated identical query shapes observed in the same three-hour window included:

- runtime processor secret — **319** identical reads
- active workspace IDs — **319** identical reads
- default workspace lookup — **316** identical reads
- owner/team membership lookup — **249** identical reads
- full workspace list — **244** identical reads
- `claim_whatsapp_campaign_recipients` — **152** RPC calls
- active team list — **69** reads
- unread note mentions — **69** reads

Production had two unconditional pg_cron jobs:

- `webgrowth-whatsapp-automation-processor` — `* * * * *`
- `webgrowth-whatsapp-campaign-processor` — `* * * * *`

Both invoked their HTTP processors every minute even when there was no queue work. At audit time there were **zero pending automation jobs** and **zero campaign recipients**, while one active `NO_CUSTOMER_REPLY` automation caused the automation processor to continue scanning timed triggers/conversations every minute.

## Polling intervals found

| Location | Old interval | What it did | Change |
| --- | ---: | --- | --- |
| `AutoRefresh.tsx` | default **10s**, configurable **5–300s** | checks inbox notification endpoint; router refreshes when fingerprint changes, with **60s** reconciliation guard | Realtime is now the fast inbox invalidation path. Migration changes the production setting to **300s** so this becomes a safety reconciliation instead of the primary refresh mechanism. |
| `IncomingCallOverlay.tsx` | **2s** | reads active call | Replaced by Realtime `whatsapp_calls`; **30s** fallback reconciliation retained. |
| `TeamPresenceWidget.tsx` | **15s** | reads team presence + unread mentions | Replaced by Realtime invalidations; **5 min** fallback retained. |
| `ConversationCollaborationWidget.tsx` | **8s** | reads notes, activity, viewers, mentionable members | Replaced by Realtime invalidations; **60s** fallback retained. |
| `ConversationCollaborationWidget.tsx` | **12s** | writes presence heartbeat / typing state | **Retained.** This is not a Supabase read poll; it is required by the 45s live-viewer window. Heartbeat-only DB updates are explicitly suppressed from Realtime invalidations so they do not recreate a 12s read loop. |
| `ConversationCollaborationWidget.tsx` | **7s timeout** | clears typing state | **Retained.** Local UI/presence timer, not data polling. |
| `ServiceWindowWarning.tsx` | **60s** | re-reads latest inbound message through API | Removed as a data poll. Initial read + message Realtime invalidation now update the source timestamp; a local **60s** clock recalculates expiry without Supabase. |
| `ReplyComposer.tsx` | **60s** | updates local clock for 24h window text | **Retained.** Local-only timer, no repeated Supabase fetch. |
| `ReplyComposer.tsx` | **250ms** while recording | updates local audio recording elapsed time | **Retained.** Local-only timer. |
| `IncomingCallOverlay.tsx` | **1s** during active call | elapsed call timer | **Retained.** Local-only timer. |
| automation pg_cron | **1 min** | unconditional HTTP worker invocation | Cron still performs a cheap indexed DB work check every minute, but HTTP processor calls back off **1m → 2m → 4m → 5m** when queue-idle. Due automation jobs wake on the next minute. Timed trigger discovery therefore remains bounded to at most ~5 minutes while idle. |
| campaign pg_cron | **1 min** | unconditional HTTP worker invocation and claim RPC | Cron still checks for due/stale queue rows every minute, but HTTP processor calls back off **1m → 2m → 4m → 8m → 15m** while empty. A due campaign recipient wakes on the next minute, preserving campaign processing. |

## Realtime design

A single client-side workspace channel is created per mounted WhatsApp console:

`whatsapp:<workspace UUID>`

Postgres triggers call `realtime.send()` with only:

```json
{ "table": "whatsapp_messages", "operation": "INSERT" }
```

No message body, contact data, phone number, note content, team identity, or database row payload is broadcast. Existing authenticated Next.js routes/server components still perform the actual reads and access checks.

Realtime invalidation tables:

- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_team_members`
- `whatsapp_internal_notes`
- `whatsapp_note_mentions`
- `whatsapp_team_activity`
- `whatsapp_conversation_presence`
- `whatsapp_calls`

The production WhatsApp tables were not in `supabase_realtime`; the implementation therefore uses Supabase Broadcast via `realtime.send()` instead of exposing Postgres Changes rows.

### Foreground behavior after change

- Inbox: conversation/message changes call `router.refresh()` immediately.
- Calls: `whatsapp_calls` changes refresh active-call state immediately.
- Presence/mentions: team/member/note invalidations reload the widget immediately.
- Collaboration: notes/activity/typing/viewer transitions reload immediately.
- Service window: incoming message invalidation refreshes the latest inbound timestamp; countdown thereafter is local.

## Static data caching / duplicate-query removal

### Workspaces

`src/lib/whatsapp/workspaces.ts` now uses a **60s** TTL cache keyed by the exact PostgREST query plus in-flight promise de-duplication. This covers repeated reads such as:

- default workspace
- full workspace list
- identity membership workspace IDs
- workspace-by-ID
- workspace connection
- entitlements
- platform-admin lookup

The cache is cleared on local workspace or membership mutations.

### Team membership / access

`src/lib/whatsapp/teamAccess.ts` now caches the workspace/email membership lookup for **30s** and de-duplicates concurrent identical reads. This specifically attacks the repeated authorization query seen 249 times in the sample while keeping revocation staleness bounded.

### Processor configuration

`src/lib/whatsapp/processorConfig.ts` centralizes and de-duplicates:

- automation processor secret — **5 min** TTL
- active workspace IDs — **60s** TTL

Both the automation and campaign HTTP processors reuse this loader instead of independently issuing the same runtime-config/workspace queries.

## Background worker behavior

### Automation

The minute cron no longer implies a minute HTTP/API-Gateway worker invocation.

1. A cheap indexed database check asks whether a `PENDING` automation job is already due.
2. If yes, the processor is invoked immediately on that minute.
3. If no, external invocations back off 1/2/4/5 minutes.
4. The periodic probe still runs automation timer discovery and inactive-conversation maintenance, bounding `NO_CUSTOMER_REPLY`/`NO_AGENT_REPLY`/business-hours discovery delay to about five minutes while idle.

Existing indexes already support the due-job check, including `whatsapp_automation_jobs_due_idx (status, due_at)`.

### Campaigns

1. The minute cron checks for due `PENDING` recipients or `SENDING` recipients stuck for 15+ minutes.
2. Due/stale work invokes the processor immediately.
3. Empty queues back off external invocations 1/2/4/8/15 minutes.
4. `claim_whatsapp_campaign_recipients` therefore stops being called every minute on an empty system but remains active whenever campaign work exists.

Existing `whatsapp_campaign_recipients_queue_idx` supports queue status/schedule lookup.

## Expected effect

The existing idle system spends most of its API budget repeatedly discovering that nothing changed. This change moves those checks into:

- database-triggered Realtime invalidations for interactive UI,
- short in-process caches for relatively static control-plane data,
- cheap indexed database predicates for queue readiness,
- progressively slower HTTP worker health probes when queues are empty.

The biggest expected reductions are the current ~106/hour duplicate runtime-config reads, ~106/hour active-workspace reads, ~51/hour empty campaign claim RPCs, and the automation/conversation scans caused by unconditional one-minute worker execution.

## Files changed

- `src/components/whatsapp/WhatsAppRealtimeProvider.tsx`
- `src/app/admin/whatsapp/InboxRealtimeRefresh.tsx`
- `src/app/admin/whatsapp/layout.tsx`
- `src/app/admin/whatsapp/IncomingCallOverlay.tsx`
- `src/app/admin/whatsapp/TeamPresenceWidget.tsx`
- `src/app/admin/whatsapp/ConversationCollaborationWidget.tsx`
- `src/app/admin/whatsapp/ServiceWindowWarning.tsx`
- `src/lib/whatsapp/realtime.ts`
- `src/lib/whatsapp/realtime.test.ts`
- `src/lib/whatsapp/ttlCache.ts`
- `src/lib/whatsapp/ttlCache.test.ts`
- `src/lib/whatsapp/workspaces.ts`
- `src/lib/whatsapp/teamAccess.ts`
- `src/lib/whatsapp/processorConfig.ts`
- internal automation/campaign processor routes
- `supabase/migrations/20261016150000_whatsapp_realtime_invalidation_and_worker_backoff.sql`
- `package.json`

## Deployment state

**Not deployed. Not merged to `main`.** The Supabase migration exists only in the working branch and has not been applied to production. Production traffic therefore remains unchanged until explicit deployment approval is given.
