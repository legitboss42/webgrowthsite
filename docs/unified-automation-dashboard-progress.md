# Unified Automation Dashboard Progress

Last updated: 2026-09-08

## Status

**Tasks 1–7 implemented on `feature/unified-automation-dashboard`.** The branch is intentionally not merged or deployed. `main` remains the release boundary and must not be changed until the user gives explicit approval.

The three product engines remain separate:

- Content Automation keeps its existing social automation engine and admin-only authorization.
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

Authentication was unified; authorization was not flattened.

- Content Automation still requires an email in the configured Google admin allowlist.
- Ordinary WhatsApp workspace members do not gain Content Automation access.
- WhatsApp access still resolves an active workspace, membership, and role.
- TikTok-only identity does not gain Content Automation privilege.
- TikTok-only identity can resolve the WhatsApp platform owner only when its open ID is one of the explicitly configured owner IDs.
- Provider tokens and encrypted credentials remain server-side. The unified connections/media pages select only safe status/metadata fields.
- Password sign-in accepts only `/dashboard/**` and `/admin/whatsapp/**` return targets, not arbitrary internal/external destinations.

## Unified routes

Private/noindex routes added:

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

The existing sitemap validator's private-app allowlist was extended for these routes. Validation remains strict for public pages; it was not disabled or weakened.

## Data architecture

No Supabase DDL migration was required for this integration. Existing production tables already cover the needed data:

- Scheduler: `scheduler_users`, `tiktok_connections`, `media_assets`, `scheduled_posts`, `post_media`, `post_approvals`, `publish_attempts`, worker/retention tables.
- Content/social: `social_automation_jobs`, `social_media_assets`, `social_publications`, `social_connections`, `social_automation_settings`, audit log.
- WhatsApp: workspaces, platform users/team members, workspace connections, conversations/messages/contacts/campaigns/automations/AI tables.

Shared Media Library combines safe metadata from scheduler media and Content Automation-generated media; it does not merge the storage engines.

## Verification evidence

GitHub Actions workflow: `.github/workflows/unified-automation-validation.yml`.

Fresh full code validation on commit `ea33eeac46ce09841b9da8b3a9d31d5212b60ae5`, run `34224781316`:

- Unified session/auth/authorization/routes/sign-in tests: **19 passed, 0 failed**.
- TikTok scheduler suite: **282 passed, 0 failed**.
- Content Automation/social suite: **109 passed, 0 failed**.
- WhatsApp Business suite: **217 passed, 0 failed**.
- ESLint: **0 errors, 5 warnings**. The warnings are pre-existing/non-blocking (`no-img-element` and hook-dependency warnings in existing WhatsApp/scheduler components); no new lint error remains.
- Sitemap validation: **passed** (`217` governed routes, `45` indexed pages, `35` indexed articles).
- Next.js `15.5.14` optimized production build: **compiled successfully**, type validation passed, **224/224 static pages generated**.

TDD/debugging checkpoints during Task 7 caught and fixed three real integration defects before completion:

1. Legacy scheduler sign-in regression assertions were updated to the approved unified-account flow while preserving public-enrollment gating.
2. New private dashboard routes were added to the existing private route-governance mechanism after sitemap validation correctly rejected them as ungoverned.
3. `/api/auth/password/session/` originally rejected `/dashboard/`; a RED regression test was added first, then the allowlist was corrected while preserving workspace membership/role checks.
4. The connections dashboard had a TypeScript nullable workspace correlation error; it was corrected without changing connection behavior.

## Supabase audit

Project: `Web Growth` (`ockqdqlmzilrnilclwwa`, `eu-west-1`). The project was healthy during verification. No migration was applied for this feature.

Advisors reported existing platform hardening/performance debt, not a new dashboard regression:

- Security warning: Supabase Auth leaked-password protection is disabled. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Security informational notices: many service-role-only tables have RLS enabled with no browser policies. This is expected for several existing scheduler/social/WhatsApp service-role paths but remains something to review deliberately rather than altering during this feature.
- Performance informational notices: unindexed foreign keys and unused indexes exist across the wider project.

No production RLS/index/auth setting was changed as part of the unified-dashboard work.

## Vercel / deployment boundary

`vercel.json` explicitly sets Git deployment disabled for `feature/unified-automation-dashboard`.

Vercel project: `webgrowthsite` (`prj_PyxH4g2ZdRjPZWVw9NI47UDn8vh2`), team `team_g8oZD9ZdfDQBw6MkheX0z2h4`.

During Task 7, Vercel deployment history returned **zero deployments created during this feature-work window**. No `deploy_to_vercel` action was called.

## Release state

- `main` has not been merged into, rewritten, or deleted.
- Feature branch is ahead of `main` and not behind it.
- No Vercel preview or production deployment has been triggered for this branch.
- The feature branch must remain in place until explicit merge/deployment approval.
- After an approved merge to `main`, delete `feature/unified-automation-dashboard`; never delete `main`.
