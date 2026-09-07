# In-Dashboard Meta Business Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brittle full-page Meta OAuth connection path with an in-dashboard Facebook Login for Business flow that works on mobile and desktop, explicitly handles multiple eligible Facebook Pages, and stores tokens only on the server.

**Architecture:** The Content Automation dashboard loads Meta's JavaScript SDK and launches `FB.login` synchronously from the Connect button using the configured Facebook Login for Business `config_id`, `auth_type: "rerequest"`, `response_type: "code"`, and `override_default_response_type: true`. The browser sends only the returned authorization code to a protected same-origin server endpoint. The server exchanges and upgrades the user token, discovers eligible Facebook Page/Instagram pairs, auto-connects a single candidate or returns safe metadata for a selector while sealing the pending user token in a short-lived encrypted HttpOnly cookie. A second protected endpoint revalidates and completes an explicit Page selection. The existing callback route remains as a fallback.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Meta Facebook JavaScript SDK, Meta Graph API, encrypted AES-GCM cookies, Supabase-backed social automation store, Node test runner through `tsx --test`.

**Spec:** `docs/blog-social-automation.md`

## Global Constraints

- Do not change TikTok, WhatsApp, blog rendering, social publication, or scheduler behavior.
- Do not add a Supabase migration.
- Never expose Meta app secrets, user tokens, Page tokens, or encrypted token payloads to browser JavaScript.
- Keep the existing callback route as a fallback.
- Use the existing `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION`, `META_LOGIN_CONFIG_ID`, `META_TOKEN_ENCRYPTION_KEY`, and existing social connection storage.
- Do not deploy or merge to production until all work, tests, build/release validation, and documentation are complete and the user explicitly approves the single deployment.
- Document progress after implementation changes.

---

### Task 1: Make managed Page discovery selectable

**Files:**
- `src/lib/socialAutomation/metaClient.test.ts`
- `src/lib/socialAutomation/metaClient.ts`

**Interfaces:**
- `client.listManagedPages({ userAccessToken }): Promise<MetaManagedPage[]>`
- Preserved: `client.resolveManagedPage({ userAccessToken, preferredPageId? })`

- [x] Write a failing test requiring all eligible Page/Instagram pairs.
- [x] Verify RED: commit `2ed701b0b28fc857127ca528e6396297c8032286`, run `34103978127`.
- [x] Extract Page discovery into `listManagedPages` and preserve fallback resolver behavior.
- [x] Verify GREEN.

### Task 2: Add encrypted pending-selection state and popup option helpers

**Files:**
- `src/lib/socialAutomation/metaOAuth.test.ts`
- `src/lib/socialAutomation/metaOAuth.ts`

**Interfaces:**
- `META_PENDING_CONNECTION_COOKIE`
- `META_PENDING_CONNECTION_MAX_AGE_SECONDS`
- `createMetaPendingConnection(secret, input, nowMs?)`
- `readMetaPendingConnection(cookieValue, secret, nowMs?)`
- `buildMetaSdkLoginOptions(configId)`

- [x] Write failing tests for encrypted pending state, expiry/tampering and SDK Business Login options.
- [x] Verify RED: commit `bcd795f1f1b9e46e218011dd4baba1bf2c35d36c`, run `34109563997`.
- [x] Implement ten-minute AES-GCM pending state and SDK options.
- [x] Reject non-canonical Base64URL sealed-cookie input after the first GREEN attempt exposed a decoder edge case.
- [x] Verify GREEN: security fix `ce92cc2a41e9c282dbb5342eb09213ff947b2f71`, run `34109833584`.
- [x] Add regression coverage for SDK code exchange without forcing the callback URI and `auth_type=rerequest`.
- [x] Verify RED `fdc699544b9d2b8a75bf23f4bc0ca0a2642b28ea` / run `34110219049` and GREEN run `34110446586`.

### Task 3: Add protected code-exchange and explicit-selection endpoints

**Files:**
- `src/app/api/admin/content-automation/meta/exchange/route.ts`
- `src/app/api/admin/content-automation/meta/select/route.ts`
- `src/lib/socialAutomation/metaDashboardContract.test.ts`

**Interfaces:**
- `POST /api/admin/content-automation/meta/exchange/` consumes `{ code: string, sdkRedirectUri: string }`, where `sdkRedirectUri` is the public `redirect_uri` generated inside the Meta SDK dialog URL and validated server-side before exchange.
- Exchange returns `{ ok: true, status: "connected" }` or `{ ok: true, status: "selection-required", candidates: MetaConnectionCandidate[] }`.
- `POST /api/admin/content-automation/meta/select/` consumes `{ facebookPageId: string }`.
- Selection returns `{ ok: true, status: "connected" }`.

- [x] Write the failing route contract test.
- [x] Verify RED: commit `0dcad12dc7e15e8b6fbb2de12ed3a3885e3de0d3`, run `34110564820`.
- [x] Implement admin-authenticated, same-origin SDK code exchange and long-lived token upgrade.
- [x] Auto-connect a single candidate; for several candidates return only safe IDs/names and seal the user token in an HttpOnly cookie.
- [x] Implement explicit selection with pending-cookie validation, Meta re-query, final token encryption/storage and audit logging.
- [x] Correct an over-broad static leak assertion so it inspects the actual browser candidate mapper rather than server-only variables.
- [x] Verify GREEN: commit `ae3c970c8508b0b7607820f820d733d17f250de4`, run `34110847886`.

### Task 4: Replace the dashboard redirect with Facebook Login for Business popup UI

**Files:**
- `src/app/admin/content-automation/page.tsx`
- `src/app/admin/content-automation/ContentAutomationClient.tsx`
- `src/lib/socialAutomation/metaDashboardContract.test.ts`

**Interfaces:**
- `ContentAutomationClient` receives only safe public Meta configuration and login options.
- Desktop browser calls `FB.login` synchronously from the Connect/Reconnect click handler. Mobile and coarse-pointer browsers use the existing full-page redirect fallback from the same button because Meta's JavaScript SDK popup behavior differs on mobile.

- [x] Extend the failing contract test for SDK load/init/login, code exchange, Page selector, explicit selection and fallback preservation.
- [x] Verify RED: commit `0a22dc5ea7ae4fc5733af0799ba31db77b8bcd7d`, run `34110996107` (91 existing tests passed; only the new UI assertion failed).
- [x] Pass safe Meta App ID / Graph version / configuration ID / server-built login options into the client.
- [x] Load `https://connect.facebook.net/en_US/sdk.js`, initialize `FB.init`, and call `FB.login` directly from the button interaction.
- [x] POST the returned code to `/meta/exchange/` and render touch-friendly Page/Instagram choices when selection is required.
- [x] POST the chosen Page ID to `/meta/select/`, refresh after success, and keep the legacy redirect only as fallback when SDK/configuration is unavailable.
- [x] Verify GREEN: implementation commits `d411365de7cc5f26292d76668cc4afabccf36498` and `4f3fc3d3c0e64dd133aa3cec31f9d06f3d92128c`; focused run `34111340060` GREEN; Stage 11 build run `34111339899` GREEN.

### Task 5: Documentation and release verification

**Files:**
- `docs/blog-social-automation.md`
- `docs/meta-dashboard-business-login-progress.md`
- `docs/superpowers/plans/2026-09-07-meta-dashboard-business-login.md`

- [x] Document the root cause, completed popup/code-exchange flow, explicit Page selection, pending-token cookie security model, fallback callback, TDD history and deployment boundary.
- [ ] Run focused social validation on the exact final branch head.
- [ ] Run the existing `Blog social release validation` workflow on the exact final head. It must pass social, scheduler, WhatsApp, TypeScript, lint, SEO, sitemap, production build, dual Remotion render and 1080x1920 ffprobe checks.
- [ ] Review the final diff: no Supabase migration, no token-bearing browser response, no TikTok/WhatsApp/publishing changes, and no production deployment.
- [ ] Ask for explicit approval for the single production deployment.

## Deployment status

Implementation is complete on draft PR #18. No merge and no production deployment have occurred. Release verification and final scope/security review remain the only work before requesting deployment approval.
