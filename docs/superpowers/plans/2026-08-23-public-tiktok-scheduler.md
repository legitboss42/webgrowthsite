# Public TikTok Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the proven private TikTok scheduler into a secure open-enrollment public beta, while keeping public visibility disabled until TikTok approves the production application.

**Architecture:** Harden the existing Next.js scheduler in place. Extend the additive Supabase model for legal acceptance, quotas, numbered attempts, retention, deletion, and operations; keep TikTok-only identity and user-scoped encrypted connections; expose public enrollment and public visibility through independent fail-closed gates.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Supabase Postgres and Storage, TikTok Login Kit and Content Posting API, Supabase Cron and pg_net, Sharp, FFprobe static binary, Node test runner with tsx, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-23-public-tiktok-scheduler-design.md`

## Global Constraints

- TikTok Login Kit is the only user authentication mechanism.
- General enrollment has no manual owner approval after TikTok production approval.
- `TIKTOK_PUBLIC_POSTING_ENABLED` remains fail-closed until TikTok explicitly approves production Direct Post.
- Photos and videos are both present in the day-one product.
- Videos are validated and rejected when incompatible; the beta does not transcode them.
- Each user may create three newly scheduled posts per rolling 24 hours, twenty active future posts, and ten media assets per post.
- Original media is deleted seven days after publication, cancellation, or terminal failure; abandoned uploads are deleted after 24 hours.
- Web Growth articles, article metadata, and article-derived assets remain owner-only.
- All database changes are additive; existing migration history is preserved.
- Never expose TikTok tokens, Vercel secrets, Supabase service keys, private media, or another user's scheduler data.
- Do not claim public access, public visibility, TikTok approval, or production readiness before the corresponding external gate is verified.

---

## File structure

### New focused modules

- `src/lib/scheduler/launch.ts`: resolve enrollment, scheduling, video, Direct Post, and public-visibility gates.
- `src/lib/scheduler/legal.ts`: current legal versions and acceptance checks.
- `src/lib/scheduler/quotas.ts`: typed quota decisions and public error messages.
- `src/lib/scheduler/videoValidation.ts`: FFprobe metadata parsing and TikTok video-policy validation.
- `src/lib/scheduler/statusPresentation.ts`: map durable workflow states to user-facing labels and actions.
- `src/lib/scheduler/retry.ts`: numbered-attempt eligibility and retry creation policy.
- `src/lib/scheduler/retention.ts`: terminal and abandoned-media deletion eligibility.
- `src/lib/scheduler/operations.ts`: worker heartbeat and emergency-gate reads.
- `src/app/api/scheduler/posts/[id]/status/route.ts`: user-scoped polling endpoint.
- `src/app/api/scheduler/posts/[id]/retry/route.ts`: safe user-initiated retry endpoint.
- `src/app/api/scheduler/legal/accept/route.ts`: current-user terms acceptance.
- `src/app/api/scheduler/account/delete/route.ts`: confirmed deletion-request endpoint.
- `src/app/scheduler/terms/page.tsx`: scheduler-specific terms and retention summary.
- `src/components/scheduler/PostStatusPanel.tsx`: live status polling and status-specific presentation.
- `src/components/scheduler/TermsAcceptance.tsx`: first-use legal acceptance.
- `supabase/migrations/202608230001_public_scheduler_beta.sql`: additive public-beta schema, RPCs, indexes, and RLS changes.

### Existing modules with scoped changes

- `src/lib/scheduler/config.ts`: expose all fail-closed gates and fixed beta limits.
- `src/lib/scheduler/types.ts`: legal, validation, retry, deletion, and operational types.
- `src/lib/scheduler/runWorker.ts`: emergency gate, per-user fairness, numbered attempts, validation-version enforcement, and heartbeat.
- `src/lib/scheduler/reconcile.ts`: terminal retention timestamps and attempt-specific cleanup.
- `src/lib/scheduler/cleanup.ts` or current cleanup module: abandoned and seven-day original cleanup.
- `src/app/api/scheduler/auth/authorize/route.ts`: public-enrollment gate.
- `src/app/api/scheduler/auth/callback/route.ts`: active/suspended/legal onboarding state.
- `src/app/api/scheduler/uploads/route.ts`: count, byte, MIME, image, and video validation.
- `src/app/api/scheduler/posts/route.ts`: ten-media ownership, legal, suspension, and approval checks.
- `src/app/api/scheduler/posts/[id]/schedule/route.ts`: atomic daily and active-queue quota reservation.
- `src/app/scheduler/page.tsx`: truthful pre-launch or open-beta landing state.
- `src/app/scheduler/sign-in/page.tsx`: approval-pending or TikTok-only sign-in state.
- `src/app/scheduler/dashboard/page.tsx`: current status summaries and legal gate.
- `src/app/scheduler/posts/[id]/page.tsx`: status panel and sanitized failure data.
- `src/app/scheduler/settings/page.tsx`: disconnect and account-deletion controls.
- `src/app/scheduler/admin/page.tsx`: operational health, suspension, and emergency-gate display.
- `src/components/scheduler/NewPostComposer.tsx`: up to ten assets and validation errors.
- `src/components/scheduler/PostApprovalPanel.tsx`: approval-only and schedule-only controls; remove stale status inference.
- `package.json`: add the pinned FFprobe runtime dependency and verification scripts if needed.

---

### Task 1: Add independent fail-closed launch gates

**Files:**
- Create: `src/lib/scheduler/launch.ts`
- Create: `src/lib/scheduler/launch.test.ts`
- Modify: `src/lib/scheduler/config.ts`
- Modify: `src/lib/scheduler/security.test.ts`

**Interfaces:**
- Produces: `getSchedulerLaunchState(): SchedulerLaunchState`
- Produces: `assertPublicEnrollmentEnabled(state): void`
- Consumes: server environment variables only.

- [ ] **Step 1: Write failing gate tests**

```ts
test("all public beta gates fail closed", () => {
  delete process.env.SCHEDULER_PUBLIC_ENROLLMENT_ENABLED;
  delete process.env.SCHEDULER_NEW_SCHEDULING_ENABLED;
  delete process.env.SCHEDULER_VIDEO_ENABLED;
  delete process.env.TIKTOK_DIRECT_POST_ENABLED;
  delete process.env.TIKTOK_PUBLIC_POSTING_ENABLED;
  assert.deepEqual(getSchedulerLaunchState(), {
    publicEnrollment: false,
    newScheduling: false,
    video: false,
    directPost: false,
    publicPosting: false,
  });
});

test("public posting cannot activate without Direct Post", () => {
  process.env.TIKTOK_PUBLIC_POSTING_ENABLED = "true";
  delete process.env.TIKTOK_DIRECT_POST_ENABLED;
  assert.equal(getSchedulerLaunchState().publicPosting, false);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\launch.test.ts`

Expected: failure because `launch.ts` does not exist.

- [ ] **Step 3: Implement the gate resolver**

```ts
export type SchedulerLaunchState = {
  publicEnrollment: boolean;
  newScheduling: boolean;
  video: boolean;
  directPost: boolean;
  publicPosting: boolean;
};

const enabled = (name: string) => process.env[name] === "true";

export function getSchedulerLaunchState(): SchedulerLaunchState {
  const directPost = enabled("TIKTOK_DIRECT_POST_ENABLED");
  return {
    publicEnrollment: enabled("SCHEDULER_PUBLIC_ENROLLMENT_ENABLED"),
    newScheduling: enabled("SCHEDULER_NEW_SCHEDULING_ENABLED"),
    video: enabled("SCHEDULER_VIDEO_ENABLED"),
    directPost,
    publicPosting: directPost && enabled("TIKTOK_PUBLIC_POSTING_ENABLED"),
  };
}
```

- [ ] **Step 4: Run focused and scheduler tests**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\launch.test.ts src\lib\scheduler\security.test.ts`

Expected: all tests pass and existing owner matching stays exact.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/scheduler/launch.ts src/lib/scheduler/launch.test.ts src/lib/scheduler/config.ts src/lib/scheduler/security.test.ts
git commit -m "Add fail-closed scheduler launch gates"
```

### Task 2: Add the public-beta database contract

**Files:**
- Create: `supabase/migrations/202608230001_public_scheduler_beta.sql`
- Modify: `src/lib/scheduler/migration.test.ts`
- Modify: `src/lib/scheduler/types.ts`

**Interfaces:**
- Produces RPC: `reserve_public_scheduler_slot(p_user_id uuid, p_now timestamptz, p_daily_limit int, p_active_limit int)` returning boolean.
- Produces RPC: `create_safe_publish_retry(p_post_id uuid, p_user_id uuid)` returning the new attempt number or null.
- Produces fields used by legal, retention, retry, and operations modules.

- [ ] **Step 1: Extend migration contract tests**

Assert the new migration contains all of these exact concepts:

```ts
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
  "scheduler_worker_health",
]) assert.match(sql, new RegExp(expected));
```

- [ ] **Step 2: Run the migration test and verify it fails**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\migration.test.ts`

- [ ] **Step 3: Write the additive migration**

The migration must:

```sql
alter table public.scheduler_users
  add column if not exists privacy_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists deletion_requested_at timestamptz;

alter table public.scheduled_posts
  add column if not exists terminal_at timestamptz,
  add column if not exists retry_eligible boolean not null default false,
  add column if not exists next_retry_at timestamptz,
  add column if not exists user_failure_code text;

alter table public.publish_attempts
  add column if not exists attempt_number integer not null default 1;

create unique index if not exists publish_attempts_number_idx
  on public.publish_attempts(post_id, approval_id, attempt_number);

create table if not exists public.scheduler_worker_health (
  worker_name text primary key,
  last_started_at timestamptz,
  last_succeeded_at timestamptz,
  last_error_code text,
  updated_at timestamptz not null default now()
);
```

The migration must also replace the old single-attempt unique constraint only after creating the numbered index, implement both security-definer RPCs with exact user ownership checks, add active-queue and cleanup indexes, enable RLS on the health table, revoke RPC execution from `public`, `anon`, and `authenticated`, and preserve all existing rows.

- [ ] **Step 4: Run migration and TypeScript tests**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\migration.test.ts src\lib\scheduler\types.test.ts`

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/202608230001_public_scheduler_beta.sql src/lib/scheduler/migration.test.ts src/lib/scheduler/types.ts
git commit -m "Add public scheduler beta schema"
```

### Task 3: Gate OAuth enrollment and record legal acceptance

**Files:**
- Create: `src/lib/scheduler/legal.ts`
- Create: `src/lib/scheduler/legal.test.ts`
- Create: `src/app/api/scheduler/legal/accept/route.ts`
- Create: `src/components/scheduler/TermsAcceptance.tsx`
- Modify: `src/app/api/scheduler/auth/authorize/route.ts`
- Modify: `src/app/api/scheduler/auth/callback/route.ts`
- Modify: `src/app/scheduler/dashboard/page.tsx`
- Modify: `src/lib/scheduler/store.ts`
- Modify: `src/lib/scheduler/store.test.ts`

**Interfaces:**
- Produces: `CURRENT_SCHEDULER_TERMS_VERSION = "2026-08-23"`.
- Produces: `CURRENT_SCHEDULER_PRIVACY_VERSION = "2026-08-23"`.
- Produces: `hasCurrentLegalAcceptance(user): boolean`.

- [ ] **Step 1: Write failing legal and OAuth gate tests**

Test that non-owner OAuth authorization returns `503` when public enrollment is disabled, configured Sandbox owner/target testing remains available through an explicit server-side test allowance, suspended users do not enter an active dashboard, and outdated legal versions render the acceptance component.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\legal.test.ts src\lib\scheduler\oauth.test.ts src\lib\scheduler\store.test.ts`

- [ ] **Step 3: Implement acceptance policy and endpoint**

The acceptance route must require a valid session, same-origin POST, an active user, and this exact body:

```json
{
  "action": "accept",
  "termsVersion": "2026-08-23",
  "privacyVersion": "2026-08-23",
  "retentionAcknowledged": true,
  "contentResponsibilityAcknowledged": true
}
```

It updates only the authenticated user and returns `{ "accepted": true }`.

- [ ] **Step 4: Implement truthful OAuth and dashboard behavior**

`authorize/route.ts` must fail closed before creating state when enrollment is unavailable. `callback/route.ts` must never convert a suspended user into active status. `dashboard/page.tsx` must render `TermsAcceptance` before upload or scheduling links when legal versions are stale.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\legal.test.ts src\lib\scheduler\oauth.test.ts src\lib\scheduler\store.test.ts`

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

- [ ] **Step 6: Commit**

```powershell
git add src/lib/scheduler/legal.ts src/lib/scheduler/legal.test.ts src/app/api/scheduler/legal/accept/route.ts src/components/scheduler/TermsAcceptance.tsx src/app/api/scheduler/auth/authorize/route.ts src/app/api/scheduler/auth/callback/route.ts src/app/scheduler/dashboard/page.tsx src/lib/scheduler/store.ts src/lib/scheduler/store.test.ts
git commit -m "Gate scheduler enrollment and legal acceptance"
```

### Task 4: Build truthful public landing, sign-in, and scheduler terms

**Files:**
- Create: `src/app/scheduler/terms/page.tsx`
- Modify: `src/app/scheduler/page.tsx`
- Modify: `src/app/scheduler/sign-in/page.tsx`
- Modify: `src/app/scheduler/layout.tsx`
- Modify: `src/lib/route-governance.json`
- Create: `src/lib/scheduler/publicPages.test.ts`

**Interfaces:**
- Consumes: `getSchedulerLaunchState()`.
- Produces: crawlable product and terms pages with no false approval claims.

- [ ] **Step 1: Write failing source-contract tests**

Test that the public page contains both rollout states, that the sign-in CTA is absent when enrollment is false, that the terms page discloses seven-day terminal retention and TikTok-only authentication, and that route governance contains `/scheduler/terms/`.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\publicPages.test.ts`

- [ ] **Step 3: Implement server-rendered rollout copy**

Pre-approval CTA: **TikTok access opening after approval**.  
Open-beta CTA: **Continue with TikTok**.  
Never render “public posting available” based only on Direct Post being enabled.

- [ ] **Step 4: Run tests, SEO validation, and TypeScript**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\publicPages.test.ts`

Run: `npm run seo:validate`

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

- [ ] **Step 5: Commit**

```powershell
git add src/app/scheduler/terms/page.tsx src/app/scheduler/page.tsx src/app/scheduler/sign-in/page.tsx src/app/scheduler/layout.tsx src/lib/route-governance.json src/lib/scheduler/publicPages.test.ts
git commit -m "Add public scheduler launch experience"
```

### Task 5: Enforce upload, media-count, and image policies

**Files:**
- Modify: `src/lib/scheduler/media.ts`
- Modify: `src/lib/scheduler/media.test.ts`
- Modify: `src/lib/scheduler/mediaDelivery.ts`
- Modify: `src/lib/scheduler/mediaDelivery.test.ts`
- Modify: `src/app/api/scheduler/uploads/route.ts`
- Modify: `src/app/api/scheduler/posts/route.ts`
- Modify: `src/components/scheduler/NewPostComposer.tsx`
- Modify: `src/lib/scheduler/composer.test.ts`

**Interfaces:**
- Produces: `MAX_MEDIA_PER_POST = 10`.
- Produces: `validatePhotoMetadata(input): MediaValidationResult`.
- Preserves: `normalizeTikTokPhoto(source)` and direct, non-redirecting `/tiktok-media/` delivery.

- [ ] **Step 1: Write failing policy tests**

Cover eleven assets rejected, mixed photo/video posts rejected, disguised MIME rejected, corrupt images rejected, photo sources above 20 MB rejected, PNG normalized to JPEG delivery, and 5120 by 2880 input delivered within 1080 by 1080.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\media.test.ts src\lib\scheduler\mediaDelivery.test.ts src\lib\scheduler\composer.test.ts`

- [ ] **Step 3: Implement multiple uploads and server ownership checks**

`NewPostComposer` uses `<input multiple>` and uploads files serially or with a maximum concurrency of three. The post route loads every asset with `.eq("user_id", session.userId)` and requires the returned count to match the distinct requested IDs before inserting `post_media` rows in the submitted order.

- [ ] **Step 4: Run focused tests and TypeScript**

Run the command from Step 2, then `.\node_modules\.bin\tsc.cmd --noEmit`.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/scheduler/media.ts src/lib/scheduler/media.test.ts src/lib/scheduler/mediaDelivery.ts src/lib/scheduler/mediaDelivery.test.ts src/app/api/scheduler/uploads/route.ts src/app/api/scheduler/posts/route.ts src/components/scheduler/NewPostComposer.tsx src/lib/scheduler/composer.test.ts
git commit -m "Enforce public scheduler photo limits"
```

### Task 6: Add stored-object video validation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/scheduler/videoValidation.ts`
- Create: `src/lib/scheduler/videoValidation.test.ts`
- Modify: `src/app/api/scheduler/uploads/route.ts`
- Modify: `src/lib/scheduler/types.ts`

**Interfaces:**
- Produces: `probeVideo(path: string): Promise<VideoProbe>`.
- Produces: `validateTikTokVideo(probe, byteSize, creatorMaxDuration?): MediaValidationResult`.
- Consumes: a pinned `ffprobe-static` package binary executed with a fixed argument array and no shell.

- [ ] **Step 1: Add fixture-driven failing tests**

Use JSON probe fixtures rather than executing FFprobe in unit tests. Cover MP4/H.264 at 1080 by 1920 and 30 FPS passing; 22 FPS, 61 FPS, 359-pixel dimension, 4097-pixel dimension, unsupported codec, duration above creator maximum, and byte size above 500 MB failing with exact messages.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\videoValidation.test.ts`

- [ ] **Step 3: Add the pinned dependency**

Run: `npm install --save-exact ffprobe-static@3.1.0`

If that exact version is unavailable, stop and verify the current package version from the npm registry before changing the plan; do not guess a version.

- [ ] **Step 4: Implement safe probe parsing and policy**

Use `execFile` with the resolved binary and arguments `-v error -print_format json -show_streams -show_format <temporary-file>`. Never interpolate a filename into a shell command. Delete the temporary validation copy in `finally`.

- [ ] **Step 5: Integrate finalization**

The upload finalize action downloads the authenticated user's stored object, probes it, stores codec, dimensions, frame rate, duration, and validation version, and sets `VALID` only after all checks pass. `SCHEDULER_VIDEO_ENABLED=false` returns a truthful unavailable response before accepting bytes.

- [ ] **Step 6: Run tests and production build**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\videoValidation.test.ts src\lib\scheduler\media.test.ts`

Run: `npm run build`

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json src/lib/scheduler/videoValidation.ts src/lib/scheduler/videoValidation.test.ts src/app/api/scheduler/uploads/route.ts src/lib/scheduler/types.ts
git commit -m "Validate TikTok videos before scheduling"
```

### Task 7: Enforce atomic daily and active-queue quotas

**Files:**
- Create: `src/lib/scheduler/quotas.ts`
- Create: `src/lib/scheduler/quotas.test.ts`
- Modify: `src/lib/scheduler/store.ts`
- Modify: `src/lib/scheduler/store.test.ts`
- Modify: `src/app/api/scheduler/posts/[id]/schedule/route.ts`
- Modify: `supabase/migrations/202608230001_public_scheduler_beta.sql`

**Interfaces:**
- Consumes RPC: `reserve_public_scheduler_slot`.
- Produces: `PUBLIC_DAILY_SCHEDULE_LIMIT = 3`, `PUBLIC_ACTIVE_POST_LIMIT = 20`.

- [ ] **Step 1: Write failing quota and store-contract tests**

Test the exact RPC arguments, rolling-window boundary, twenty-active limit, owner not bypassing public limits unless a separately configured owner value exists, and concurrent requests allowing only one final slot.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\quotas.test.ts src\lib\scheduler\store.test.ts`

- [ ] **Step 3: Implement one atomic reservation**

The route must not count and update in separate application queries. The RPC obtains a transaction-scoped advisory lock for the user, counts rolling daily usage and active states, and changes the owned approved post to `SCHEDULED` only when both limits allow it.

- [ ] **Step 4: Run focused tests**

Run the command from Step 2 and the migration test.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/scheduler/quotas.ts src/lib/scheduler/quotas.test.ts src/lib/scheduler/store.ts src/lib/scheduler/store.test.ts src/app/api/scheduler/posts/[id]/schedule/route.ts supabase/migrations/202608230001_public_scheduler_beta.sql
git commit -m "Enforce scheduler beta quotas atomically"
```

### Task 8: Add durable numbered retries without cloning posts

**Files:**
- Create: `src/lib/scheduler/retry.ts`
- Create: `src/lib/scheduler/retry.test.ts`
- Create: `src/app/api/scheduler/posts/[id]/retry/route.ts`
- Modify: `src/lib/scheduler/runWorker.ts`
- Modify: `src/lib/scheduler/worker.ts`
- Modify: `src/lib/scheduler/worker.test.ts`
- Modify: `src/lib/scheduler/reconcile.ts`
- Modify: `src/lib/scheduler/reconcile.test.ts`
- Modify: `supabase/migrations/202608230001_public_scheduler_beta.sql`

**Interfaces:**
- Produces: `classifyRetryEligibility(attempt): "AUTOMATIC" | "USER" | "NONE"`.
- Produces API response: `{ postId, attemptNumber, status: "SCHEDULED" }`.

- [ ] **Step 1: Write failing retry tests**

Cover safe pre-init network failure, TikTok terminal media failure, recorded `publish_id`, ambiguous post-init failure, changed approval, and concurrent retry clicks. Assert that a retry increments `attempt_number`, preserves prior attempts, and never clears an old `publish_id`.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\retry.test.ts src\lib\scheduler\worker.test.ts src\lib\scheduler\reconcile.test.ts`

- [ ] **Step 3: Implement the retry RPC and endpoint**

The endpoint requires session ownership, same-origin POST, unchanged approval, `retry_eligible=true`, no active attempt, and available quota. The RPC locks the post, allocates `max(attempt_number)+1`, resets only workflow claim fields, and returns the new number.

- [ ] **Step 4: Update worker attempt lookup**

Replace `.maybeSingle()` by the current numbered-attempt lookup. When an attempt already has a `publish_id`, reconcile it. When the attempt is new and has no `publish_id`, initialize exactly once.

- [ ] **Step 5: Run tests and TypeScript**

Run the command from Step 2, the migration test, and `.\node_modules\.bin\tsc.cmd --noEmit`.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/scheduler/retry.ts src/lib/scheduler/retry.test.ts src/app/api/scheduler/posts/[id]/retry/route.ts src/lib/scheduler/runWorker.ts src/lib/scheduler/worker.ts src/lib/scheduler/worker.test.ts src/lib/scheduler/reconcile.ts src/lib/scheduler/reconcile.test.ts supabase/migrations/202608230001_public_scheduler_beta.sql
git commit -m "Add safe numbered TikTok retries"
```

### Task 9: Render and poll durable status correctly

**Files:**
- Create: `src/lib/scheduler/statusPresentation.ts`
- Create: `src/lib/scheduler/statusPresentation.test.ts`
- Create: `src/app/api/scheduler/posts/[id]/status/route.ts`
- Create: `src/components/scheduler/PostStatusPanel.tsx`
- Modify: `src/lib/scheduler/postWorkflow.ts`
- Modify: `src/lib/scheduler/postWorkflow.test.ts`
- Modify: `src/components/scheduler/PostApprovalPanel.tsx`
- Modify: `src/app/scheduler/posts/[id]/page.tsx`

**Interfaces:**
- Produces: `getStatusPresentation(status, failureCode): { tone, title, detail, canRetry }`.
- Status endpoint returns only owned post status, publish timestamp, sanitized failure code, retry eligibility, and next poll interval.

- [ ] **Step 1: Write failing presentation tests**

Assert `PUBLISHED` renders “Published successfully,” `PROCESSING` renders “TikTok is processing your post,” and `NEEDS_ATTENTION` never renders scheduled success. Include corrective mappings for reconnect, unsupported media, privacy mismatch, quota, and generic provider failure.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\statusPresentation.test.ts src\lib\scheduler\postWorkflow.test.ts src\lib\scheduler\postApprovalPanel.test.ts`

- [ ] **Step 3: Implement polling**

Poll every five seconds only while status is `CLAIMED`, `SUBMITTING`, or `PROCESSING`; stop on terminal state, hidden tab, component unmount, or 15-minute client timeout. Use `router.refresh()` only after the API reports a changed durable status.

- [ ] **Step 4: Run focused tests and rendered local checks**

Run the command from Step 2 and `.\node_modules\.bin\tsc.cmd --noEmit`.

Browser-check one scheduled, processing, published, and needs-attention fixture at desktop and narrow widths.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/scheduler/statusPresentation.ts src/lib/scheduler/statusPresentation.test.ts src/app/api/scheduler/posts/[id]/status/route.ts src/components/scheduler/PostStatusPanel.tsx src/lib/scheduler/postWorkflow.ts src/lib/scheduler/postWorkflow.test.ts src/components/scheduler/PostApprovalPanel.tsx src/app/scheduler/posts/[id]/page.tsx
git commit -m "Show live scheduler publishing status"
```

### Task 10: Implement retention, disconnect, and account deletion

**Files:**
- Create: `src/lib/scheduler/retention.ts`
- Create: `src/lib/scheduler/retention.test.ts`
- Create: `src/app/api/scheduler/account/delete/route.ts`
- Modify: `src/lib/scheduler/reconcile.ts`
- Modify: `src/app/api/scheduler/cron/cleanup/route.ts`
- Modify: `src/app/api/scheduler/disconnect/route.ts`
- Modify: `src/app/scheduler/settings/page.tsx`
- Modify: `src/lib/scheduler/store.ts`
- Modify: `supabase/migrations/202608230001_public_scheduler_beta.sql`

**Interfaces:**
- Produces: `getDeletionEligibility(asset, now): "ABANDONED" | "TERMINAL" | null`.
- Produces deletion request state transitions `REQUESTED -> RUNNING -> COMPLETE | NEEDS_ATTENTION`.

- [ ] **Step 1: Write failing retention tests**

Cover 24-hour abandoned uploads, seven-day terminal originals, immediate terminal staging cleanup, active-attempt protection, idempotent reruns, disconnect cancelling only pre-submission jobs, and deletion never removing a recorded TikTok post from TikTok.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\retention.test.ts src\lib\scheduler\reconcile.test.ts src\lib\scheduler\store.test.ts`

- [ ] **Step 3: Implement cleanup and deletion workflow**

The account endpoint records a deletion request after explicit confirmation text `DELETE MY SCHEDULER ACCOUNT`, clears the application session, revokes/removes the TikTok connection, cancels safe jobs, and lets the protected cleanup worker remove user records and storage in dependency order.

- [ ] **Step 4: Run tests, TypeScript, and migration test**

Run the command from Step 2, the migration test, and `.\node_modules\.bin\tsc.cmd --noEmit`.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/scheduler/retention.ts src/lib/scheduler/retention.test.ts src/app/api/scheduler/account/delete/route.ts src/lib/scheduler/reconcile.ts src/app/api/scheduler/cron/cleanup/route.ts src/app/api/scheduler/disconnect/route.ts src/app/scheduler/settings/page.tsx src/lib/scheduler/store.ts supabase/migrations/202608230001_public_scheduler_beta.sql
git commit -m "Add scheduler retention and account deletion"
```

### Task 11: Add worker fairness, heartbeat, and owner operations

**Files:**
- Create: `src/lib/scheduler/operations.ts`
- Create: `src/lib/scheduler/operations.test.ts`
- Modify: `src/lib/scheduler/runWorker.ts`
- Modify: `src/lib/scheduler/store.ts`
- Modify: `src/app/scheduler/admin/page.tsx`
- Modify: `supabase/migrations/202608230001_public_scheduler_beta.sql`

**Interfaces:**
- Produces: `recordWorkerStarted`, `recordWorkerSucceeded`, `recordWorkerFailure`.
- Produces owner-only aggregate queries without token or media-content fields.

- [ ] **Step 1: Write failing operations tests**

Assert the worker batch cannot contain more than two posts from one user while other users have due posts, missing publishing gate produces no TikTok call, heartbeat success updates only after a full worker cycle, and admin data excludes `encrypted_tokens`.

- [ ] **Step 2: Verify failures**

Run: `.\node_modules\.bin\tsx.cmd --test src\lib\scheduler\operations.test.ts src\lib\scheduler\worker.test.ts src\lib\scheduler\store.test.ts`

- [ ] **Step 3: Implement fair claim and heartbeat RPCs**

Use a ranked due-post CTE partitioned by `user_id`, take at most two rows per user, then apply the global batch limit with row locking. Record only sanitized health codes.

- [ ] **Step 4: Implement the owner dashboard**

Render user and workflow counts, heartbeat age, cleanup backlog, reconnect count, failure categories, and current feature gates. Suspension/restoration mutations require exact owner authorization and separate same-origin endpoints; no general media browser is added.

- [ ] **Step 5: Run tests and TypeScript**

Run the command from Step 2 and `.\node_modules\.bin\tsc.cmd --noEmit`.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/scheduler/operations.ts src/lib/scheduler/operations.test.ts src/lib/scheduler/runWorker.ts src/lib/scheduler/store.ts src/app/scheduler/admin/page.tsx supabase/migrations/202608230001_public_scheduler_beta.sql
git commit -m "Add scheduler operations and worker fairness"
```

### Task 12: Apply and verify the additive Supabase migration

**Files:**
- Verify: `supabase/migrations/202608230001_public_scheduler_beta.sql`
- Do not modify earlier migration files.

**Interfaces:**
- Produces the live database contract required by Tasks 2 through 11.

- [ ] **Step 1: Compare local and remote migration history**

Run the repository's established Supabase migration-list command in the linked Web Growth project. Stop if any remote-only or locally missing migration appears.

- [ ] **Step 2: Run local verification before mutation**

Run: `npm run test:scheduler`

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

Run: `git diff --check`

- [ ] **Step 3: Apply the one additive migration**

Apply only `202608230001_public_scheduler_beta.sql` through the linked Supabase project workflow.

- [ ] **Step 4: Verify remote state**

Query information schema and `pg_indexes` for every new column and index; inspect function definitions for ownership locks and revokes; verify RLS is enabled; call quota and retry RPCs inside a transaction that rolls back.

- [ ] **Step 5: Commit any verification-only corrections**

If the live engine requires a migration correction, add a new forward migration rather than editing the applied file, then commit it separately.

### Task 13: Run full product verification and deploy pre-launch mode

**Files:**
- Modify only if verification reveals a scoped defect.
- Verify: scheduler routes, API routes, migrations, environment gates, and live deployment.

**Interfaces:**
- Produces a deployed public pre-launch product; does not claim TikTok approval or open enrollment.

- [ ] **Step 1: Run the full local verification suite**

Run: `npm run test:scheduler`

Run: `.\node_modules\.bin\tsc.cmd --noEmit`

Run: `npm run lint`

Run: `npm run seo:validate`

Run: `npm run build`

Run: `git diff --check`

- [ ] **Step 2: Verify rendered UX**

Check public landing, disabled enrollment, terms, accepted terms, photo upload, video rejection, ten-media boundary, quota errors, approval, scheduling, live statuses, retry eligibility, settings, deletion confirmation, and admin at desktop and narrow viewport.

- [ ] **Step 3: Push the implementation branch or `main` as authorized**

Verify the remote commit, deployment status, and live commit before calling deployment complete.

- [ ] **Step 4: Verify production remains fail-closed**

Confirm:

```text
SCHEDULER_PUBLIC_ENROLLMENT_ENABLED=false
TIKTOK_PUBLIC_POSTING_ENABLED=false
```

Direct Post may remain enabled only for the controlled Sandbox test account.

### Task 14: Complete TikTok Sandbox evidence and production review

**Files:**
- Create review assets outside Git unless they are intentionally public documentation.
- Update TikTok Developer Portal configuration through the authenticated browser.

**Interfaces:**
- Produces external TikTok review evidence; does not itself grant approval.

- [ ] **Step 1: Verify a valid private photo post**

Record the scheduler post ID, TikTok publish ID, `PUBLISHED` terminal state, and cleanup evidence without recording tokens.

- [ ] **Step 2: Verify a valid private video post**

Use a compliant MP4/H.264 file. Confirm direct media retrieval, TikTok publish ID, terminal `PUBLISHED`, and cleanup.

- [ ] **Step 3: Record the real review walkthrough**

Show the twelve steps listed in the spec, including editable metadata, creator-returned settings, explicit consent, scheduling, automatic execution, status, and data controls.

- [ ] **Step 4: Minimize production scopes**

Keep `user.info.basic` and `video.publish`. Keep `video.upload` only if the draft-upload product is actually exposed. Remove unused profile and statistics scopes.

- [ ] **Step 5: Submit the production application**

Before the final submission action, obtain explicit user confirmation because it is a high-stakes external form submission. Report submission as pending review, not approved.

### Task 15: Activate production and open enrollment after approval

**Files:**
- Environment configuration only unless approval reveals a code defect.

**Interfaces:**
- Produces the publicly launched beta only after TikTok approval.

- [ ] **Step 1: Verify TikTok's approval evidence**

Confirm the production application status in the Developer Portal and record the exact approved products, scopes, redirect URI, and URL properties.

- [ ] **Step 2: Transfer production credentials securely**

Set the approved production client key and secret in the intended Vercel Production environment without exposing values in output or Git.

- [ ] **Step 3: Run an owner-controlled production OAuth and private smoke test**

Keep public visibility disabled. Verify login, connection, photo/video validation, scheduling, worker execution, terminal status, and cleanup.

- [ ] **Step 4: Enable public visibility for one controlled smoke test**

Set `TIKTOK_PUBLIC_POSTING_ENABLED=true`, redeploy, query the creator's current options, select only a returned public option, obtain explicit approval immediately before posting, and verify terminal publication.

- [ ] **Step 5: Open self-service enrollment**

Set `SCHEDULER_PUBLIC_ENROLLMENT_ENABLED=true`, redeploy, and verify a non-owner eligible TikTok account can create an isolated scheduler account without manual approval.

- [ ] **Step 6: Final launch audit**

Report code, Git, database migration, deployment, TikTok approval, credentials, public smoke test, open enrollment, quotas, cleanup, and monitoring as separate verified lines.

---

## Plan self-review

- Spec coverage: every requirement in Sections 1 through 21 maps to Tasks 1 through 15.
- Placeholder scan: no deferred-work markers or undefined neighboring interfaces remain.
- Type consistency: launch, legal, quota, retry, retention, video-validation, status-presentation, and operations interfaces are defined before consumers.
- Scope: billing, teams, AI generation, cross-platform publishing, and transcoding remain excluded.
- External truth: Tasks 14 and 15 keep TikTok submission, approval, production activation, and open enrollment distinct.
