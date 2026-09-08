# Unified Web Growth Automation Dashboard Design

**Date:** 2026-09-08

## Goal

Present Content Automation, TikTok Publishing, and the WhatsApp Business Platform as one Web Growth Automation product with one account/session and a shared navigation layer, while preserving the three existing engines and their provider-specific responsibilities.

## Approved product model

The unified product has these top-level areas:

- Overview
- Content Automation
- TikTok Publishing
- WhatsApp Business
- Shared Media Library
- Connections
- Settings

The existing blog-to-social workflow remains unchanged at the engine boundary: a newly published article creates generated social assets, Meta publications proceed automatically when permitted, and TikTok work enters the existing scheduler queue for creator review/approval. Manual TikTok posts use that same scheduler queue.

## Architecture

### 1. Canonical Web Growth session

Introduce `src/lib/webGrowthSession.ts` with one signed, HttpOnly `wg_webgrowth_session` cookie. The payload records the primary identity provider (`google`, `password`, or legacy/public `tiktok`), identity details, optional WhatsApp workspace context, and optional scheduler identity (`schedulerUserId`, `tiktokOpenId`).

The session uses existing configured secrets in this order: `WEB_GROWTH_SESSION_SECRET`, `GOOGLE_AUTH_SESSION_SECRET`, `INTERNAL_TOOL_SESSION_SECRET`, then `SCHEDULER_SESSION_SECRET`. No new production secret is required for rollout, although `WEB_GROWTH_SESSION_SECRET` is the preferred future explicit setting.

Google and workspace-password sign-in create the canonical session. TikTok OAuth becomes a connection/linking action when a Web Growth session already exists; it augments the same session with scheduler identity instead of replacing the account identity. The legacy public TikTok enrollment path remains compatible and may create a TikTok-primary session when there is no Web Growth identity yet.

Legacy `wg_google_auth`, `wg_workspace_auth`, and `wg_scheduler_session` cookies remain readable during the migration window. New sign-ins write only the canonical cookie and clear their superseded legacy cookie. Workspace logout clears canonical and legacy auth cookies.

### 2. Scheduler compatibility

Do not rewrite the scheduler engine. Add cookie-store-aware scheduler session resolution so existing scheduler pages and API routes can resolve scheduler identity from either the canonical session or the legacy scheduler cookie.

For the Web Growth owner Google identity, resolve the existing scheduler user through `OWNER_TIKTOK_OPEN_IDS` and `scheduler_users.tiktok_open_id`. This links the already-working owner scheduler account without a database migration. Non-owner workspace identities do not receive scheduler privileges merely because they can access a WhatsApp workspace.

TikTok OAuth return-path sanitisation is expanded to allow the canonical `/dashboard/` routes as well as existing `/scheduler/` routes.

### 3. Shared application shell

Create a lightweight reusable Automation Dashboard shell and top-level navigation. It owns product navigation, responsive mobile navigation, account identity presentation, and consistent dark Web Growth application styling. It does not absorb module-specific UI logic.

The canonical `/dashboard/` route supplies the Overview and the new cross-module areas. Existing mature modules remain at their current internal routes to minimise regression risk:

- Content Automation: `/admin/content-automation/`
- TikTok Publishing: `/scheduler/dashboard/` plus existing scheduler subroutes
- WhatsApp Business: `/admin/whatsapp/`

Canonical dashboard module routes may redirect into those implementations. Each mature module receives the shared product switcher/navigation so the user experiences one product even while route ownership stays isolated.

### 4. Unified Overview

The Overview is server-rendered and noindexed. It displays only data that can be verified from existing stores:

- recent content-automation jobs and platform outcomes,
- TikTok scheduler connection/post status when a scheduler identity is available,
- WhatsApp workspace/sender availability when the account has access,
- connection health and attention-required states,
- shortcuts into each module.

Failures in one module must not blank the entire overview. Each module summary is loaded independently and renders an unavailable/attention state when its provider or storage is unreachable.

### 5. Shared Media Library

The Media Library is an aggregated, read-oriented view over media already owned by the existing engines. It does not move files into a new storage system. The first release surfaces generated social-automation assets and scheduler media/post references that existing storage APIs can safely expose. Actions that mutate media continue to live in the owning module.

### 6. Connections

Connections shows the real provider state for:

- TikTok scheduler connection,
- Meta connection used for Facebook and Instagram,
- WhatsApp sender/workspace configuration.

Connection/reconnection actions continue to call the existing provider-specific routes. The page is a control surface, not a new OAuth engine.

### 7. Settings

The unified Settings page provides account/session information, logout, and links to module-specific settings. Existing TikTok legal/account controls and WhatsApp workspace settings remain authoritative.

## Access model

- Google admin/owner: unified dashboard, Content Automation, owner TikTok publishing when linked/resolvable, and platform-owned WhatsApp workspaces.
- Workspace password member: unified dashboard with role-appropriate WhatsApp access; no automatic Content Automation or owner TikTok privilege unless the identity is explicitly the configured platform admin.
- TikTok-primary legacy/public user: scheduler/TikTok publishing access only; no WhatsApp or Content Automation privilege is inferred.

A unified session is not a unified permission bypass. Every module retains its authorization rules.

## UX and accessibility

- Semantic navigation and headings.
- Keyboard-visible focus states.
- Mobile-first responsive layout.
- No heavy animation requirement; CSS transitions only where useful.
- Internal application routes remain `noindex, nofollow` where appropriate.
- Existing WhatsApp Stage 12 UI is not redesigned or functionally rewritten in this integration.

## Error handling

- Invalid/expired canonical session fails closed.
- Legacy-cookie parsing failures are isolated and fail closed.
- Provider/store failures produce module-level unavailable states rather than leaking secrets or raw provider errors.
- TikTok linking preserves the pre-existing Web Growth identity only when the OAuth state and callback validate successfully.
- Same-origin protections on existing mutation routes remain unchanged.

## Testing

Add focused Node/tsx tests for:

1. canonical session sealing, expiry, provider identity, and scheduler augmentation;
2. legacy and canonical scheduler session resolution;
3. Content Automation accepting only authorized unified identities;
4. TikTok return-path normalisation for `/dashboard/` and `/scheduler/`;
5. dashboard navigation route/active-state helpers;
6. source-level regression checks that Google/password/TikTok callbacks write the canonical cookie and logout clears it;
7. existing scheduler, social automation, and WhatsApp suites;
8. lint/build after feature tests pass.

## Deployment constraint

The entire feature is built and verified on `feature/unified-automation-dashboard`, which is explicitly disabled in `vercel.json` under `git.deploymentEnabled`. No Vercel preview or production deployment is part of implementation. After all work is complete, deployment/merge requires explicit user approval. After the work is merged to `main`, the feature branch must be deleted. `main` must never be deleted.
