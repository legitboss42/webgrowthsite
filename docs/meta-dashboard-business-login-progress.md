# Meta Dashboard Business Login Progress

## 2026-09-07

### Approved objective
Replace the full-page Meta connection redirect as the primary flow with Facebook Login for Business inside the Content Automation dashboard. Keep the existing callback route only as a fallback. Do not deploy until the complete implementation and release validation are finished and explicit approval is received.

### Root cause confirmed
- Desktop authorization reaches the callback but `resolveManagedPage()` rejects accounts with multiple eligible Instagram-linked Facebook Pages, so no `social_connections` row is saved and the dashboard remains `Not connected`.
- Mobile currently relies on the same full-page cross-site redirect. Production evidence showed the request leaves Web Growth for Meta but does not return to the callback, so the primary mobile flow must stop depending on that navigation boundary.

### TDD evidence
- RED commit `2ed701b0b28fc857127ca528e6396297c8032286` required `listManagedPages()` to return all eligible Page/Instagram pairs. GitHub Actions run `34103978127` failed as expected before implementation.
- RED commit `bcd795f1f1b9e46e218011dd4baba1bf2c35d36c` required encrypted pending-selection state and Facebook SDK Business Login options. Run `34109563997` failed as expected.
- The first pending-cookie GREEN attempt exposed a non-canonical Base64URL tampering edge case. Commit `ce92cc2a41e9c282dbb5342eb09213ff947b2f71` tightened sealed-cookie validation; run `34109833584` passed.
- RED commit `fdc699544b9d2b8a75bf23f4bc0ca0a2642b28ea` required SDK authorization-code exchange without inventing the old callback `redirect_uri` and required `auth_type=rerequest`. Run `34110219049` failed for exactly those two missing behaviors; commit `66dd19b80645abe5872c35785ce29b1e4c6a1318` made the focused suite GREEN in run `34110446586`.
- RED commit `0dcad12dc7e15e8b6fbb2de12ed3a3885e3de0d3` required protected `/meta/exchange/` and `/meta/select/` routes. Run `34110564820` failed only because both routes were absent.
- The first route implementation revealed an over-broad static token-leak assertion, not a browser token leak. Commit `ae3c970c8508b0b7607820f820d733d17f250de4` narrowed the assertion to the actual browser candidate mapper; run `34110847886` passed the complete social suite.
- RED commit `0a22dc5ea7ae4fc5733af0799ba31db77b8bcd7d` required the Content Automation page to use Facebook Login for Business in-dashboard, exchange the returned code, render Page choices, and retain the old redirect only as fallback. Run `34110996107` passed 91 existing tests and failed only the intentionally missing dashboard-flow assertion.
- UI implementation commits `d411365de7cc5f26292d76668cc4afabccf36498` and `4f3fc3d3c0e64dd133aa3cec31f9d06f3d92128c` made the focused social suite GREEN in run `34111340060`.

### Implementation completed
- `client.listManagedPages({ userAccessToken })` returns every eligible Facebook Page/Instagram professional account pair while `resolveManagedPage()` preserves callback compatibility.
- Pending multi-Page credentials are AES-GCM sealed in a short-lived HttpOnly cookie. Non-canonical/tampered/expired values are rejected.
- Facebook SDK Business Login options use the configured `config_id`, `auth_type=rerequest`, `response_type=code`, and `override_default_response_type=true` without a raw scope bundle.
- SDK authorization codes are exchanged server-side without forcing the full-page callback URI. The old redirect callback continues using its matching redirect URI.
- `POST /api/admin/content-automation/meta/exchange/` is admin-authenticated and same-origin protected. It upgrades the user token, discovers Pages, auto-connects one candidate, or returns only safe Page/Instagram IDs and names while sealing the pending long-lived user token server-side.
- `POST /api/admin/content-automation/meta/select/` is admin-authenticated and same-origin protected. It decrypts the pending credential, re-queries Meta, validates the selected Page, encrypts final user/Page tokens, saves the existing `social_connections` record, audits the connection, and clears the pending cookie.
- The Content Automation dashboard now loads `https://connect.facebook.net/en_US/sdk.js`, initializes the Meta SDK using only public App ID / Graph version / configuration ID values, and calls `FB.login` directly from the Connect/Reconnect button.
- The browser sends only the returned authorization code to the protected exchange route. It never receives user tokens, Page tokens, encrypted token payloads, app secrets, OAuth-state secrets, or the token-encryption key.
- When Meta returns several eligible Facebook Page / Instagram pairs, the same dashboard renders touch-friendly selection controls on mobile and desktop. The selected Page is revalidated server-side before storage.
- The existing full-page `/meta/connect/` + `/meta/callback/` flow remains available only as a fallback when the Meta SDK is unavailable or not configured.
- No Supabase migration was added. TikTok, WhatsApp, blog rendering, scheduler, and publication logic are unchanged.

### Remaining work
- Update the permanent blog-social operations guide and implementation plan status.
- Complete the exact-head production build and full release validation.
- Review the final PR diff for scope/security regressions.
- Request explicit approval before the single production deployment.

### Deployment status
No merge and no production deployment.