# Automation Waitlist Google Session Fix

Date: 2026-09-10
Branch: `feature/unified-automation-dashboard`
Production base: `40318dc6dc4f391cb20b5875cae1c9ef1e6abbe6`

## Symptom

A visitor could click **Continue with Google** in the Web Growth Automation waitlist, complete Google sign-in successfully, and return to `/automation/#waitlist` with no visible progress or final acknowledgement. The visitor effectively saw the Google gate again instead of continuing into the waitlist form.

## Root cause

The unified account migration changed Google ID-token sign-in to write the canonical Web Growth session cookie (`wg_webgrowth_session`). The current `/api/auth/google/session/` route also deletes the legacy Google cookie (`wg_google_auth`).

The Automation waitlist had not been migrated with the rest of the account flow:

- `WaitlistSection.tsx` still read only `readGoogleAuthSessionFromCookieStore()`.
- `/api/automation-waitlist/` still authorized submissions only through the same legacy Google cookie.

Therefore Google sign-in succeeded, but both the waitlist UI and its POST endpoint immediately forgot that it had succeeded.

## Supabase evidence

Project: Web Growth (`ockqdqlmzilrnilclwwa`).

Before the fix, `public.automation_waitlist` contained `0` rows and Vercel production logs contained no waitlist POST activity for the investigation window. This confirmed that visitors were not reaching a successful waitlist insert.

The table already has the required schema and a unique email constraint, so **no database migration was required or applied**. After code-only testing, the production table still contained `0` rows; no fake/test lead was inserted.

The Supabase security advisor continues to report existing service-role/RLS informational findings, including `automation_waitlist` having RLS enabled with no browser policy. That is compatible with the current server-only service-role storage design and was not changed by this fix. It also reports the existing account-wide leaked-password-protection warning. References:

- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## TDD evidence

### RED

Regression coverage was added to `src/components/auth/googleAuthExperience.test.ts` and wired into `.github/workflows/unified-automation-validation.yml`.

Commit: `617b4c0283b0a4ee36879b73d08ccfcc8d1ef155`
Run: `34539798047`

Result: **28 passed, 2 failed**, exactly on the new requirements:

1. waitlist must read the canonical Web Growth Google session;
2. waitlist must visibly acknowledge Google sign-in before the final join form.

### Implementation

Changes:

- `src/components/automation/WaitlistSection.tsx`
  - reads the canonical Web Growth session first;
  - accepts it for this flow only when `provider === "google"` and a verified email exists;
  - retains the legacy Google cookie reader only as a migration fallback;
  - shows `Google account connected. Complete this short form to join the waitlist.` before the prefilled form.

- `src/app/api/automation-waitlist/route.ts`
  - uses the same canonical-Google-first identity resolution;
  - retains legacy Google fallback;
  - does not treat password or TikTok sessions as Google waitlist consent;
  - preserves origin protection, automation filtering, rate limiting, honeypot, Turnstile validation, Supabase persistence-first ordering, confirmation-email status tracking, and existing error handling.

A first implementation run reached all behavioral suites and lint but the production build correctly caught a nullable TypeScript union in the UI. The identity was normalized into a non-null `{ email, fullName }` render object and the full workflow was rerun.

Final implementation commit: `6830c688740bca37a1db2cb7131bc5130dce030b`
Final implementation run: `34540162355`

Result:

- Unified/auth/waitlist tests: **passed** (30/30)
- TikTok scheduler regression suite: **passed** (282/282)
- Content Automation regression suite: **passed** (109/109)
- WhatsApp Business regression suite: **passed** (217/217)
- ESLint: **passed** with 0 errors and the same 5 existing non-blocking warnings
- Sitemap validation: **passed**
- Optimized Next.js production build: **passed**

## Correct user flow after this fix

1. Visitor clicks **Continue with Google**.
2. Google Identity Services verifies the visitor and the site writes the canonical Web Growth session.
3. Visitor returns to `/automation/#waitlist`.
4. Waitlist now recognizes the canonical Google session and displays:
   - **Google account connected.**
   - **Complete this short form to join the waitlist.**
5. The form is prefilled with the verified Google email/name; the visitor completes the remaining waitlist choices and submits.
6. Only after Supabase successfully saves the signup does the existing success state display **Waitlist confirmed / You're on the list.**

This deliberately does not claim that merely authenticating with Google has joined the visitor to the marketing waitlist. The final form remains the explicit signup/interest step.

## Release boundary

- No Supabase migration was applied.
- No production/test waitlist row was inserted.
- `feature/unified-automation-dashboard` remains explicitly disabled for Vercel Git deployments in `vercel.json`.
- Vercel returned zero deployments for the feature-work window at verification time.
- `main` has not been changed by this fix.
- Do not merge or deploy until the user gives explicit approval.
- After an approved merge and verified single production deployment, delete `feature/unified-automation-dashboard`; never delete `main`.
