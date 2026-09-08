# Unified Web Growth Logout Fix — 2026-09-08

## Status

Implemented and verified on `feature/unified-automation-dashboard`. This fix is **not yet merged or deployed**.

Production `main` at the start of this fix is `7eef83fe2318027edf4e1cdf37a57f64c495ae66`, which contains the approved Content Automation header/account-state release.

## User-visible issue

Clicking **Sign out** from the unified Automation Dashboard navigated the browser to:

`/api/auth/logout/`

That path rendered the site's 404 page instead of ending the shared Web Growth session and returning the user to sign-in.

## Root cause

The dashboard UI already posts both logout forms to `/api/auth/logout/`, but no App Router handler existed at:

`src/app/api/auth/logout/route.ts`

The working logout implementation already existed at:

`src/app/api/auth/workspace/logout/route.ts`

That handler is the correct shared logout behavior because it:

- requires an allowed same-origin POST request;
- clears `WEB_GROWTH_SESSION_COOKIE`;
- clears the legacy Google auth and OAuth-state cookies;
- clears the legacy workspace-password cookie;
- clears the legacy scheduler session cookie; and
- redirects to `/sign-in/` with HTTP 303.

The bug was therefore a missing canonical route, not a failure in cookie clearing or session invalidation.

## TDD evidence

### RED

Commit:

`33c769b80597f254c3ec488a581354493fb54dc7` — `test: reproduce missing canonical logout route`

GitHub Actions run:

`34234813628`

Expected failure:

`canonical logout route exists and delegates to the shared logout handler`

The assertion failed with:

`expected /api/auth/logout/ route to exist`

All other focused unified auth/session tests passed in that RED run.

### Implementation

Commit:

`a4fdf9cb2b8cf074fc863aede38521ea72ca7d4b` — `fix: add canonical Web Growth logout route`

Added:

`src/app/api/auth/logout/route.ts`

The new canonical route delegates its POST handling to the existing tested workspace logout handler rather than duplicating cookie/security logic.

## Verification

GitHub Actions run `34235006576` passed on implementation commit `a4fdf9cb2b8cf074fc863aede38521ea72ca7d4b`:

- unified session/auth/authorization/routing/sign-in tests: passed;
- TikTok scheduler regression suite: passed;
- Content Automation regression suite: passed;
- WhatsApp Business regression suite: passed;
- ESLint: passed;
- optimized Next.js production build: passed.

## Deployment boundary

- The feature branch name is intentionally reused because `vercel.json` already disables Git deployment for `feature/unified-automation-dashboard`, preventing an accidental preview deployment.
- `main` has not been modified by this fix.
- No manual Vercel deployment will be triggered.
- Do not merge or deploy until explicit user approval.
- After an approved merge and successful production smoke test, delete `feature/unified-automation-dashboard` again.
- Never delete `main`.
