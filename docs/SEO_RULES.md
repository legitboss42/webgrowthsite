# SEO Rules

## Core Standard

SEO on Web Growth must support:

- AdSense readiness
- service page conversions
- Academy traffic growth
- crawl clarity
- content governance

## Metadata Standards

- Use shared helpers in `src/lib/seo.ts` unless a page has a strong reason to diverge.
- Every indexable page needs:
  - unique title
  - unique meta description
  - self-canonical
  - index/follow unless intentionally governed otherwise
- Keep titles commercially clear, not clever.
- Use descriptive OG images tied to real page context where possible.

## Canonical Rules

- Indexable pages: self-canonical
- Noindex pages: self-canonical is still acceptable if the page is intentionally live
- Redirects: no page-level metadata should matter because the route should resolve immediately
- Preserve trailing slash behavior as implemented by `absoluteUrl()` and `trailingSlash: true`

## Sitemap Rules

- Sitemap generation must remain driven by `src/lib/route-governance.json`
- Do not maintain separate manual inclusion lists when governance already exists
- All `INDEX` pages intended for discovery should have sitemap inclusion decisions
- Noindex and redirect routes should stay excluded

Current sitemap surfaces:

- `src/app/sitemap-index.xml/route.ts`
- `src/app/sitemap-pages.xml/route.ts`
- `src/app/sitemap-blog.xml/route.ts`

## Robots.txt Rules

- `src/app/robots.ts` is the source of truth
- Internal tools, form completion routes, campaign utilities, API routes, and private flows should remain blocked where appropriate
- Do not accidentally expose internal utility routes through robots or sitemap changes

## Schema Rules

Use only schema that matches visible truth.

Allowed core types in this repo:

- `WebSite`
- `ProfessionalService`
- `Person`
- `WebPage`
- `BreadcrumbList`
- `Blog`
- `BlogPosting`
- `Service`

Rules:

- Do not add fake reviews, ratings, pricing, or business details
- Do not use FAQPage schema unless the visible FAQ content justifies it and there is a deliberate decision to enable it
- Keep organization/person/article relationships internally consistent

## Internal Linking Rules

Every important page should be reachable through contextual links, not only navigation.

### Academy

- each article should link to:
  - at least 2 related Academy articles
  - at least 1 relevant service page where appropriate

### Services

- each service page should link to:
  - related services
  - relevant Academy guides
  - contact or pricing paths

### Case Studies

- should link to both service and Academy support pages

### Tools

- should link to relevant learning resources and service escalation paths

## Category Structure

Visible content architecture should evolve toward Academy pillars, not a generic blog archive.

Target pillars:

- Google AdSense
- SEO
- Website Design
- Website Speed
- Lead Generation
- AI for Websites
- Case Studies
- Free Tools
- Checklists
- Templates
- Glossary

Until route changes are intentionally made, preserve current `/blog/` structure while improving labels and internal IA.

## Slug Rules

- use lowercase kebab-case
- keep slugs concise but descriptive
- do not rename published URLs casually
- if a rename is required, update governance and redirects intentionally

## Image SEO

- Prefer descriptive filenames
- Use `next/image` for meaningful content images where practical
- Provide real alt text for content images
- Decorative images should use empty alt or stay purely presentational
- Avoid relying on CSS background images for images that carry meaning

## Heading Hierarchy

- one H1 per page
- H2s should represent the real content structure
- do not skip hierarchy carelessly
- article templates should produce strong H2/H3 scanability

## Technical SEO Checklist

For indexable pages:

- title
- meta description
- canonical
- robots
- breadcrumb support where appropriate
- schema where appropriate
- internal links
- mobile-friendly layout
- strong page purpose

For Academy pages:

- author/reviewer visibility
- updated/reviewed dates
- keyword and search intent alignment
- related guides
- relevant service link

For money pages:

- unique intent
- no cannibalization overlap
- clear CTA hierarchy
- proof and trust support

## Current Repo-Specific Risks To Watch

- nav/footer link to noindex campaign pages
- mixed custom vs templated service page implementations
- “Blog” label undersells structured Academy positioning
- background-image-heavy sections reduce semantic image quality
- encoding damage in some copy can hurt perceived quality and SEO trust
