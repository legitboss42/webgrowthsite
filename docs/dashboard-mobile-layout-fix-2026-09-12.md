# Unified dashboard mobile layout fix — 2026-09-12

## Status

Implemented and verified on `fix/dashboard-mobile-layout`. Not merged to `main` and not deployed.

## Reported production symptom

On a narrow mobile viewport, `/dashboard/` showed the public Web Growth marketing header above the automation dashboard. The dark dashboard surface did not visually own the full viewport width, leaving a large light page area to the right while dashboard headings, cards, descriptions, and status chips overflowed into that exposed area.

## Root cause

Two existing layout assumptions collided:

1. `src/components/SiteChrome.tsx` classified `/admin/*` and `/whatsapp/set-password/*` as internal app surfaces, but not `/dashboard/*`. The root layout therefore continued rendering the public marketing header/footer and retained the fixed-header top spacing around the unified dashboard.
2. `src/components/dashboard/DashboardShell.tsx` relied on normal block sizing without defensive mobile width constraints. Its mobile module navigation intentionally uses horizontal overflow, but the shell, content column, heading, metric cards, and module cards did not explicitly constrain themselves to the viewport. Long content could therefore contribute to page-level horizontal overflow instead of remaining inside the app surface.

## TDD evidence

### RED

Regression coverage was added to `src/lib/unifiedSignIn.test.ts` for both behaviors:

- `/dashboard` and `/dashboard/*` must use internal app chrome rather than the public website header/footer.
- The shared dashboard shell must constrain page-level mobile width while keeping the module navigation horizontally scrollable.

GitHub Actions run `34716614355` failed in the `Unified session, authorization, routing and sign-in tests` step before the implementation changes were made. The branch source at that point contained neither the `/dashboard` console classification nor the required width/overflow classes.

### GREEN

Implementation head `f53e06e0ad7621749d670b6d1ad14ac64123d9bf` passed GitHub Actions run `34716744581`:

- Unified session/auth/routing/sign-in: **34/34 passed**
- TikTok scheduler: **282/282 passed**
- Content automation: **109/109 passed**
- WhatsApp Business: **217/217 passed**
- ESLint: **0 errors, 5 existing unrelated warnings**
- Sitemap validation: **217 governed routes, 45 indexed pages, 35 indexed articles**
- Next.js 15.5.14 production build: compiled successfully
- Static generation: **225/225 pages**

## Implementation

### `src/components/SiteChrome.tsx`

`isConsoleRoute()` now treats both `/dashboard` and `/dashboard/*` as internal console routes. As a result, the shared root layout:

- hides the public Web Growth marketing header on the dashboard;
- hides the public footer on the dashboard;
- removes the public fixed-header top offset from the dashboard;
- leaves the standalone Content Automation exception unchanged.

### `src/components/dashboard/DashboardShell.tsx`

The shared shell now:

- owns the full viewport width with `w-full` / `max-w-full`;
- prevents page-level horizontal overflow at the app shell;
- applies `min-w-0` / `max-w-full` through the responsive grid and content column;
- keeps the module navigation as the intentional horizontally scrollable mobile region;
- prevents the identity/header row from forcing width growth;
- allows dashboard headings, descriptions, metric values, and module-card text to wrap;
- keeps module status pills from collapsing while preventing them from forcing the page wider;
- retains the existing desktop two-column sidebar layout from the `lg` breakpoint upward.

No route behavior, authentication policy, Supabase schema/data, scheduler behavior, content automation behavior, or WhatsApp functionality was changed.

## Deployment boundary

`fix/dashboard-mobile-layout` is explicitly disabled in `vercel.json` for branch preview deployment while work is in progress. The unified validation workflow is temporarily configured to run on this branch so the full regression/build suite can execute before merge.

Vercel was checked after implementation and reported **0 deployments** since the branch work began. Production `main` remains untouched until explicit deployment approval.

When this fix is eventually integrated, the branch-only validation trigger and branch-specific Vercel deployment block should not be carried into `main`; the production merge should contain only the mobile-layout source changes, regression coverage, and this documentation.
