# Unified Web Growth Automation Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for completed tracking.

**Goal:** Unify Content Automation, TikTok Publishing, and WhatsApp Business behind one Web Growth account/session and one cross-product dashboard without merging their underlying engines.

**Architecture:** Introduce one canonical signed Web Growth session with legacy-cookie fallbacks, preserve provider engines and current routes, and add a shared application shell plus cross-module Overview, Media, Connections, and Settings pages. Existing authorization remains module-specific.

**Tech Stack:** Next.js App Router, React 18, Tailwind CSS 4, TypeScript, Supabase, existing secure-cookie helpers, Node `tsx --test` suites.

**Spec:** `docs/superpowers/specs/2026-09-08-unified-automation-dashboard-design.md`

**Completion evidence:** `docs/unified-automation-dashboard-progress.md`

## Global Constraints

- No Vercel preview or production deployment during implementation.
- Feature branch: `feature/unified-automation-dashboard`; its deployment is disabled in `vercel.json`.
- Do not merge the TikTok, Content Automation, or WhatsApp engines.
- Preserve current provider-specific OAuth, publishing, storage, and authorization boundaries.
- Do not add a database migration for the initial owner-account integration.
- Existing WhatsApp Stage 12 functionality and route behavior must remain intact.
- After an approved merge to `main`, delete the feature branch; never delete `main`.

---

### Task 1: Canonical Web Growth session

**Files:**
- Create: `src/lib/webGrowthSession.ts`
- Create: `src/lib/webGrowthSession.test.ts`
- Modify compatibility readers in existing Google/password/scheduler auth modules as required.

**Interfaces:**
- Produces: `WEB_GROWTH_SESSION_COOKIE`, `createWebGrowthSessionValue(input)`, `readWebGrowthSession(value)`, `readWebGrowthSessionFromCookieStore(store)`, `mergeWebGrowthSchedulerIdentity(session, scheduler)`.
- Produces: `readSchedulerSessionFromCookieStore(store)` as the canonical scheduler identity reader.

- [x] **Step 1: Write failing session tests**
- [x] **Step 2: Run the focused tests and confirm RED**
- [x] **Step 3: Implement the minimal canonical session and compatibility readers**
- [x] **Step 4: Run focused tests and confirm GREEN**
- [x] **Step 5: Run existing auth-adjacent tests**

### Task 2: Make all sign-in paths write the one session

**Files:**
- Modify: `src/app/api/auth/google/callback/route.ts`
- Modify: `src/app/api/auth/google/session/route.ts`
- Modify: `src/app/api/auth/password/session/route.ts`
- Modify: `src/app/api/scheduler/auth/callback/route.ts`
- Modify: `src/app/api/auth/workspace/logout/route.ts`
- Modify: `src/lib/scheduler/store.ts`
- Create: `src/lib/authSessionRoutes.test.ts`

- [x] **Step 1: Write failing source/behavior tests**
- [x] **Step 2: Run tests and confirm RED**
- [x] **Step 3: Implement owner scheduler resolution and canonical cookie writes**
- [x] **Step 4: Run focused tests and confirm GREEN**

### Task 3: Move scheduler gates to cookie-store session resolution

**Scope:** Scheduler pages/API routes that directly read the legacy scheduler cookie, plus safe OAuth return-path handling.

- [x] **Step 1: Add failing tests for canonical scheduler access and dashboard return paths**
- [x] **Step 2: Run scheduler suite and confirm RED for the new behavior**
- [x] **Step 3: Replace direct legacy-cookie reads with cookie-store resolver and expand safe return-path allowlist**
- [x] **Step 4: Run scheduler suite and confirm GREEN**

### Task 4: Unify Content Automation and WhatsApp authorization on canonical identity

**Files:**
- Modify: `src/app/admin/content-automation/auth.ts`
- Modify: `src/app/admin/whatsapp/auth.ts`
- Create: `src/lib/unifiedAuthorization.ts`
- Create: `src/lib/unifiedAuthorization.test.ts`

**Invariant:** One login does not imply one permission level. Existing module authorization remains authoritative.

- [x] **Step 1: Write failing access tests**
- [x] **Step 2: Run focused tests and confirm RED**
- [x] **Step 3: Implement canonical-first identity resolution with legacy migration fallbacks**
- [x] **Step 4: Run focused and WhatsApp/social suites**

### Task 5: Shared Automation Dashboard shell and routes

**Implemented routes:**
- `/dashboard/`
- `/dashboard/content/`
- `/dashboard/content/articles/`
- `/dashboard/content/history/`
- `/dashboard/tiktok/`
- `/dashboard/tiktok/new/`
- `/dashboard/tiktok/drafts/`
- `/dashboard/tiktok/scheduled/`
- `/dashboard/tiktok/published/`
- `/dashboard/tiktok/attention/`
- `/dashboard/whatsapp/`
- `/dashboard/media/`
- `/dashboard/connections/`
- `/dashboard/settings/`

**Implementation files include:**
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/dashboard/TikTokQueue.tsx`
- `src/components/dashboard/TikTokQueueView.tsx`
- `src/app/dashboard/**`
- `src/lib/dashboardRoutes.test.ts`

- [x] **Step 1: Write failing dashboard navigation/route contract tests**
- [x] **Step 2: Run route contract tests and confirm RED**
- [x] **Step 3: Build semantic responsive shell and authenticated dashboard routes**
- [x] **Step 4: Implement real Overview/Media/Connections/Settings data using existing stores**
- [x] **Step 5: Run route tests and type/lint checks**

### Task 6: Shared sign-in and module product switching

**Files:**
- Create: `src/app/sign-in/page.tsx`
- Modify legacy Content Automation, scheduler, and WhatsApp entry/navigation surfaces.
- Create: `src/lib/unifiedSignIn.test.ts`

- [x] **Step 1: Add failing source regression tests for shared product navigation/sign-in copy**
- [x] **Step 2: Run tests and confirm RED**
- [x] **Step 3: Implement shared sign-in copy and product switch links**
- [x] **Step 4: Run focused tests and confirm GREEN**
- [x] **Step 5: Add RED regression proving workspace password sign-in can return to `/dashboard/`**
- [x] **Step 6: Allow only `/dashboard/**` and existing WhatsApp return paths while preserving workspace membership/role checks**

### Task 7: Full regression, build, security review, and progress documentation

**Files:**
- Modify: `.github/workflows/unified-automation-validation.yml`
- Modify: `scripts/validate-sitemap.mjs` for private dashboard route registration
- Update: `docs/unified-automation-dashboard-progress.md`
- Update this plan's completion tracking.

- [x] **Step 1: Run all relevant test suites**

Final full code validation on `ea33eeac46ce09841b9da8b3a9d31d5212b60ae5` / run `34224781316`:
- Unified session/auth/authorization/routes/sign-in: 19/19 pass.
- Scheduler: 282/282 pass.
- Social automation: 109/109 pass.
- WhatsApp: 217/217 pass.

- [x] **Step 2: Run lint and production build**

- ESLint: 0 errors, 5 existing/non-blocking warnings.
- Sitemap validation: passed, 217 governed routes / 45 indexed pages / 35 indexed articles.
- Next.js 15.5.14 optimized build compiled and type-checked successfully.
- Static generation: 224/224 pages.

- [x] **Step 3: Review changed routes and authorization boundaries**

Confirmed:
- Private dashboard routes are noindex and require the canonical session.
- Provider credentials/tokens are not selected into dashboard client data.
- Content Automation privilege remains admin-email restricted.
- Ordinary workspace/password and TikTok-only identities do not acquire Content Automation privilege.
- WhatsApp still resolves active workspace membership and role.
- Password return paths are restricted to approved dashboard/WhatsApp namespaces.

- [x] **Step 4: Run Supabase and Vercel release-boundary checks**

- No database migration required or applied.
- Supabase advisor findings recorded as existing hardening/performance debt in the progress document.
- Vercel Git deployment remains explicitly disabled for `feature/unified-automation-dashboard`.
- No Vercel deployment was triggered during implementation.

- [x] **Step 5: Update documentation with exact verification evidence**

See `docs/unified-automation-dashboard-progress.md`.

- [x] **Step 6: Stop before merge/deployment**

Do not merge to `main` and do not deploy until explicit user approval. After an approved merge, delete `feature/unified-automation-dashboard` and preserve `main`.
