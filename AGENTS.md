# Web Growth Repo Guidance

## Project Identity

Web Growth is no longer just a small agency brochure site. This repo is the foundation for a premium website growth platform that combines:

- premium service sales
- Academy content for SEO and trust
- AdSense-safe educational publishing
- free utilities and lead magnets
- digital products
- affiliate partnerships
- case studies and proof assets

Every future change should move the site toward:

**Build. Grow. Monetize.**

Priority order for all work:

1. Compliance
2. UX
3. Content Quality
4. SEO
5. Performance
6. Conversions
7. Revenue

## Tech Stack Assumptions

Based on the current repo:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel deployment
- Markdown blog content via `gray-matter`
- JSON route governance
- custom metadata/schema helpers in `src/lib/seo.ts`
- governed sitemap generation
- optional GSAP motion on some pages
- internal utility/tooling routes already present

## Repo Shape To Respect

- App Router routes live in `src/app`
- shared UI lives in `src/components`
- content helpers and platform logic live in `src/lib`
- Academy articles currently live in `content/blog`
- public assets live in `public`
- route and sitemap decisions live in `src/lib/route-governance.json`

Important:

- The public URL structure already exists and should be preserved carefully.
- The visible label may move from **Blog** to **Academy**, but do not break `/blog/` URLs without an explicit migration plan.
- Do not break existing routes, redirects, or sitemap behavior.

## Core Commands

Install:

```bash
npm install
```

Dev:

```bash
npm run dev
```

Clean dev start:

```bash
npm run dev:clean
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

SEO validation:

```bash
npm run seo:validate
```

Typecheck:

```bash
npx tsc --noEmit
```

Sitemap validation:

```bash
npm run build
```

Note: build already runs sitemap validation through `scripts/validate-sitemap.mjs`.

## Design Rules

- Design for a premium SaaS + documentation + learning platform + high-end agency hybrid.
- The site should feel more like a growth platform than a freelancer site.
- Prefer clear hierarchy, strong whitespace, restrained color, and dense-but-readable information layouts.
- Avoid visual clutter, oversized gradients, gimmick effects, and decorative hero noise.
- Keep cards purposeful. Do not turn every section into a card.
- Use CSS-first motion. Do not use heavy animation libraries unless necessary.
- When animation is needed, it must support comprehension, not decoration.
- Keep dark-mode polish, but improve contrast discipline and content readability.

## SEO Rules

- Use `buildPageMetadata()` or a clearly equivalent shared helper unless a page genuinely needs a custom override.
- Keep self-canonicals on all indexable pages.
- Preserve `route-governance.json` as the source of truth for index/noindex/redirect/sitemap decisions.
- Keep sitemaps generated from governance, not ad hoc allowlists.
- Use page-specific schema only when it matches visible content.
- Do not publish duplicate-intent pages without a clear differentiation strategy.
- Maintain strong internal links between service pages, Academy content, portfolio, and tools.

## AdSense-Safe Rules

- Do not publish thin content.
- Do not publish copied, spun, scraped, padded, or AI-filler content.
- Keep content-first layouts on informational pages.
- Required trust pages must remain present and substantial:
  - About
  - Contact
  - Privacy Policy
  - Terms
  - Disclaimer
  - Editorial Policy
- Ads should never lead the layout or crowd the primary reading experience.
- Do not create made-for-ads pages, fake tools, doorway pages, or empty category pages.

## Accessibility Rules

- Use semantic HTML first.
- One clear `h1` per page.
- Ensure keyboard access for menus, forms, accordions, tabs, and overlays.
- Preserve or improve contrast ratios.
- Do not use background images where meaningful content imagery needs semantic alt support.
- Use descriptive alt text for content images and empty alt only for decorative images.
- Respect `prefers-reduced-motion`.

## Performance Rules

- Protect Core Web Vitals.
- Prefer `next/image` for meaningful content images.
- Be cautious with:
  - background-image-heavy layouts
  - blur effects
  - multiple analytics/ad scripts
  - GSAP on content-heavy pages
- Keep third-party scripts to real business needs only.
- Avoid oversized client components when server rendering is enough.

## Component Rules

- Reuse existing shared components where practical.
- Favor configurable templates over one-off page implementations when intent matches.
- Keep service pages structurally consistent.
- Keep Academy pages structurally consistent.
- New components must support SEO, accessibility, and content readability by default.
- Do not introduce component duplication for slight stylistic variation.

## Content Rules

- Academy content must be original, practical, and people-first.
- Every article should support one clear search intent.
- Service pages should sell through clarity, proof, and specificity, not hype.
- Case studies must distinguish verified results from process examples.
- Tools and lead magnets must provide standalone value.
- Preserve or improve author/reviewer visibility.
- Do not publish thin content just to increase article count.

## Testing And QA Rules

Before closing work, run the smallest sensible validation pass:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Also verify, when relevant:

- metadata
- canonical tags
- robots behavior
- sitemap inclusion
- noindex pages remain noindex
- internal links
- mobile menu
- forms
- key CTA paths

## Git Workflow Rules

- Keep edits scoped to the task.
- Do not revert unrelated user changes.
- Do not delete or rename routes casually.
- Document assumptions clearly in the final response.
- Validate once after changes that affect the result.

## High-Risk Warnings

- Do not break existing routes.
- Do not publish thin content.
- Do not use heavy animation libraries unless necessary.
- Do not move Blog to Academy URLs without a redirect and governance plan.
- Do not expose internal utility routes in core navigation.
- Do not weaken trust/legal pages during redesign.
