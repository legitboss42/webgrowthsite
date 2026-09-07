# In-Dashboard Meta Business Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brittle full-page Meta OAuth connection path with an in-dashboard Facebook Login for Business flow that works on mobile and desktop, explicitly handles multiple eligible Facebook Pages, and stores tokens only on the server.

**Architecture:** The Content Automation dashboard loads Meta's JavaScript SDK and launches `FB.login` synchronously from the Connect button using the configured Facebook Login for Business `config_id`, `response_type: "code"`, and `override_default_response_type: true`. The browser sends only the returned authorization code to a protected server endpoint. The server exchanges and upgrades the user token, discovers eligible Facebook Page/Instagram pairs, auto-connects a single candidate or returns safe metadata for a selector while sealing the pending user token in a short-lived encrypted HttpOnly cookie. A second protected endpoint completes an explicit Page selection. The existing callback route remains as a fallback.

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
- Modify: `src/lib/socialAutomation/metaClient.test.ts`
- Modify: `src/lib/socialAutomation/metaClient.ts`

**Interfaces:**
- Produces: `client.listManagedPages({ userAccessToken }): Promise<MetaManagedPage[]>`
- Preserves: `client.resolveManagedPage({ userAccessToken, preferredPageId? })`

- [ ] **Step 1: Write the failing test**

Add a test that supplies two Instagram-linked Pages and expects `listManagedPages` to return both safe typed Page records in Meta response order. Keep the existing test proving `resolveManagedPage` requires an explicit choice when several candidates exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:social`

Expected: FAIL because `listManagedPages` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Extract the existing `/me/accounts` discovery/parsing logic into `listManagedPages`. Re-implement `resolveManagedPage` by calling `listManagedPages`, preserving zero-candidate, preferred-Page, and ambiguous-Page behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:social`

Expected: PASS.

### Task 2: Add encrypted pending-selection state and popup option helpers

**Files:**
- Modify: `src/lib/socialAutomation/metaOAuth.test.ts`
- Modify: `src/lib/socialAutomation/metaOAuth.ts`

**Interfaces:**
- Produces: `META_PENDING_CONNECTION_COOKIE`
- Produces: `META_PENDING_CONNECTION_MAX_AGE_SECONDS`
- Produces: `createMetaPendingConnection(secret, input, nowMs?)`
- Produces: `readMetaPendingConnection(cookieValue, secret, nowMs?)`
- Produces: `buildMetaSdkLoginOptions(configId)`

- [ ] **Step 1: Write failing tests**

Add tests proving that the pending cookie contains no plaintext access token, rejects tampering/expiry, and round-trips `{ userAccessToken, expiresAt, createdAt }`. Add a test proving SDK login options contain `config_id`, `response_type: "code"`, and `override_default_response_type: true`, and do not contain a raw `scope` field.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:social`

Expected: FAIL because pending-state and SDK-option helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

Use the existing `sealCookiePayload`/`openCookiePayload` AES-GCM helpers. Limit pending state to ten minutes, validate required fields, and return the exact Facebook Login for Business popup option object.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:social`

Expected: PASS.

### Task 3: Add protected code-exchange and explicit-selection endpoints

**Files:**
- Create: `src/app/api/admin/content-automation/meta/exchange/route.ts`
- Create: `src/app/api/admin/content-automation/meta/select/route.ts`
- Create: `src/lib/socialAutomation/metaDashboardContract.test.ts`

**Interfaces:**
- `POST /api/admin/content-automation/meta/exchange/` consumes `{ code: string }`
- Exchange response is either `{ ok: true, status: "connected" }` or `{ ok: true, status: "selection-required", candidates: MetaConnectionCandidate[] }`
- `POST /api/admin/content-automation/meta/select/` consumes `{ facebookPageId: string }`
- Selection response is `{ ok: true, status: "connected" }`

- [ ] **Step 1: Write the failing contract test**

Assert that both protected POST routes exist, use `hasContentAutomationAdminAccess`, keep secrets server-side, and that the exchange route uses `listManagedPages` plus the pending HttpOnly cookie instead of sending tokens to the browser.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:social`

Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Implement exchange endpoint**

Validate admin access and the short-lived authorization code. Exchange it server-side with `META_APP_ID`/`META_APP_SECRET`, upgrade to the long-lived user token, then call `listManagedPages`. If one Page exists, encrypt/save the connection and audit `META_CONNECTED`. If several exist, seal only the long-lived user token and expiry in `META_PENDING_CONNECTION_COOKIE`, set it HttpOnly/Secure/SameSite=Lax under `/api/admin/content-automation/meta/`, and return only Page/Instagram IDs and names. Never return access tokens.

- [ ] **Step 4: Implement selection endpoint**

Validate admin access and `facebookPageId`, decrypt/read the pending cookie, re-query `listManagedPages` with the pending user token, select the requested Page, encrypt/save the final user/Page tokens, audit `META_CONNECTED`, clear the pending cookie, and return connected status.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:social`

Expected: PASS.

### Task 4: Replace the dashboard redirect with Facebook Login for Business popup UI

**Files:**
- Modify: `src/app/admin/content-automation/page.tsx`
- Modify: `src/app/admin/content-automation/ContentAutomationClient.tsx`
- Modify: `src/lib/socialAutomation/metaDashboardContract.test.ts`

**Interfaces:**
- `ContentAutomationClient` receives `metaLogin: { appId: string; graphVersion: string; configId: string; configured: boolean }`
- Browser calls `FB.login` synchronously from the Connect/Reconnect click handler.

- [ ] **Step 1: Extend failing contract test**

Assert that the dashboard no longer uses the full-page `/meta/connect/` anchor as the primary control, loads `https://connect.facebook.net/en_US/sdk.js`, initializes `FB.init` with server-provided public Meta configuration, launches `FB.login` with `buildMetaSdkLoginOptions`, posts the returned code to `/meta/exchange/`, renders multiple candidates as buttons, and posts the chosen Page ID to `/meta/select/`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:social`

Expected: FAIL against the existing anchor-based dashboard.

- [ ] **Step 3: Implement the client flow**

Load the SDK after hydration, initialize it with the existing Meta app ID and Graph version, keep the Connect button disabled until configuration/SDK readiness, invoke `FB.login` directly inside the click handler, send the authorization code to the protected exchange route, and render a responsive selector when multiple Page/Instagram pairs are returned. On successful exchange/selection, show a success message and call `router.refresh()`.

- [ ] **Step 4: Keep fallback available**

If the SDK cannot load or configuration is unavailable, show a concise diagnostic plus a secondary fallback link to the existing `/meta/connect/` route. The callback route itself remains unchanged.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:social`

Expected: PASS.

### Task 5: Documentation and release verification

**Files:**
- Modify: `docs/blog-social-automation.md`
- Modify: `docs/superpowers/plans/2026-09-07-meta-dashboard-business-login.md`

**Interfaces:** None.

- [ ] **Step 1: Document the completed architecture**

Record the root cause, the new popup/code-exchange flow, explicit Page selection, pending-token cookie security model, fallback callback, and the deployment boundary.

- [ ] **Step 2: Run focused validation**

Run: `npm run test:social`

Expected: PASS.

- [ ] **Step 3: Run full release validation**

Run the repository's existing Blog social release validation workflow on the exact final branch head. It must pass social tests, scheduler tests, WhatsApp regression tests, lint/build checks required by that workflow, and any existing release gates.

- [ ] **Step 4: Review the final diff**

Confirm there are no Supabase migrations, no token-bearing browser responses, no TikTok/WhatsApp/publishing changes, and no production deployment.

- [ ] **Step 5: Ask for deployment approval**

Only after all previous steps are green, present the exact branch/PR/head and request permission for one production deployment.