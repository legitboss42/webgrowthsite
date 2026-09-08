# Unified Web Growth Automation Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Content Automation, TikTok Publishing, and WhatsApp Business behind one Web Growth account/session and one cross-product dashboard without merging their underlying engines.

**Architecture:** Introduce one canonical signed Web Growth session with legacy-cookie fallbacks, preserve provider engines and current routes, and add a shared application shell plus cross-module Overview, Media, Connections, and Settings pages. Existing authorization remains module-specific.

**Tech Stack:** Next.js App Router, React 18, Tailwind CSS 4, TypeScript, Supabase, existing secure-cookie helpers, Node `tsx --test` suites.

**Spec:** `docs/superpowers/specs/2026-09-08-unified-automation-dashboard-design.md`

## Global Constraints

- No Vercel preview or production deployment during implementation.
- Feature branch: `feature/unified-automation-dashboard`; its deployment is disabled in `vercel.json` before the branch is created.
- Do not merge the TikTok, Content Automation, or WhatsApp engines.
- Preserve current provider-specific OAuth, publishing, storage, and authorization boundaries.
- Do not add a database migration for the initial owner-account integration.
- Existing WhatsApp Stage 12 functionality and route behavior must remain intact.
- After merge to `main`, delete the feature branch; never delete `main`.

---

### Task 1: Canonical Web Growth session

**Files:**
- Create: `src/lib/webGrowthSession.ts`
- Create: `src/lib/webGrowthSession.test.ts`
- Modify: `src/lib/googleAuth.ts`
- Modify: `src/lib/whatsapp/passwordAuth.ts`
- Modify: `src/lib/scheduler/session.ts`

**Interfaces:**
- Produces: `WEB_GROWTH_SESSION_COOKIE`, `createWebGrowthSessionValue(input)`, `readWebGrowthSession(value)`, `readWebGrowthSessionFromCookieStore(store)`, `mergeWebGrowthSchedulerIdentity(session, scheduler)`.
- Produces: `readSchedulerSessionFromCookieStore(store)` as the canonical scheduler identity reader.

- [ ] **Step 1: Write failing session tests**

Add tests proving Google/password/TikTok identity payloads seal and reopen, expiry fails closed, scheduler identity can be attached without replacing the primary provider, and a canonical session can be resolved as a scheduler session.

```ts
const value = createWebGrowthSessionValue({
  provider: "google",
  userId: "google-1",
  email: "owner@example.com",
  fullName: "Owner",
  schedulerUserId: "11111111-1111-4111-8111-111111111111",
  tiktokOpenId: "owner-open-id",
}, 1_000, 60);
assert.equal(readWebGrowthSession(value, 2_000)?.provider, "google");
assert.equal(readSchedulerSessionFromCookieStore(cookieStore(value))?.openId, "owner-open-id");
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npx tsx --test src/lib/webGrowthSession.test.ts`
Expected: FAIL because the canonical session module/functions do not exist.

- [ ] **Step 3: Implement the minimal canonical session and compatibility readers**

Use `sealCookiePayload`/`openCookiePayload`; normalise email/name; validate provider and scheduler-pair invariants; keep legacy Google/password/scheduler readers as fallback paths.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npx tsx --test src/lib/webGrowthSession.test.ts`
Expected: PASS.

- [ ] **Step 5: Run existing auth-adjacent tests**

Run: `npm run test:scheduler && npm run test:whatsapp`
Expected: PASS.

### Task 2: Make all sign-in paths write the one session

**Files:**
- Modify: `src/app/api/auth/google/callback/route.ts`
- Modify: `src/app/api/auth/google/session/route.ts`
- Modify: `src/app/api/auth/password/session/route.ts`
- Modify: `src/app/api/scheduler/auth/callback/route.ts`
- Modify: `src/app/api/auth/workspace/logout/route.ts`
- Modify: `src/lib/scheduler/store.ts`
- Create: `src/lib/authSessionRoutes.test.ts`

**Interfaces:**
- Produces: `getUserByTikTokOpenId(openId: string)` on scheduler store.
- Consumes: canonical session helpers from Task 1.

- [ ] **Step 1: Write failing source/behavior tests**

Tests assert the Google/password callbacks set `WEB_GROWTH_SESSION_COOKIE`, TikTok callback preserves/augments an existing canonical identity, logout clears canonical plus legacy cookies, and scheduler store can lookup `scheduler_users` by `tiktok_open_id`.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npx tsx --test src/lib/authSessionRoutes.test.ts`
Expected: FAIL until routes use canonical session helpers.

- [ ] **Step 3: Implement owner scheduler resolution and canonical cookie writes**

For configured Google platform-admin identity, iterate `OWNER_TIKTOK_OPEN_IDS`, lookup the existing scheduler user by `tiktok_open_id`, and attach the first valid scheduler identity. Password sessions only receive owner scheduler identity when the signed-in email is the configured platform admin. TikTok callback merges scheduler identity into an existing valid canonical session; otherwise it creates a TikTok-primary canonical session.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npx tsx --test src/lib/authSessionRoutes.test.ts src/lib/webGrowthSession.test.ts`
Expected: PASS.

### Task 3: Move scheduler gates to cookie-store session resolution

**Files:**
- Modify scheduler pages/API routes that directly read `SCHEDULER_SESSION_COOKIE`, including `src/app/scheduler/dashboard/page.tsx`, `src/app/scheduler/new/page.tsx`, `src/app/scheduler/posts/page.tsx`, `src/app/scheduler/settings/page.tsx`, and `src/app/api/scheduler/**` protected routes.
- Modify: `src/lib/scheduler/oauth.ts`
- Add/modify scheduler tests under `src/lib/scheduler/*.test.ts`.

**Interfaces:**
- Consumes: `readSchedulerSessionFromCookieStore(store)`.
- Produces: `normalizeSchedulerReturnPath()` accepting safe `/scheduler/` and `/dashboard/` paths only.

- [ ] **Step 1: Add failing tests for canonical scheduler access and dashboard return paths**

```ts
assert.equal(normalizeSchedulerReturnPath("/dashboard/tiktok/"), "/dashboard/tiktok/");
assert.equal(normalizeSchedulerReturnPath("https://evil.test/"), "/scheduler/dashboard/");
```

- [ ] **Step 2: Run scheduler suite and confirm RED for the new behavior**

Run: `npm run test:scheduler`
Expected: new assertions fail before implementation.

- [ ] **Step 3: Replace direct legacy-cookie reads with cookie-store resolver and expand return-path allowlist**

No publishing/business logic changes are permitted in this task.

- [ ] **Step 4: Run scheduler suite and confirm GREEN**

Run: `npm run test:scheduler`
Expected: PASS.

### Task 4: Unify Content Automation and WhatsApp authorization on canonical identity

**Files:**
- Modify: `src/app/admin/content-automation/auth.ts`
- Modify: `src/app/admin/whatsapp/auth.ts`
- Modify/add tests near those modules.

**Interfaces:**
- Consumes: canonical session identity and legacy fallbacks.
- Preserves: existing role/workspace resolution and platform-admin checks.

- [ ] **Step 1: Write failing access tests**

Prove configured Google admin canonical session can enter Content Automation and WhatsApp; a non-admin workspace password identity cannot enter Content Automation; WhatsApp member role resolution still applies; TikTok-only scheduler identity does not acquire Content Automation privilege.

- [ ] **Step 2: Run focused tests and confirm RED**

Run the new auth tests with `npx tsx --test ...`.
Expected: canonical-only fixtures fail before implementation.

- [ ] **Step 3: Implement canonical-first identity resolution**

Keep legacy fallbacks for migration and do not broaden module permissions.

- [ ] **Step 4: Run focused and WhatsApp/social suites**

Run: `npm run test:whatsapp && npm run test:social`
Expected: PASS.

### Task 5: Shared Automation Dashboard shell and routes

**Files:**
- Create: `src/components/automation-dashboard/nav.ts`
- Create: `src/components/automation-dashboard/nav.test.ts`
- Create: `src/components/automation-dashboard/AutomationShell.tsx`
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/content/page.tsx`
- Create: `src/app/dashboard/tiktok/page.tsx`
- Create: `src/app/dashboard/whatsapp/page.tsx`
- Create: `src/app/dashboard/media/page.tsx`
- Create: `src/app/dashboard/connections/page.tsx`
- Create: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Produces: top-level nav model and active-state helper.
- Module routes link/redirect into existing mature route implementations rather than copying engines.

- [ ] **Step 1: Write failing navigation tests**

Test top-level labels/routes, active-state matching, and no broken hrefs.

- [ ] **Step 2: Run nav tests and confirm RED**

Run: `npx tsx --test src/components/automation-dashboard/nav.test.ts`
Expected: FAIL before nav implementation.

- [ ] **Step 3: Build semantic responsive shell and authenticated dashboard routes**

Use CSS/Tailwind only for lightweight interactions. All `/dashboard/**` pages are noindex. Unauthenticated users are sent to the unified sign-in experience.

- [ ] **Step 4: Implement real Overview/Media/Connections/Settings data models using existing stores**

Provider/store reads are isolated with per-module error boundaries/status cards. Do not fabricate provider health.

- [ ] **Step 5: Run nav tests and type/lint checks for new routes**

Run: `npx tsx --test src/components/automation-dashboard/nav.test.ts`
Expected: PASS.

### Task 6: Shared sign-in and module product switching

**Files:**
- Create: `src/app/sign-in/page.tsx`
- Modify: `src/components/auth/GoogleAdminPrompt.tsx` or add a product-neutral auth wrapper without changing provider controls.
- Modify: `src/app/admin/content-automation/page.tsx`
- Modify: `src/app/scheduler/layout.tsx`
- Modify: `src/app/scheduler/sign-in/page.tsx`
- Modify: `src/components/whatsapp/WhatsAppShell.tsx` and/or its nav model for a cross-product entry point.

**Interfaces:**
- Produces: one visible Web Growth sign-in surface.
- Preserves: Google/password sign-in and TikTok OAuth as a publishing connection.

- [ ] **Step 1: Add failing source regression tests for shared product navigation/sign-in copy**

Assert the scheduler no longer claims TikTok is the only Web Growth account login, and each mature module exposes a route back to `/dashboard/`.

- [ ] **Step 2: Run tests and confirm RED**

Expected: current standalone scheduler/content/WhatsApp surfaces fail the new assertions.

- [ ] **Step 3: Implement shared sign-in copy and product switch links**

Do not redesign the WhatsApp workspace; add only the cross-product affordance needed for unified navigation.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Expected: all new navigation/sign-in regressions pass.

### Task 7: Full regression, build, and progress documentation

**Files:**
- Modify: `docs/whatsapp-platform-progress.md`
- Modify: `docs/blog-social-automation.md`
- Create: `docs/unified-automation-dashboard-progress.md`
- Modify route governance if new private routes are not already covered.

**Interfaces:**
- Documents: architecture, changed routes, auth migration, verification commands/results, known rollout notes, and explicit no-deployment state.

- [ ] **Step 1: Run all relevant test suites**

Run:
```bash
npm run test:scheduler
npm run test:social
npm run test:whatsapp
npx tsx --test src/lib/webGrowthSession.test.ts src/lib/authSessionRoutes.test.ts src/components/automation-dashboard/nav.test.ts
```
Expected: PASS.

- [ ] **Step 2: Run lint and production build**

Run:
```bash
npm run lint
npm run build
```
Expected: PASS with no new errors.

- [ ] **Step 3: Review changed routes and authorization boundaries**

Confirm no public route accidentally gained private data, no provider secret reaches the client, no Content Automation privilege is granted to TikTok-only or ordinary workspace identities, and all module links resolve.

- [ ] **Step 4: Update documentation with exact verification evidence**

Record commands and results; state that Vercel deployment is still disabled for the feature branch.

- [ ] **Step 5: Stop before merge/deployment**

Present the completed branch and verification evidence to the user. Do not merge to `main` and do not deploy until explicit approval. After approved merge, delete `feature/unified-automation-dashboard` and preserve `main`.
