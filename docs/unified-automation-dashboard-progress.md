# Unified Automation Dashboard Progress

Last updated: 2026-09-08

## Status

Tasks 1–7 of the unified Web Growth Automation Dashboard are implemented and released. The original production dashboard rendering issue was corrected, merged, deployed, and smoke-tested successfully. Production `main` is currently `704d6469faefcc85bb6d43af980ca4dd0fed4830`.

A follow-up UI/auth improvement requested on 2026-09-08 is now implemented on the retained `feature/unified-automation-dashboard` branch and is **not yet merged or deployed**:

- Content Automation now receives the shared Web Growth site header.
- Signed-out visitors see a `Dashboard` action that routes to `/dashboard/`.
- A valid canonical Web Growth session replaces that button with an account icon linking to `/dashboard/`.
- Other `/admin/*` consoles keep their existing isolated chrome behavior.
- The Content Automation admin footer remains hidden.

The three product engines remain separate:

- Content Automation keeps its social automation engine and admin-only authorization.
- TikTok Publishing keeps the scheduler, approval, provider, media, retention, and worker engine.
- WhatsApp Business keeps workspace membership, roles, credentials, conversations, campaigns, automations, and messaging internals.

The shared layer is identity/session + product navigation + dashboard/control-plane views.

## Task checklist

- [x] Task 1 — Canonical Web Growth session
- [x] Task 2 — Google, password, and TikTok sign-in paths write/augment the canonical session
- [x] Task 3 — Scheduler protected routes use canonical cookie-store identity resolution with legacy fallback
- [x] Task 4 — Content Automation and WhatsApp use canonical-first identity without widening permissions
- [x] Task 5 — Unified Automation Dashboard shell and real module routes
- [x] Task 6 — Unified sign-in and cross-product navigation
- [x] Task 7 — Full regression, security review, Supabase/Vercel audit, production build, and documentation
- [x] Release smoke correction — Page-level dashboard auth guards + Content Automation subroute authorization
- [x] Follow-up — Content Automation shared header + signed-out Dashboard CTA / signed-in account icon

## Canonical account/session

Canonical cookie: `wg_webgrowth_session` (`WEB_GROWTH_SESSION_COOKIE`).

The signed session stores the primary provider (`google`, `password`, or `tiktok`), normalized account identity, optional WhatsApp workspace identity/role, and optional scheduler user/TikTok open-id pair. Scheduler identity augments the same account instead of replacing the primary provider.

Session-secret fallback order:

1. `WEB_GROWTH_SESSION_SECRET`
2. `GOOGLE_AUTH_SESSION_SECRET`
3. `INTERNAL_TOOL_SESSION_SECRET`
4. `SCHEDULER_SESSION_SECRET`

Legacy Google/password/scheduler readers remain only as migration compatibility paths. Logout clears canonical and legacy auth cookies.

## Authorization boundaries

Authentication is unified; authorization is not flattened.

- Content Automation requires an email in the configured Google admin allowlist.
- Ordinary WhatsApp workspace members do not gain Content Automation access.
- `/dashboard/content/articles/` and `/dashboard/content/history/` explicitly enforce the Content Automation admin boundary before reading module data.
- WhatsApp access resolves an active workspace, membership, and role.
- TikTok-only identity does not gain Content Automation privilege.
- TikTok-only identity can resolve the WhatsApp platform owner only when its open ID is one of the explicitly configured owner IDs.
- Provider tokens and encrypted credentials remain server-side. Unified Connections/Media pages select safe status/metadata fields only.
- Password sign-in accepts only `/dashboard/**` and `/admin/whatsapp/**` return targets, not arbitrary internal/external destinations.

## Unified routes

Private/noindex routes:

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
- `/sign-in/`

The sitemap validator's private-app allowlist includes these routes. Public sitemap validation remains strict.

## Data architecture

No Supabase DDL migration was required for this integration or the header follow-up. Existing production tables already cover the needed data:

- Scheduler: `scheduler_users`, `tiktok_connections`, `media_assets`, `scheduled_posts`, `post_media`, `post_approvals`, `publish_attempts`, worker/retention tables.
- Content/social: `social_automation_jobs`, `social_media_assets`, `social_publications`, `social_connections`, `social_automation_settings`, audit log.
- WhatsApp: workspaces, platform users/team members, workspace connections, conversations/messages/contacts/campaigns/automations/AI tables.

Shared Media Library combines safe metadata from scheduler media and Content Automation-generated media; it does not merge storage engines.

## Initial release verification

Final pre-release feature head `b7167c979e3ffd6509ab704a1f94a4342b3421fc` passed both the unified workflow and PR build.

Verification included:

- Unified session/auth/authorization/routes/sign-in tests: passed.
- TikTok scheduler suite: 282/282 passed.
- Content Automation/social suite: 109/109 passed.
- WhatsApp Business suite: 217/217 passed.
- ESLint: 0 errors; 5 existing/non-blocking warnings.
- Sitemap validation: passed.
- Next.js optimized production build and type validation: passed; 224/224 static pages generated.

PR #26 was squash-merged into `main` as `612e14bb9ce4ae50b18798205932143da0d16ea6` after explicit user approval.

Exactly one Git-triggered Vercel production deployment was allowed for that merge:

- Deployment: `dpl_14VUWf3AGTFFSycza8SxKiWEJ4pn`
- Source: `main` commit `612e14bb9ce4ae50b18798205932143da0d16ea6`
- Build state: `READY`
- Production aliases included `webgrowth.info` and `www.webgrowth.info`.
- No manual `deploy_to_vercel` action was used.

## Production smoke-test incident and correction

After the first production deployment became `READY`, `/sign-in/` returned normally. An unauthenticated request to `/dashboard/` produced the intended sign-in redirect but Vercel runtime logs also recorded:

`TypeError: Cannot read properties of null (reading 'schedulerUserId')`

### Root cause

The dashboard layout checked the canonical session and redirected unauthenticated users, but several child Server Components used a non-null assertion on their own session read. App Router segment rendering can evaluate child server segments while a parent redirect is being resolved, so the child assumption was unsafe.

### Corrective TDD and release

RED regression commit:

- `2998460f1cd9b3f3b6d58a8a37a7c221f5740f0b` — `test: require page-level dashboard auth boundaries`
- Unified validation run `34227152645` failed as expected because the page-level guards did not yet exist.

The audit also found that `/dashboard/content/history/` relied only on the shared dashboard login and did not independently enforce the Content Automation admin boundary.

Corrective implementation:

- `src/lib/dashboardSession.ts` owns `requireWebGrowthDashboardSession()` and `requireContentAutomationDashboardAdmin()`.
- Every directly rendered private dashboard surface enforces its own canonical session before reading child data.
- Parent layout uses the same guard for consistency.
- Content Automation Articles and History explicitly enforce the existing admin-only authorization before reading module data.
- TikTok queue views, Overview, Media, Connections, Settings, TikTok Create, and WhatsApp dashboard surfaces no longer rely on a parent-layout non-null session assumption.

Implementation commit:

- `5a804b1343506b98930dd1761d08c552b8150b8b` — `fix: enforce dashboard auth inside server page boundaries`

Corrective validation run `34227793185` passed the unified, scheduler, Content Automation, WhatsApp, lint, and production-build checks.

PR #27 was merged into `main` as:

- `704d6469faefcc85bb6d43af980ca4dd0fed4830`

The single Git-triggered corrective production deployment was:

- Deployment: `dpl_BGzYGG3qVR8caByYqfPZbQuv9wBj`
- Source: `main` commit `704d6469faefcc85bb6d43af980ca4dd0fed4830`
- State: `READY`
- `/sign-in/`, `/dashboard/`, `/dashboard/content/articles/`, and `/dashboard/content/history/` were smoke-tested.
- Unauthenticated private routes redirected cleanly to sign-in without the previous null-session runtime failure.
- Post-smoke Vercel runtime checks showed no error/fatal events.
- No manual deployment action was used.

## Content Automation header follow-up

### User-visible behavior

The existing root `Header` is now shown on `/admin/content-automation/` while the internal admin footer remains hidden. Other admin consoles retain their existing isolated shell behavior.

Header account behavior:

- No valid canonical session: show `Dashboard`, linking to `/dashboard/`.
- Valid canonical session: replace the Dashboard text button with an account/person icon linking to `/dashboard/`.
- The icon has an accessible account label derived from safe display identity when available.

### Root cause

`src/components/SiteChrome.tsx` intentionally treated every `/admin/*` route as an internal console and `PublicChromeOnly` therefore suppressed the root Header and Footer. Content Automation did not provide a replacement header. Separately, `src/components/Header.tsx` had no canonical-session awareness.

### TDD evidence

RED:

- Commit: `476dbf3b27d379e7a5251b551b919c8194730235` — `test: require content automation header account state`
- Run: `34230109300`
- Result: unified routing/sign-in test step failed as expected before the header/session implementation existed.

Implementation:

- `611b23c4b18036d0633a723be062f711e1a37e2d` — Content Automation-specific site-header route policy.
- `8daf8361b60665842428307364b894cd3f3d7c19` — root layout uses `SiteHeaderOnly` while retaining `PublicChromeOnly` for the footer.
- `fd9d821baebe7df84187ab47cab34492156d2043` — safe same-origin `/api/auth/session/` status endpoint.
- `353a5c8e84b5a6b1e938a651691a712b07daf7a3` — Dashboard/account action in the shared site header.

GREEN implementation validation:

- Run: `34230592216`
- Unified session/auth/routing/sign-in tests: passed.
- TikTok scheduler regression suite: passed.
- Content Automation regression suite: passed.
- WhatsApp Business regression suite: passed.
- ESLint: passed.
- Production build: passed.

### Header-session security

The browser-facing session endpoint reads only the signed canonical Web Growth cookie and returns:

```json
{
  "authenticated": true,
  "displayName": "..."
}
```

It does not expose scheduler IDs, TikTok open IDs, workspace IDs/roles, provider access tokens, encrypted credentials, or session-cookie contents. The response is `private, no-store, max-age=0`.

## Supabase audit

Project: `Web Growth` (`ockqdqlmzilrnilclwwa`, `eu-west-1`). Project health was `ACTIVE_HEALTHY` during unified-dashboard verification. No migration was applied for the unified dashboard or header follow-up.

Existing platform hardening/performance debt remains separately documented:

- Supabase Auth leaked-password protection is disabled.
- Several service-role-oriented tables have RLS enabled without browser policies.
- Existing unindexed foreign keys/unused indexes were reported by performance advisors.

No production RLS/index/auth setting was changed as part of these changes.

## Release boundary

- Production `main` remains `704d6469faefcc85bb6d43af980ca4dd0fed4830` at the start of this follow-up.
- The retained `feature/unified-automation-dashboard` branch was reset to that production commit before the follow-up, avoiding an additional branch.
- The feature branch remains blocked from Vercel Git deployment via `vercel.json`.
- The Content Automation header/account follow-up is implemented and verified on the feature branch only.
- **Do not merge this follow-up to `main` and do not deploy it until explicit user approval is received.**
- After an approved merge and a clean single production deployment, delete `feature/unified-automation-dashboard` if branch deletion is available.
- Never delete `main`.
