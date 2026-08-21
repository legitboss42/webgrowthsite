# TikTok Creator Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public TikTok-authenticated scheduler that Direct Posts approved creator media within five minutes while keeping Web Growth articles owner-only.

**Architecture:** Extend the existing Next.js TikTok integration into a server-session product backed by Supabase Postgres and private Storage. Store encrypted TikTok tokens and immutable approvals durably, then use protected Vercel Cron workers with atomic database claims and TikTok status reconciliation. Keep Direct Post and public visibility behind separate fail-closed gates.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS 4, Supabase Postgres/Storage, TikTok Login Kit and Content Posting API, Vercel Cron, Node tests through `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-21-tiktok-creator-scheduler-design.md`

## Global Constraints

- Official TikTok APIs only; no browser automation, password capture, simulated clicks, or unofficial clients.
- Public sign-in uses `user.info.basic`; Direct Post uses separately authorized `video.publish`.
- Only an `open_id` in `OWNER_TIKTOK_OPEN_IDS` can receive article data or article-generation access.
- Creator beta limit: three scheduled submissions per rolling 24 hours.
- Normal submission precision: five minutes; never promise exact public-visibility time.
- Unaudited Direct Posts remain private; public posting stays false until confirmed TikTok approval.
- Tokens use a dedicated encryption key and never reach browsers or logs.
- Scheduler account screens are ad-free and noindex.
- Preserve WhatsApp data, legacy TikTok flow, migration history, and unrelated worktree changes.
- Remote mutations occur only in the final rollout task after local verification.

---

## Planned File Boundaries

- `supabase/migrations/202608210001_tiktok_creator_scheduler.sql`: tables, indexes, RLS, private bucket, atomic job RPCs.
- `src/lib/scheduler/types.ts`: records and state unions.
- `src/lib/scheduler/config.ts`: gates, allowlist, quotas, retention.
- `src/lib/scheduler/crypto.ts`: versioned AES-256-GCM token encryption.
- `src/lib/scheduler/session.ts`: signed opaque application sessions.
- `src/lib/scheduler/store.ts`: durable user, connection, media, approval, job, and attempt persistence.
- `src/lib/scheduler/media.ts`: file constraints and retrieval signatures.
- `src/lib/scheduler/approval.ts`: canonical approval snapshots and fingerprints.
- `src/lib/scheduler/policy.ts`: limits, transitions, and retry classification.
- `src/lib/scheduler/tiktokClient.ts`: creator info, Direct Post, refresh, status.
- `src/lib/scheduler/worker.ts`: publish, reconcile, and cleanup cycles.
- `src/app/api/scheduler/**`: OAuth, uploads, posts, media, cron, webhook.
- `src/app/scheduler/**` and `src/components/scheduler/**`: public beta, creator dashboard, owner tools.
- `vercel.json`: five-minute publisher and daily cleanup schedules.

---

### Task 1: Database and shared contracts

**Files:**
- Create: `supabase/migrations/202608210001_tiktok_creator_scheduler.sql`
- Create: `src/lib/scheduler/types.ts`
- Test: `src/lib/scheduler/types.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `PostStatus`, domain record/input types, and SQL RPCs `claim_due_tiktok_posts`, `reserve_tiktok_daily_slot`, `cancel_tiktok_connection_jobs`.

- [ ] **Step 1: Write the failing state-contract test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { POST_STATUSES, isPostStatus } from "./types";

test("states cover durable worker boundaries", () => {
  assert.equal(isPostStatus("SCHEDULED"), true);
  assert.equal(isPostStatus("PROCESSING"), true);
  assert.equal(isPostStatus("UNKNOWN"), false);
  assert.equal(new Set(POST_STATUSES).size, POST_STATUSES.length);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npx tsx --test src/lib/scheduler/types.test.ts`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the state/type module**

```ts
export const POST_STATUSES = [
  "DRAFT", "NEEDS_CONNECTION", "NEEDS_APPROVAL", "SCHEDULED", "CLAIMED",
  "SUBMITTING", "PROCESSING", "PUBLISHED", "FAILED_RETRYABLE",
  "NEEDS_ATTENTION", "CANCELLED",
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];
export const isPostStatus = (value: string): value is PostStatus =>
  POST_STATUSES.includes(value as PostStatus);
```

Add explicit UUID-string/ISO-string interfaces for users, connections, assets, posts, approvals, and attempts.

- [ ] **Step 4: Create the additive SQL migration**

Create eight spec tables with UUID keys, ownership foreign keys, checks, indexes, timestamps, and a unique request fingerprint. Enable RLS with no client policies. Create private bucket `tiktok-scheduler-media`. Add fixed-`search_path` security-definer RPCs for atomic claims, rolling-slot reservation, and connection cancellation; revoke RPC execution from `anon` and `authenticated`.

- [ ] **Step 5: Add `test:scheduler`, run tests, lint SQL, and commit**

```json
"test:scheduler": "tsx --test src/lib/scheduler/*.test.ts src/app/api/scheduler/**/*.test.ts"
```

Run: `npm run test:scheduler`, `npx tsc --noEmit`, `git diff --check`. Validate SQL against a local Supabase database when available.  
Commit: `feat: add TikTok scheduler database foundation`

---

### Task 2: Fail-closed configuration, token encryption, and sessions

**Files:**
- Create: `src/lib/scheduler/config.ts`
- Create: `src/lib/scheduler/crypto.ts`
- Create: `src/lib/scheduler/session.ts`
- Test: corresponding `*.test.ts` files
- Modify: `.env.local.example`

**Interfaces:**
- Produces: `getSchedulerConfig()`, `isOwnerOpenId()`, `encryptTikTokTokens()`, `decryptTikTokTokens()`, `createSchedulerSession()`, `readSchedulerSession()`.

- [ ] **Step 1: Write failing tests for closed gates, owner parsing, tamper rejection, and expiry**

```ts
test("public posting fails closed", () => {
  delete process.env.TIKTOK_PUBLIC_POSTING_ENABLED;
  assert.equal(getSchedulerConfig().publicPostingEnabled, false);
});
test("tampered token ciphertext is rejected", () => {
  const sealed = encryptTikTokTokens(tokens);
  assert.equal(decryptTikTokTokens(sealed + "x"), null);
});
```

- [ ] **Step 2: Run tests and confirm missing-module failures**

Run: `npx tsx --test src/lib/scheduler/config.test.ts src/lib/scheduler/crypto.test.ts src/lib/scheduler/session.test.ts`.

- [ ] **Step 3: Implement minimal secure modules**

Use a random 12-byte IV, AES-256-GCM, payload version 1, independent encryption/session secrets, bounded session expiry, constant-time signature comparison, comma-separated owner IDs, limit 3, and both gates false unless exactly `true`. Never fall back to the TikTok client secret.

- [ ] **Step 4: Document variable names and verify**

Add owner IDs, encryption/session/cron secrets, and both false feature gates to `.env.local.example` without values. Run focused tests, TypeScript, and diff check.

- [ ] **Step 5: Commit**

Commit: `feat: secure TikTok scheduler sessions and tokens`

---

### Task 3: Durable scheduler store

**Files:**
- Create: `src/lib/scheduler/supabase.ts`
- Create: `src/lib/scheduler/store.ts`
- Test: `src/lib/scheduler/store.test.ts`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: `SchedulerStore` methods for user/connection/media/post/approval/attempt operations and atomic RPCs.

- [ ] **Step 1: Install `@supabase/supabase-js` and write a failing mocked store test**

Assert missing service credentials fail, every user operation includes owner ID, rolling-slot conflicts are preserved, and concurrent claims return a job once.

- [ ] **Step 2: Implement a server-only client and store**

```ts
export type SchedulerStore = {
  upsertUser(input: UpsertSchedulerUserInput): Promise<SchedulerUser>;
  schedulePost(input: SchedulePostInput): Promise<ScheduledPost>;
  claimDuePosts(nowIso: string, limit: number): Promise<ScheduledPost[]>;
  recordPublishId(attemptId: string, publishId: string): Promise<void>;
};
```

Disable session persistence, use service-role only server-side, sanitize errors, and call RPCs for claims/limits.

- [ ] **Step 3: Run tests and commit**

Run store tests, TypeScript, and diff check.  
Commit: `feat: persist TikTok scheduler workflows`

---

### Task 4: TikTok authentication and Direct Post client

**Files:**
- Create: `src/lib/scheduler/tiktokClient.ts` and test
- Create: `src/app/api/scheduler/auth/{authorize,callback,sign-out}/route.ts`
- Create: `src/app/api/scheduler/disconnect/route.ts`
- Modify: `src/lib/tiktok.ts`

**Interfaces:**
- Produces: `queryCreatorInfo`, `directPostPhotos`, `directPostVideo`, `fetchPublishStatus`, durable OAuth callbacks.

- [ ] **Step 1: Write mocked API tests**

Test `video.publish` scopes, creator-info parsing, `DIRECT_POST` photo payload, video `PULL_FROM_URL`, privacy gating, status parsing, refresh rotation, and sanitized errors.

- [ ] **Step 2: Confirm failure, then implement the official endpoints**

Use creator-info query, photo content init, video init, and status fetch. Require `SELF_ONLY` unless both gates are true and revalidate privacy immediately before submission.

- [ ] **Step 3: Implement OAuth routes**

Login requests `user.info.basic`; publishing connection requests `user.info.basic,video.publish`. Validate state/TTL, exchange server-side, upsert user, encrypt/store tokens, rotate session, normalize redirects, and cancel future jobs on disconnect.

- [ ] **Step 4: Verify legacy compatibility and commit**

Keep `/connect/tiktok`. Run new and existing TikTok tests, TypeScript, diff check.  
Commit: `feat: authenticate creators for TikTok Direct Post`

---

### Task 5: Secure media upload and retrieval

**Files:**
- Create: `src/lib/scheduler/media.ts` and test
- Create: `src/app/api/scheduler/uploads/route.ts`
- Create: `src/app/api/scheduler/media/[id]/route.ts`

**Interfaces:**
- Produces: metadata validation, private signed uploads, finalization, and expiring TikTok retrieval URLs.

- [ ] **Step 1: Write boundary tests**

Cover allowed MIME types, 500 MB video, 20 MB photo, 35 photos, MIME mismatch, invalid duration/dimensions, ownership, and expired retrieval signatures.

- [ ] **Step 2: Implement user-scoped private uploads**

Use paths `${userId}/${assetId}/${safeFilename}`; finalize only after server object inspection and store detected metadata/checksum.

- [ ] **Step 3: Implement controlled retrieval**

Bind HMAC to media ID, attempt ID, and expiry. Serve only attempt-owned media in `SUBMITTING`/`PROCESSING` with `nosniff`, correct length/type, and sufficient bounded lifetime.

- [ ] **Step 4: Verify and commit**

Run media tests, TypeScript, lint touched files, diff check.  
Commit: `feat: secure TikTok scheduler media`

---

### Task 6: Approval, limits, and scheduling APIs

**Files:**
- Create: `src/lib/scheduler/approval.ts`, `policy.ts`, and tests
- Create: `src/app/api/scheduler/posts/route.ts`
- Create: `src/app/api/scheduler/posts/[id]/schedule/route.ts`

**Interfaces:**
- Produces: canonical snapshots/fingerprints, transition/retry policy, create/approve/schedule/cancel APIs.

- [ ] **Step 1: Write failing tests**

Test deterministic fingerprints, invalidation after every material change, unchanged rescheduling, fourth-post rejection, DST-safe UTC conversion, and pre-submission-only cancellation.

- [ ] **Step 2: Implement canonical approvals and state policy**

Sort object keys, preserve media order, hash checksums/settings, require manual privacy, applicable interactions, disclosure, declaration version, creator ID, UTC instant, and IANA timezone.

- [ ] **Step 3: Implement owned CSRF-protected APIs**

Resolve session, require active user, verify same-origin/CSRF, check ownership again in the store, and reserve daily capacity transactionally.

- [ ] **Step 4: Verify and commit**

Run focused tests, TypeScript, diff check.  
Commit: `feat: approve and schedule TikTok posts`

---

### Task 7: Creator product and owner-only article tools

**Files:**
- Create: `src/app/scheduler/{layout,page,sign-in/page,dashboard/page,new/page,settings/page,admin/page}.tsx`
- Create: `src/app/scheduler/posts/[id]/page.tsx`
- Create: focused `src/components/scheduler/*.tsx`
- Modify: `src/app/robots.ts`

**Interfaces:**
- Produces: accessible public beta and authenticated creator/owner experiences.

- [ ] **Step 1: Write pure view-model tests**

Assert missing privacy/declaration blocks approval and a non-owner view model contains no article fields.

- [ ] **Step 2: Build mobile-first landing, sign-in, dashboard, upload, preview, approval, schedule, settings, and status UI**

Use semantic HTML, labels, visible focus, error summaries, reduced-motion-safe CSS, noindex authenticated routes, ad-free shells, editable captions, no default privacy/interactions, and exact disclosure/declaration controls.

- [ ] **Step 3: Add owner-only sources and admin**

Fetch articles only after server allowlist verification. Reuse existing photo draft, video script, and Remotion modules. Never return tokens or raw secrets/errors.

- [ ] **Step 4: Verify and commit**

Run tests, TypeScript, lint, build, and mobile/desktop keyboard browser review.  
Commit: `feat: add TikTok creator scheduler dashboard`

---

### Task 8: Five-minute publishing worker

**Files:**
- Create: `src/lib/scheduler/worker.ts` and test
- Create: `src/app/api/scheduler/cron/publish/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Produces: `runPublishCycle({ now, batchSize })` and protected cron route.

- [ ] **Step 1: Write worker tests**

Cover concurrent claims, refresh, creator preflight, invalid privacy, closed gates, photo/video submission, immediate publish-ID storage, safe retry, ambiguous hold, and no resubmit with an existing ID.

- [ ] **Step 2: Implement injected worker dependencies**

Claim bounded batches, refresh tokens, query creator info, enforce settings/gates, create retrieval URLs, persist attempt before request, and persist `publish_id` immediately.

- [ ] **Step 3: Configure protected cron**

```json
{
  "crons": [
    { "path": "/api/scheduler/cron/publish", "schedule": "*/5 * * * *" },
    { "path": "/api/scheduler/cron/cleanup", "schedule": "17 3 * * *" }
  ]
}
```

Require bearer `SCHEDULER_CRON_SECRET`; return only counts/correlation ID.

- [ ] **Step 4: Verify twice and commit**

Run worker tests twice, TypeScript, build, diff check.  
Commit: `feat: publish scheduled TikTok posts`

---

### Task 9: Status reconciliation, cleanup, and operations

**Files:**
- Modify: worker and tests
- Create: `src/app/api/scheduler/cron/cleanup/route.ts`
- Create: `src/app/api/scheduler/tiktok/webhook/route.ts`
- Modify: admin page

**Interfaces:**
- Produces: processing reconciliation, retention cleanup, optional verified webhook, heartbeat/admin health.

- [ ] **Step 1: Write tests**

Test complete/failed/processing/auth-removed states, webhook idempotency, active-attempt retention, and 24-hour/7-day/30-day cleanup boundaries.

- [ ] **Step 2: Implement bounded polling and optional webhook**

Poll incomplete attempts at controlled cadence. Enable webhooks only after implementing TikTok's current authenticity mechanism; otherwise fail closed and use polling.

- [ ] **Step 3: Implement safe cleanup/admin signals**

Never delete active-attempt media. Record audit events and show heartbeat, overdue jobs, reconnects, ambiguous attempts, usage, cleanup backlog, rates, and gates.

- [ ] **Step 4: Verify and commit**

Run all scheduler tests, TypeScript, lint, build, diff check.  
Commit: `feat: reconcile TikTok publishing operations`

---

### Task 10: Infrastructure rollout and private end-to-end proof

**Files:**
- Modify: operational docs
- Modify legacy flow only after verified replacement

**Interfaces:**
- Produces: deployed private beta proof with public posting still disabled.

- [ ] **Step 1: Run complete local verification**

```powershell
npm run test:scheduler
npx tsx --test src/lib/whatsapp/*.test.ts
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

- [ ] **Step 2: Compare and apply additive migration**

Confirm remote/local history through `202608130001`, review SQL, run `supabase db push`, then verify migration history, schema, RLS, RPC privileges, bucket privacy, and policies.

- [ ] **Step 3: Add independent secrets with gates false**

Use Vercel environment commands separately for Production/Preview/Development. Never print values. Set both publishing gates false.

- [ ] **Step 4: Deploy and verify without publishing**

Sign in, capture owner `open_id`, set allowlist, redeploy, and test isolation, uploads, approvals, scheduling, limits, cancellation, disconnect, and session rotation.

- [ ] **Step 5: Enable only unaudited private Direct Post**

After `video.publish` is configured, enable Direct Post but leave public posting false. Submit one owner photo carousel and one video as `SELF_ONLY`; prove one `publish_id` per approval and no duplicate after repeated cron.

- [ ] **Step 6: Security/browser review and audit evidence**

Test cross-user access, owner endpoints as creator, forged session/CSRF/cron/media signatures, revoked tokens, and ambiguous retries. Verify mobile/desktop/ad-free/noindex behavior. Prepare truthful TikTok audit evidence; do not enable public visibility before approval.

- [ ] **Step 7: Final commit and handoff**

Commit operational docs separately. Report exact migration, deployment, gates, private tests, unverified TikTok approval/public state, and unrelated worktree changes.

---

## Stop Conditions

Pause before remote mutation if migration history diverges, Vercel is not linked to `victorious-projects-e536ead5/webgrowthsite`, a secret would be exposed, TikTok lacks `video.publish`, public visibility lacks confirmed audit approval, or unrelated edits overlap planned files and cannot be preserved.

