# Automation waitlist hidden form after Google auth fix — 2026-09-12

## Symptom

After the earlier Google waitlist handoff fix, Google authentication completed successfully and the server-rendered status changed to:

- `Google account connected.`
- `Complete this short form to join the waitlist.`

On a real mobile production session, however, the rest of the waitlist area below that status appeared blank. The form fields existed in the refreshed React tree but were not visually rendered.

## Root cause

`WaitlistForm.tsx` marked both its normal form shell and its success shell with `data-automation-reveal`.

`AutomationMotion.tsx` takes a one-time snapshot of elements matching `[data-automation-reveal]` when the automation page first mounts and attaches an `IntersectionObserver` only to those initial nodes. The page then adds the `automation-motion-ready` class.

The automation stylesheet intentionally hides reveal targets until the observer marks them visible:

```css
.automation-page.automation-motion-ready [data-automation-reveal] {
  opacity: 0;
}
```

After Google sign-in, the waitlist uses `router.refresh()` so the server component can immediately re-read the new canonical session cookie without a document navigation or scroll jump. That refresh replaces the Google gate with a newly inserted `WaitlistForm` while `AutomationMotion` remains mounted.

Because the new form was not present in the motion component's original snapshot, it was never observed and never received the `is-visible` class. The form therefore remained permanently at `opacity: 0`.

The green `Google account connected` status remained visible because that status element is not marked with `data-automation-reveal`, which is why the production screenshot showed the acknowledgement followed by a blank area.

The success panel had the same latent problem because it is also inserted dynamically after a successful waitlist submission.

## TDD reproduction

A focused regression test was added to `src/components/auth/googleAuthExperience.test.ts`:

`waitlist form stays visible when inserted after the in-place Google auth refresh`

The test requires `WaitlistForm.tsx` not to opt into the one-shot page reveal system.

RED commit: `bf71496dd7be530d3c86ad7551d7998dd3e52e6b`

CI workflow commit: `d8b9f89acf1f31622c0516068bbb05156d2ce528`

RED GitHub Actions run: `34715447335`

Result before implementation:

- focused waitlist/auth tests: 7 total, 6 passed, 1 failed
- the new regression failed exactly because `WaitlistForm.tsx` still contained `data-automation-reveal`

## Implementation

Implementation commit: `af175504ec314d27c155f54025eb8b48c53e7c91`

`src/components/automation/WaitlistForm.tsx` now keeps both dynamic roots outside the one-shot reveal system:

- normal waitlist form root no longer has `data-automation-reveal`
- successful waitlist confirmation root no longer has `data-automation-reveal`

No auth, session, API, database, validation, analytics, or submission behavior was changed.

This is intentionally narrower than rewriting the shared animation system. Stateful content that can be inserted after the initial observer scan must be immediately visible and must not depend on an observer that never registered it.

## GREEN verification

Implementation GitHub Actions run: `34715537444`

Results:

- focused Google waitlist/auth-refresh tests: 7/7 passed
- unified session/authorization/routing tests: 25/25 passed
- TikTok scheduler regression suite: 282/282 passed
- content/social automation regression suite: 109/109 passed
- WhatsApp Business regression suite: 217/217 passed
- ESLint: 0 errors, 5 existing unrelated warnings
- sitemap validation: passed
  - governed routes: 217
  - indexed pages: 45
  - indexed articles: 35
- Next.js 15.5.14 optimized production build: passed
- static generation: 225/225 pages generated

## Deployment boundary

- Work is isolated on `fix/waitlist-form-after-google-auth`.
- The branch is explicitly disabled in `vercel.json`, so Git pushes on this branch do not create Vercel deployments.
- No Supabase schema or data changes are required.
- `main` remains untouched while this fix is verified.
- Production deployment requires explicit user approval after final branch-head verification.
- After a successful single merge/deployment and live verification, the feature branch must be deleted. `main` must never be deleted.
