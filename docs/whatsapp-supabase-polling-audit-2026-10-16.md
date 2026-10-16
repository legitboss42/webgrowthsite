# WhatsApp Supabase polling audit — 2026-10-16

Branch: `fix/whatsapp-polling-reduction`

Deployment status: **not deployed**. Vercel preview deployment is disabled for this branch. The Supabase migration in this branch has not been applied to production.

## Production baseline

A three-hour production Supabase API Gateway sample from 2026-10-16 12:00–15:00 UTC showed the requested hot paths below. These eight paths alone generated 2,385 requests, or about 795 requests/hour, before counting the rest of the WhatsApp API traffic.

| Supabase path | Requests / 3h | Approx. / hour | Main source |
| --- | ---: | ---: | --- |
| `whatsapp_workspaces` | 879 | 293 | worker workspace enumeration, default-workspace resolution, auth workspace list |
| `whatsapp_conversations` | 324 | 108 | timed automation/no-reply and lifecycle scans plus user-facing refreshes |
| `whatsapp_team_members` | 321 | 107 | repeated access membership check plus team/presence/collaboration reads |
| `whatsapp_automation_runtime_config` | 319 | 106 | processor secret read on worker requests |
| `whatsapp_automation_jobs` | 165 | 55 | automation worker due-job scan even when the queue is empty |
| `whatsapp_campaign_recipients` | 156 | 52 | campaign stuck-recipient recovery scan |
| `claim_whatsapp_campaign_recipients` | 152 | 51 | campaign worker claim RPC even with zero campaign recipients |
| `whatsapp_note_mentions` | 69 | 23 | team widget unread-mention polling |

The duplicate query signatures were especially clear:

- `whatsapp_automation_runtime_config?id=eq.default&select=processor_secret&limit=1`: **319** reads in three hours.
- `whatsapp_workspaces?status=eq.ACTIVE&select=id&order=created_at.asc`: **319** reads.
- `whatsapp_workspaces?slug=eq.web-growth&select=*&limit=1`: **316** reads.
- full platform-admin workspace list: **244** reads.
- active user membership lookup in `whatsapp_team_members`: **249** reads.
- active team roster query: **69** reads.
- unread `whatsapp_note_mentions`: **69** reads.
- campaign claim RPC: **152** calls despite `whatsapp_campaign_recipients` currently having zero rows.

Production also had two independent pg_cron jobs scheduled every minute:

- `webgrowth-whatsapp-automation-processor` — `* * * * *`
- `webgrowth-whatsapp-campaign-processor` — `* * * * *`

At audit time `whatsapp_automation_jobs` contained 45 terminal jobs (31 `SUCCEEDED`, 14 `CANCELLED`) and no pending jobs, yet the automation processor continued scanning. No WhatsApp tables were in the `supabase_realtime` Postgres Changes publication, which explains why the browser had accumulated polling fallbacks.

## Every repeated interval found

### Network/Supabase-affecting intervals

| Location | Before | What it did | After |
| --- | ---: | --- | --- |
| `AutoRefresh.tsx` | default **10s**, configurable **5–300s** | polls notification fingerprint and can `router.refresh()` the inbox | **Supabase Realtime Broadcast invalidation** for messages/conversations/settings; safety reconciliation is now **>=60s** and still runs on focus/online/visibility changes |
| `TeamPresenceWidget.tsx` | **15s** | fetches both presence/team members and unread mentions | **Realtime invalidation** for team members/mentions/notes + **120s** fallback + focus reconciliation |
| `ConversationCollaborationWidget.tsx` data refresh | **8s** | reloads notes, activity, presence and team metadata | **Realtime invalidation** + **60s** fallback + focus reconciliation |
| `ConversationCollaborationWidget.tsx` heartbeat | **12s** | writes conversation presence/typing heartbeat | **30s** heartbeat; typing state transitions still write immediately; timestamp-only heartbeat updates are suppressed from Realtime broadcasts |
| `IncomingCallOverlay.tsx` | **2s** | checks for an active inbound call | **Realtime invalidation** on `whatsapp_calls` + **30s** safety fallback + focus reconciliation |
| `ServiceWindowWarning.tsx` | **60s** | re-fetches latest inbound message to recompute 24-hour service window | no recurring network poll; fetch on load/Realtime/focus and recalculate expiry with a **local-only 60s clock** |
| automation pg_cron | **60s** | invokes worker even with no due jobs | cron still checks due state each minute inside Postgres, but external worker HTTP calls back off **2m → 3m → 5m** when idle; a due queued job bypasses backoff on the next minute |
| campaign pg_cron | **60s** | invokes campaign worker and claim RPC even with no recipients | same **2m → 3m → 5m** idle HTTP backoff; a due campaign recipient or stale `SENDING` recipient bypasses backoff on the next minute |

### Local-only intervals found and intentionally left as local timers

These do **not** query Supabase or an API and therefore are not polling load:

| Location | Interval | Purpose | Change |
| --- | ---: | --- | --- |
| `IncomingCallOverlay.tsx` | **1s** | active-call elapsed-time counter | unchanged |
| `ReplyComposer.tsx` | **60s** | local `Date.now()` clock for UI calculations | unchanged |
| `ReplyComposer.tsx` | **250ms** | local audio-recording elapsed timer | unchanged |

## Root causes and changes

### `whatsapp_workspaces`

Before the change, the shared REST helper resolved a default workspace before it knew whether the requested table was tenant-scoped. This made global reads such as runtime config indirectly query `whatsapp_workspaces` too.

Changes:

- `readWhatsAppRows`/`countWhatsAppRows` now resolve a workspace **only for tenant-owned tables**.
- Default workspace, by-id workspace, active workspace list, connection, entitlements and admin workspace list are process-local TTL cached for **60s**.
- Identical concurrent reads are coalesced into one in-flight promise.
- Both workers share `getActiveWhatsAppWorkspaceIds()` instead of issuing independent raw workspace queries.

### `whatsapp_team_members`

Changes:

- access membership checks are cached/coalesced for **15s** by workspace + email.
- active roster UI is Realtime-driven with a **120s** reconciliation fallback.
- collaboration team metadata is cached for **15s**.
- write paths invalidate the relevant process-local caches.

### `whatsapp_automation_runtime_config`

Changes:

- it no longer triggers a default-workspace lookup because it is not tenant-owned.
- the processor secret is cached/coalesced for **5 minutes** in the worker process.

### `whatsapp_automation_jobs`

Changes:

- the external worker is no longer called every minute indefinitely when there are no due jobs.
- pg_cron performs a cheap in-database due-work existence check each minute.
- empty worker results move the next external call to 2, then 3, then 5 minutes.
- due `PENDING` jobs bypass idle backoff, preserving queue processing latency.

### `claim_whatsapp_campaign_recipients` and `whatsapp_campaign_recipients`

Changes:

- the claim RPC is no longer called on every cron minute during an empty campaign queue.
- due `PENDING` campaign recipients bypass backoff immediately on the next cron minute.
- stale `SENDING` recipients older than 15 minutes also bypass backoff so recovery remains intact.
- campaign recipient row changes are deliberately **not** put on the browser Realtime channel; campaign processing stays server-side and avoids unnecessary broadcast load.

### `whatsapp_note_mentions`

Changes:

- removed the 15-second unread-mention polling dependency.
- mention/note changes emit a workspace-scoped Realtime invalidation.
- the widget retains a 120-second safety reconciliation and focus refresh.

### `whatsapp_conversations`

Changes:

- inbox-visible conversation/message changes are Realtime-driven.
- general identical reads are coalesced at the shared REST layer.
- background automation/lifecycle conversation scans inherit worker idle backoff rather than running via an external HTTP worker every minute while idle.

## Realtime design

The migration uses Supabase **Database Broadcast**, not direct browser Postgres Changes. Each workspace gets a random opaque `realtime_topic_token`. Database triggers publish only:

```json
{ "scope": "whatsapp_messages", "operation": "INSERT" }
```

No WhatsApp row data, phone numbers, message text, workspace UUID, member data, notes, or campaign data are broadcast. The authorized server-rendered WhatsApp layout supplies the opaque topic to one shared browser subscription, and components re-fetch through the existing authorized application routes only when a relevant invalidation arrives.

Broadcast triggers are limited to live user-facing tables:

- `whatsapp_messages`
- `whatsapp_conversations`
- `whatsapp_team_members`
- `whatsapp_team_activity`
- `whatsapp_internal_notes`
- `whatsapp_note_mentions`
- `whatsapp_conversation_presence`
- `whatsapp_calls`
- `whatsapp_settings`

Routine `whatsapp_conversation_presence` updates that only refresh `last_seen_at` do not broadcast, preventing the 30-second heartbeat from turning into a new read loop.

## Cache/deduplication policy

- Workspaces and related relatively static workspace metadata: **60s TTL**.
- Team access membership: **15s TTL**.
- Collaboration team roster metadata: **15s TTL**.
- Automation processor secret: **300s TTL**.
- Dynamic data without a TTL is still **in-flight deduplicated**, so identical concurrent component/server queries share one Supabase request but the result is not retained after it settles.
- Successful WhatsApp writes invalidate process-local REST caches so follow-up reads do not remain stale.

## Queue backoff behavior

Idle external calls back off as follows:

1. first empty result → next external call after 2 minutes;
2. second consecutive empty result → after 3 minutes;
3. third and later consecutive empty results → after 5 minutes;
4. any worker result with work resets the idle streak;
5. due automation jobs, due campaign recipients and stale campaign sends bypass the idle window on the next one-minute cron check.

The time-scanned `NO_CUSTOMER_REPLY` / conversation lifecycle work can therefore be delayed by at most about five minutes during a long idle period. The currently active no-customer-reply automation is configured for a two-hour delay, so this trades minute-level empty polling for a small bounded timing tolerance without delaying queued campaign recipients.

## Files changed

- `src/app/admin/whatsapp/data.ts`
- `src/lib/whatsapp/serverCache.ts`
- `src/lib/whatsapp/serverCache.test.ts`
- `src/lib/whatsapp/pollingPolicy.ts`
- `src/lib/whatsapp/pollingPolicy.test.ts`
- `src/lib/whatsapp/workspaces.ts`
- `src/lib/whatsapp/teamAccess.ts`
- `src/app/admin/whatsapp/WhatsAppRealtimeBridge.tsx`
- `src/app/admin/whatsapp/layout.tsx`
- `src/app/admin/whatsapp/AutoRefresh.tsx`
- `src/app/admin/whatsapp/TeamPresenceWidget.tsx`
- `src/app/admin/whatsapp/ConversationCollaborationWidget.tsx`
- `src/app/api/admin/whatsapp/conversations/collaboration/route.ts`
- `src/app/admin/whatsapp/IncomingCallOverlay.tsx`
- `src/app/admin/whatsapp/ServiceWindowWarning.tsx`
- `src/app/api/internal/whatsapp/automations/process/route.ts`
- `src/app/api/internal/whatsapp/campaigns/process/route.ts`
- `supabase/migrations/202610160001_whatsapp_polling_reduction.sql`
- `package.json`
- `vercel.json`

## Validation status

Validation has not yet been recorded in this document. The branch must pass the WhatsApp test suite and production build before it is eligible for merge/deployment.
