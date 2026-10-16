# WhatsApp Supabase Polling Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Reduce idle WhatsApp Supabase/API Gateway traffic without degrading inbox freshness, collaboration, calls, automations, or campaigns.

**Architecture:** Replace short-interval browser reads with one workspace-scoped Supabase Realtime Broadcast channel carrying invalidation-only events. Add short server-side TTL/in-flight caches for workspace, membership, and runtime-secret reads. Gate minute cron workers with indexed queue checks plus idle backoff state so idle queues do not invoke Vercel processors.

**Tech Stack:** Next.js 15, React 18, TypeScript, @supabase/supabase-js 2.x, Supabase Postgres/Realtime, pg_cron, pg_net.

**Spec:** User request in the 2026-10-16 WhatsApp polling audit conversation.

## Global Constraints
- No deployment or merge to `main` until explicit user approval.
- Preserve real-time inbox behavior and campaign processing.
- Keep WhatsApp row data server-only; Realtime broadcasts contain invalidation metadata only.
- Document every polling interval found and the resulting change.

## Review Focus
- Realtime disconnects must fall back to bounded reconciliation rather than leaving stale UI forever.
- Workspace-scoped events must not expose message/contact/note row payloads.
- Membership cache TTL must be short enough not to create long authorization revocation delays.
- Idle backoff must wake immediately when due queue work appears.
- Scheduled/no-reply/business-hours automation discovery must remain bounded while idle.

---

### Task 1: Realtime invalidation layer
**Files:** `src/lib/whatsapp/realtime.ts`, `src/lib/whatsapp/realtime.test.ts`, `src/components/whatsapp/WhatsAppRealtimeProvider.tsx`, `src/app/admin/whatsapp/layout.tsx`, polling client components, and `supabase/migrations/20261016150000_whatsapp_realtime_invalidation_and_worker_backoff.sql`.
- [x] Add tests for event classification and fallback intervals.
- [x] Add one workspace Realtime Broadcast subscription.
- [x] Add DB invalidation triggers with metadata-only payloads.
- [x] Replace 2s/8s/10s/15s read polling with Realtime + slow reconciliation fallbacks.

### Task 2: Static-query cache and de-duplication
**Files:** `src/lib/whatsapp/ttlCache.ts`, `src/lib/whatsapp/ttlCache.test.ts`, `src/lib/whatsapp/workspaces.ts`, `src/lib/whatsapp/teamAccess.ts`, `src/lib/whatsapp/processorConfig.ts`.
- [x] Test TTL caching and in-flight de-duplication.
- [x] Cache workspace/identity lookups and team membership briefly.
- [x] Cache automation processor secret for five minutes.
- [x] Invalidate local caches on local membership/workspace mutation paths.

### Task 3: Queue worker backoff
**Files:** migration from Task 1 and internal automation/campaign processor routes.
- [x] Add worker-state table and `whatsapp_should_invoke_worker` function.
- [x] Gate campaign processor when there are no due/stale recipients.
- [x] Gate automation processor when there are no due jobs, while keeping timer-trigger discovery on a bounded five-minute idle probe.
- [x] Preserve every-minute wakeup when actual due queue work is present.

### Task 4: Audit documentation and verification
**Files:** `docs/whatsapp-supabase-polling-audit-2026-10-16.md` and `package.json`.
- [x] Record production request counts and every interval found.
- [x] Record each replacement/cache/backoff decision.
- [x] Run WhatsApp tests, TypeScript validation, scoped ESLint, and production build validation on the branch.
- [x] Review final branch diff and request deployment approval without deploying.

## Verification

GitHub Actions run `38927668608` validated branch head `f5bf4fda640dcfc096ee76087f12a098de521d5c` before documentation-only cleanup:

- 229 WhatsApp tests passed, 0 failed.
- `npx tsc --noEmit` passed.
- Scoped WhatsApp/API ESLint passed with 0 errors and four pre-existing warnings.
- `npm run build` completed successfully.

The temporary validation workflow was deleted after the successful run. No production deployment or Supabase migration has been performed.
