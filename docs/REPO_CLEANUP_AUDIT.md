# Repo Cleanup Audit

Generated: 2026-07-03  
Project: `webgrowth-info`  
Audit scope: repository cleanup planning before redesign  
Execution rule: audit completed first; approved safe-delete cleanup executed afterward

## Executive Summary

The repository is structurally solid enough to rebuild on top of, but it is carrying a meaningful amount of non-essential weight and some drift from earlier experiments.

The biggest cleanup opportunities are:

1. `public/` asset weight, especially character libraries, old downloadable PDFs, and unreferenced blog art
2. unreferenced components left behind after route-level refactors
3. duplicate helper logic in form handling
4. legacy or experimental flows such as the AI mockup widget and related API route
5. package bloat from Remotion-related packages that may not be needed in the main marketing site runtime

The biggest cleanup risks are:

1. route governance and redirect behavior
2. metadata and canonical generation
3. sitemap and robots generation
4. service page and blog URL preservation
5. contact form and lead-routing logic
6. internal utility routes that are not public IA but still operational

## Repository Health Score

**68 / 100**

### Why not higher

- `public/` remains very large at about `329 MB`
- likely-unreferenced public assets total about `279 MB` by text-reference scan
- several components appear orphaned
- duplicated helper logic still exists
- a few API and product experiments need explicit keep/remove decisions

### Why not lower

- App Router structure is coherent
- trust, policy, and editorial pages exist
- metadata helpers are centralized
- route governance exists and drives sitemap behavior
- service pages and blog content are real, not placeholders
- build, lint, and typecheck currently work after the confirmed-safe cleanup pass

## Current Folder Structure

### Top level

- `.codex/`
- `.git/`
- `.github/`
- `.next/`
- `.vercel/`
- `.vscode/`
- `content/`
- `docs/`
- `node_modules/`
- `out/`
- `public/`
- `scripts/`
- `src/`
- `.env.local`
- `.env.local.example`
- `.gitignore`
- `AGENTS.md`
- `eslint.config.mjs`
- `middleware.ts`
- `next-env.d.ts`
- `next.config.mjs`
- `package.json`
- `package-lock.json`
- `postcss.config.mjs`
- `README.md`
- `tsconfig.json`
- `tsconfig.tsbuildinfo`

### Measured folders

- `src/app`: 67 files, ~582 KB
- `src/components`: 88 files, ~495 KB
- `src/lib`: 21 files, ~171 KB
- `public`: 414 files, ~329 MB
- `content`: 38 files, ~370 KB
- `scripts`: 14 files, ~97 KB

### Not present

- `pages/`
- `src/hooks/`
- `src/styles/`
- `assets/`
- `tailwind.config.js`
- `next.config.js`

Notes:

- This is a Next.js App Router project, so `pages/` being absent is normal.
- Tailwind v4 is configured through `postcss.config.mjs`, so a missing `tailwind.config.js` is not automatically a problem.

## Must-Keep Files

These are high-value or high-risk surfaces that should be treated as protected during cleanup:

### Routing and governance

- `src/lib/route-governance.json`
- `next.config.mjs`
- `middleware.ts`
- all route files under `src/app/**/page.tsx`
- all route handlers under `src/app/**/route.ts*`

### SEO and metadata

- `src/lib/site.ts`
- `src/lib/seo.ts`
- `src/app/robots.ts`
- `src/app/sitemap-index.xml/route.ts`
- `src/app/sitemap-pages.xml/route.ts`
- `src/app/sitemap-blog.xml/route.ts`
- `src/app/layout.tsx`

### Content system

- `content/blog/*.md`
- `content/magnets/*.md`
- `src/lib/posts.ts`
- `src/lib/contentQuality.ts`
- `src/lib/authors.ts`

### Trust and policy pages

- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/editorial-policy`
- related components and metadata

### Lead flow and contact logic

- `src/app/api/forms/notify/route.ts`
- `src/components/ContactClient.tsx`
- `src/components/WebsiteBuildInquiryForm.tsx`
- Turnstile/security helpers

### Deployment and environment

- `.env.local.example`
- `.gitignore`
- `.vercel/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `postcss.config.mjs`

## Safe-to-Delete Files

These are the strongest candidates for deletion in the next cleanup execution pass because they are either clearly generated, clearly redundant, or isolated enough to remove with low risk.

### Generated / local artifacts

- `tsconfig.tsbuildinfo`
  - TypeScript incremental cache
  - safe to remove from the repo if it is tracked unintentionally
- `.next/`
  - build artifact directory
  - never needed in source control
- `out/`
  - likely generated media/output directory
  - review whether it is intentionally excluded from git and only kept locally

### Repo-local configuration residue

- `.codex/environments/environment.toml`
  - currently contains `command = "np run dev"`
  - likely local tooling residue, and the command is malformed
  - safe to remove if repo-local Codex environment files are not part of team workflow

### Small public artifacts with low value

The obvious Next starter SVGs were already removed in the earlier confirmed cleanup pass, so they are no longer part of the audit target.

## Needs-Review Files

These files appear unused or questionable, but should not be deleted without explicit approval.

### Unreferenced components

Likely orphaned by current import graph:

- `src/components/AiAssistantWidget.tsx`
- `src/components/BlogEndCTA.tsx`
- `src/components/BusinessWebsiteDesignClient.tsx`
- `src/components/EcommerceWebsiteDesignClient.tsx`
- `src/components/HomeClient.tsx`
- `src/components/HomeTrustSection.tsx`
- `src/components/LandingPageDesignClient.tsx`
- `src/components/MockupModal.tsx`
- `src/components/NavigationLoader.tsx`
- `src/components/PerformanceOptimisationClient.tsx`
- `src/components/PricingClient.tsx`
- `src/components/RelatedServiceCTA.tsx`
- `src/components/ServiceCard.tsx`
- `src/components/SocialShare.tsx`
- `src/components/SocialShareDock.tsx`
- `src/components/WebsiteAuditClient.tsx`
- `src/components/WebsiteMaintenanceClient.tsx`
- `src/components/WebsiteRedesignClient.tsx`
- `src/components/content/GlossaryBlock.tsx`
- `src/components/content/ResourceAuditSteps.tsx`
- `src/components/content/ResourceChecklist.tsx`
- `src/components/content/ResourceComparisonTable.tsx`
- `src/components/content/ResourceTemplateList.tsx`
- `src/components/content/TroubleshootingSection.tsx`

Important note:

The automated orphan scan also flags some files that are definitely in use, such as:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

Those are false positives caused by import-graph limitations and must be ignored.

### Experimental or partially-abandoned product flows

- `src/app/api/ai/route.ts`
- `src/components/AiAssistantWidget.tsx`
- `src/components/MockupClient.tsx`
- `src/app/mockup/page.tsx`

These look like an old mockup/AI flow that may not belong in the premium platform direction unless repositioned deliberately.

### Questionable or duplicate API surfaces

- `src/app/api/contact/route.ts`
  - appears separate from the current `api/forms/notify` flow
- `src/app/api/health/db/route.ts`
  - may be externally used for health checks
- internal TikTok and internal TTS routes
  - should be kept unless the operating model changes

### Historical or generated script artifacts

- `scripts/portfolio-inspection-report.json`
  - likely generated output living inside `scripts/`

## Unused Dependencies

### Strong review candidates

- `@remotion/player`
  - no usage found in the current repo scan
- `@remotion/cli`
  - not imported in code; may only be needed for local command-line rendering

### Keep, but review fit

- `remotion`
  - used in the repo
  - keep only if article-video workflows remain part of the platform
- `gsap`
  - used in the repo
  - keep for now, but review during redesign because the platform direction prefers CSS-first motion
- `playwright`
  - used by scripts
  - valid if screenshots, QA, or asset generation remain part of workflow
- `md-to-pdf`
  - used by magnet/export tooling
  - valid if downloadable resources remain part of the monetization model

### Not an issue

Dev packages such as TypeScript, ESLint, `@types/*`, and Tailwind may not appear in source imports, but they are still essential build/lint tooling.

## Duplicate or Obsolete Code

### Duplicate helpers

These are the clearest refactor targets:

- `normalizeUrl()` duplicated in:
  - `src/components/ContactClient.tsx`
  - `src/components/WebsiteBuildInquiryForm.tsx`
- `isValidUrl()` duplicated in:
  - `src/components/ContactClient.tsx`
  - `src/components/WebsiteBuildInquiryForm.tsx`
- `isValidEmail()` duplicated in:
  - `src/components/WebsiteBuildInquiryForm.tsx`
  - `src/lib/security.ts`

### Obsolete or suspicious surfaces

- old mockup and AI assistance flow
- orphaned service client components
- route-specific UI patterns that may have been replaced by direct page implementations

### Confirmed-obsolete code already removed in prior safe cleanup

- standalone unused `PricingCard.tsx`
- stale `sanity.queries.ts`
- unused `zod` dependency

## Public Asset Cleanup Plan

This is the largest savings opportunity.

### Current state

- `public/` total size: about `329 MB`
- `public/characters/` total size: about `229 MB`
- `public/downloads/` total size: about `30 MB`

### Highest-value review targets

#### 1. Character libraries

Examples of large apparently unreferenced assets:

- `public/characters/james/**/*`
- `public/characters/jennifer/**/*`
- `public/characters/maryann/**/*`
- large parts of `public/characters/mr-web-growth/**/*`

These should not be deleted casually, but they are prime candidates for:

- archiving out of the main repo
- moving to a design-assets workspace
- trimming to only assets actually used by Remotion or the site

#### 2. Download PDFs

Unreferenced examples:

- `public/downloads/local-seo-checklist.pdf`
- `public/downloads/builder-decision-checklist.pdf`
- `public/downloads/conversion-checklist.pdf`
- `public/downloads/email-marketing-checklist.pdf`
- `public/downloads/email-templates.pdf`
- `public/downloads/landing-page-checklist.pdf`
- `public/downloads/landing-page-template.pdf`
- `public/downloads/service-page-wireframe.pdf`

These should be kept only if:

- they are linked from live pages
- they are used in email funnels
- they are intentionally preserved for future lead magnets

#### 3. Oversized unreferenced JLuxe images

Examples:

- `public/images/blog/jluxe-series-faq-objection-map.webp`
- `public/images/blog/jluxe-series-cta-architecture.webp`
- `public/images/blog/jluxe-series-design-system-performance.webp`
- `public/images/blog/jluxe-series-core-web-vitals-design.webp`
- `public/images/blog/jluxe-series-service-page-framework.webp`
- `public/images/blog/jluxe-series-audit-mapping.webp`
- `public/images/blog/jluxe-series-migration-monitoring.webp`

Several of these are between `2.2 MB` and `3.3 MB` each.

### Proposed asset cleanup strategy

1. build a file-by-file referenced-vs-unreferenced manifest
2. keep assets referenced by:
   - routes
   - blog content
   - schema/image metadata
   - email or funnel usage if known
3. move design/reference assets out of `public/` if they are not public runtime dependencies
4. compress oversized runtime images that remain necessary

## CSS Cleanup Plan

### Current state

- no `styles/` folder exists
- global CSS is concentrated in `src/app/globals.css`
- no giant obsolete stylesheet library was found

### Current custom CSS areas

- anchored section offset
- latest-headline ticker animation
- hero fall-in animation
- offer-button styling and shimmer

### CSS cleanup recommendations

1. keep `globals.css` as-is for now
2. during redesign, move page-specific animation classes out if they only support legacy sections
3. audit whether:
   - `latest-headline-*`
   - `hero-fall-*`
   - `offer-button*`
   are still needed after homepage redesign
4. avoid introducing new global CSS if a component-scoped Tailwind approach will do

## Risk Warnings

### High risk

- `src/lib/route-governance.json`
- `next.config.mjs` redirects
- `src/lib/seo.ts`
- `src/lib/site.ts`
- `src/app/layout.tsx`
- `src/app/robots.ts`
- sitemap route handlers
- `src/lib/posts.ts`
- all published article files
- service page routes
- `src/app/api/forms/notify/route.ts`
- verification files in `public/*.txt`
- `public/ads.txt`

### Medium risk

- contact and website build inquiry client components
- internal utility routes
- TikTok workflow routes
- downloadable resources if they are used in off-site funnels

### Low risk

- local config residue
- clearly orphaned components
- duplicate helper functions after usage confirmation
- generated report JSON files

## Estimated Repo Size Reduction

### Conservative

- `5 MB or less`
- from local residue, tiny artifacts, and a few dead files

### Moderate

- `60 MB to 120 MB`
- by trimming confirmed-unreferenced downloads and oversized public art

### Aggressive but plausible

- `200 MB+`
- if character/reference libraries are archived or relocated out of runtime `public/`

### Current likely-unreferenced public weight

- about `279 MB` by text-reference scan

Important:

That number is **not** a safe delete total. It is a review target only.

## SEO-Critical and Rebuild-Critical Files

These need special protection during redesign:

- `src/app/robots.ts`
- `src/app/sitemap-index.xml/route.ts`
- `src/app/sitemap-pages.xml/route.ts`
- `src/app/sitemap-blog.xml/route.ts`
- `src/lib/route-governance.json`
- `src/lib/seo.ts`
- `src/lib/site.ts`
- `src/lib/posts.ts`
- `src/app/layout.tsx`
- `public/ads.txt`
- platform/domain verification files in `public/`

## Environment and Deployment Notes

### Environment-sensitive files

- `.env.local`
- `.env.local.example`
- `src/lib/site.ts`
- `src/app/layout.tsx`
- internal utility routes

### Deployment-specific files

- `.vercel/`
- `next.config.mjs`
- `middleware.ts`
- `public/ads.txt`
- verification `.txt` files in `public/`

### Build artifact note

`tsconfig.json` includes:

- `.next/dev/types/**/*.ts`
- `.next/types/**/*.ts`
- `.next-webgrowth/types/**/*.ts`

This means stale build artifacts can affect local `tsc` runs until Next regenerates types. It is not necessarily a source-code problem, but it is a cleanup and workflow consideration.

## Recommended Cleanup Order

1. **Lock the keep list**
   - routing
   - governance
   - SEO helpers
   - content
   - trust pages
   - lead forms

2. **Delete clearly safe artifacts**
   - local generated caches
   - repo-local tooling residue
   - stale generated JSON/report files

3. **Remove orphaned source files**
   - only after per-file confirmation

4. **Consolidate duplicate helpers**
   - URL/email validation
   - any repeated CTA/share logic confirmed unused

5. **Review unused API and experiment flows**
   - AI mockup widget
   - mockup page
   - extra contact route
   - health route

6. **Audit public assets**
   - downloads
   - oversized blog art
   - character libraries

7. **Review dependencies**
   - Remotion player/CLI fit
   - motion stack fit
   - remove packages tied only to dead code

8. **Validate after cleanup execution**
   - lint
   - typecheck
   - build
   - sitemap validation
   - SEO validation

## Proposed Cleanup Checklist

- [ ] Confirm protected keep list before deletion work
- [ ] Remove tracked generated artifacts and local residue
- [ ] Review and remove orphaned source components
- [ ] Consolidate duplicate helper functions
- [ ] Review AI/mockup experiment surfaces
- [ ] Review duplicate or stale API endpoints
- [ ] Build a referenced vs unreferenced public asset manifest
- [ ] Remove or archive unused downloads
- [ ] Remove or archive unused character/reference libraries
- [ ] Compress oversized runtime images that remain necessary
- [ ] Review Remotion-related package necessity
- [ ] Re-run lint
- [ ] Re-run typecheck
- [ ] Re-run build
- [ ] Re-run sitemap validation
- [ ] Re-run SEO validation

## Final Audit Verdict

The repo is **ready for a structured cleanup pass**, but not for a blind mass deletion.

The safest next move is:

1. approve a targeted source-file and dependency cleanup batch
2. approve a separate asset-review batch for `public/`

That split protects the marketing site while still reducing clutter before redesign.

## Cleanup Execution Log

Approved cleanup was executed on `2026-07-03` using the safe-to-delete list only.

### Removed in the earlier confirmed-safe cleanup pass

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `src/components/PricingCard.tsx`
- `src/lib/sanity.queries.ts`
- dependency: `zod`

### Removed in the approved safe-delete execution pass

- `scripts/portfolio-inspection-report.json`
- `tsconfig.tsbuildinfo`
- `.next/`
- `out/`

### Explicitly not removed

- `.codex/environments/environment.toml`

Reason: the approved execution rules for the cleanup pass said not to remove environment or deployment files.

### Post-cleanup validation target

- `npm.cmd run build`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
