# Meta Dashboard Business Login Progress

## 2026-09-07

### Approved objective
Replace the full-page Meta connection redirect as the primary flow with Facebook Login for Business inside the Content Automation dashboard. Keep the existing callback route only as a fallback. Do not deploy until the complete implementation and release validation are finished and explicit approval is received.

### Root cause confirmed
- Desktop authorization reaches the callback but `resolveManagedPage()` rejects accounts with multiple eligible Instagram-linked Facebook Pages, so no `social_connections` row is saved and the dashboard remains `Not connected`.
- Mobile currently relies on the same full-page cross-site redirect. Production evidence showed the request leaves Web Growth for Meta but does not return to the callback, so the primary mobile flow must stop depending on that navigation boundary.

### TDD evidence
- RED commit `2ed701b0b28fc857127ca528e6396297c8032286` added a test requiring `listManagedPages()` to return all eligible Page/Instagram pairs.
- GitHub Actions run `34103978127` failed in `npm run test:social` as expected before implementation.

### Implementation completed so far
- Commit `ec8a41f607f7a79a3d7f9e02761f37c10328f2c6` adds `client.listManagedPages({ userAccessToken })` to Meta client discovery.
- Existing `resolveManagedPage()` now reuses that list while preserving zero-page, preferred-page, and ambiguous-page behavior for the fallback callback.

### Deployment status
No merge and no production deployment.