# AdSense Content Upgrade Plan

## Current Page Inventory
- Core pages: `/`, `/about`, `/contact`, `/faq`, `/portfolio`, `/pricing`, `/launch`, `/website-build`, `/services`, `/blog`
- Vertical money pages: `/local-business`, `/ecommerce`, `/website-design-lagos`, `/website-design-united-kingdom`, `/website-redesign-lagos`, `/website-speed-optimization-nigeria`, `/google-business-profile-optimization-lagos`, `/web-design-for-real-estate-lagos`
- Service detail pages: `/services/*` (16 total)
- Trust/legal: `/editorial-policy`, `/privacy`, `/terms`
- Blog system: `/blog`, `/blog/[slug]` with markdown content in `content/blog/*.md`

## Existing Architecture Summary
- Router: Next.js App Router (`src/app/*`)
- Blog source: markdown + frontmatter via `gray-matter` in `src/lib/posts.ts`
- Metadata: centralized helpers via `buildPageMetadata` in `src/lib/seo.ts`
- Schema: implemented sitewide and page-level (Organization/ProfessionalService/BlogPosting/FAQ/Breadcrumb as applicable)
- Author model: now supported in `src/lib/authors.ts`
- Reusable content blocks: `src/components/content/*`

## Likely Thin/Repetitive Risk Areas Identified
- Historic service pages that reused near-identical commercial copy and repeated CTA patterns
- Blog article template previously leaned on repeated conversion CTAs and weak editorial structure
- Some blog posts missing explicit editorial fields (`author`, `updatedAt`, `keyTakeaways`, `relatedGuideSlugs`)
- Several geo/keyword pages likely need deeper standalone utility to avoid “money-page shell” feel

## Service Pages Needing Expansion
- Completed in this pass by moving core services into the structured service model:
  - `/services/business-website-design`
  - `/services/landing-page-design`
  - `/services/website-redesign`
  - `/services/ecommerce-website-design`
  - `/services/website-maintenance`
  - `/services/performance-optimisation`
  - `/services/website-audit`
- Each now supports: fit/not-fit, deliverables, process, mistakes, real examples, before/after, FAQ, related guides, and stronger schema support.

## Blog Template Improvements Needed/Applied
- Restore missing `src/app/blog/[slug]/page.tsx` route
- Add author/reviewer/date visibility
- Add key takeaways, what-you-need, mistakes, steps, FAQ, related guides, and table of contents
- Reduce CTA clutter to a restrained end-of-article action
- Add cornerstone-focused resource-hub behavior on blog index

## Proposed/Added Routes and Components
- Added reusable author/editorial/resource components in `src/components/content/*`
- Added `WhatYouNeed` component
- Added core service config model in `src/lib/coreServiceConfigs.ts`
- Added content-quality validation utility in `src/lib/contentQuality.ts`
- Added article template + high-value content placeholders in `content/blog/*` (see checklist doc)

## SEO and UX Risks
- Over-commercial pages with low informational value can still trigger low-value classification even with strong metadata
- Missing updated/review signals on older posts weakens trust
- Keyword overlap across geo/service pages can dilute uniqueness if page-specific utility is weak
- Internal linking must prioritize guide-to-guide relevance, not only money-page CTAs

## Noindex Recommendations (Only if content is not upgraded quickly)
- Do not noindex strong money pages currently targeted for ranking: `/website-build`, `/local-business`, `/ecommerce`
- Candidate temporary noindex if still thin after copy-depth audit:
  - `/website-design-united-kingdom`
  - `/website-speed-optimization-nigeria`
  - `/web-design-for-real-estate-lagos`
- Current strategy in this pass: upgrade structure first, avoid unnecessary noindex on key commercial pages
