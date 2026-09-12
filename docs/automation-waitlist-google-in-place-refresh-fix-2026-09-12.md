# Automation waitlist Google in-place refresh fix — 2026-09-12

## Symptom

On `/automation/#waitlist`, Google sign-in completed successfully but the final waitlist form did not appear until the visitor manually reloaded the page. The post-auth navigation could also move the visitor away from the waitlist position, forcing them to scroll back down.

## Root cause

The Google session endpoint was already writing the canonical Web Growth session cookie correctly. The client then called `window.location.assign(payload.redirectTo)` with `/automation/#waitlist`.

When the visitor was already on that document, the browser could handle the URL as same-document/hash navigation instead of forcing the App Router server payload to be refreshed. `WaitlistSection` is a server component, so it continued rendering from the pre-auth request until a manual reload caused it to read the new cookie.

The hard navigation/hash handoff also made scroll behavior browser-dependent.

## Investigation evidence

- `src/app/api/auth/google/session/route.ts` writes the canonical Web Growth session cookie and returns a safe relative `redirectTo`.
- `WaitlistSection` reads the canonical cookie server-side and renders the final form only for a Google-backed session with an email.
- Vercel production runtime errors showed no error cluster for `/api/auth/google/session/` during the investigation window.
- Supabase project `Web Growth` was active/healthy. `public.automation_waitlist` contained 0 signups during the investigation. No database migration or schema change was needed for this fix.

## TDD reproduction

Regression test added to `src/components/auth/googleAuthExperience.test.ts`:

`waitlist Google sign-in refreshes the current route in place after the session cookie is written`

RED commit: `3d91794ffc1dda21aa7ea9cb553363e2f4005f06`

GitHub Actions run: `34714304695`

Result before implementation: 31 unified auth/dashboard tests, 30 passed and the new regression test failed exactly because the waitlist flow had no in-place route refresh.

## Implementation

Implementation commit: `8a7033afb4a58f8703239b84f830412ac6113a29`

### `GoogleSignInButton.tsx`

- Added an optional `refreshCurrentRouteOnSuccess` prop, defaulting to `false`.
- Added Next.js App Router `useRouter()`.
- After the Google session endpoint succeeds, an opted-in caller now executes `router.refresh()` and returns instead of calling `window.location.assign(...)`.
- Existing Google sign-in consumers retain their previous redirect behavior because the new prop is opt-in.

### `GoogleWaitlistGate.tsx`

- Enabled `refreshCurrentRouteOnSuccess` only for the automation waitlist Google sign-in button.

This causes the server-rendered waitlist section to re-read the new session cookie immediately and swap the Google gate for the final waitlist form without a full document navigation or hash jump.

## Verification before production integration

Final feature-branch GitHub Actions run: `34714544421`

- Unified session/authorization/routing/sign-in tests: passed.
- TikTok scheduler regression suite: passed.
- Content/social automation regression suite: passed.
- WhatsApp Business regression suite: passed.
- ESLint: 0 errors; existing unrelated warnings remain.
- Sitemap validation: passed.
- Next.js optimized production build: passed.

## Production integration

- User explicitly approved the single production merge/deployment on 2026-09-12.
- Production integration uses one merge commit onto `main` so Vercel receives only one production-triggering repository change.
- The merge tree intentionally includes only the waitlist implementation, its regression test, and this documentation.
- Two obsolete Vercel cleanup workflow files that happened to exist on the long-lived feature branch are intentionally excluded from the production tree because they are unrelated to this waitlist fix.
- No Supabase schema or data mutation is required.
- Live deployment/runtime verification is performed after the one `main` commit lands; no follow-up documentation commit is made solely to record verification because that would violate the single-deployment rule.
- After `main` and the production deployment are verified, `feature/unified-automation-dashboard` is deleted to keep the repository branch list clean. `main` is never deleted.
