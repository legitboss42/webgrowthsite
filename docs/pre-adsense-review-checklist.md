# Pre-AdSense Review Checklist

## Pages Upgraded
- `/about` strengthened with scope clarity, fit/not-fit, methodology, review standards, and proof links.
- `/blog` refocused as a resource hub with cornerstone prioritization and lower CTA pressure.
- `/blog/[slug]` rebuilt with author/reviewer/date trust blocks, editorial structure, TOC, related guides, FAQ, and restrained CTA behavior.
- Core service pages moved to structured deep template:
  - `/services/business-website-design`
  - `/services/landing-page-design`
  - `/services/website-redesign`
  - `/services/ecommerce-website-design`
  - `/services/website-maintenance`
  - `/services/performance-optimisation`
  - `/services/website-audit`

## Pages Merged or Template-Unified
- Unified service architecture using `ServiceDetailTemplateClient` + structured service config model.
- Consolidated service config source via:
  - `src/lib/newServiceConfigs.ts`
  - `src/lib/coreServiceConfigs.ts`

## Pages Marked Noindex
- None in this pass for key money pages.
- Decision: prioritize quality upgrades over blanket deindexing.

## Schema Reviewed
- Sitewide Organization/ProfessionalService and Person schema retained.
- Service schema now injected through the unified service template.
- BlogPosting + Breadcrumb schema active on article pages.
- FAQ schema active where FAQ content exists.

## Author Info Added
- Author system implemented via `src/lib/authors.ts`.
- Article pages now render author and optional reviewer blocks.

## Blog Template Improved
- Added structured editorial layout blocks:
  - key takeaways
  - what you need
  - common mistakes
  - process steps
  - FAQ
  - related guides
  - content date history

## Service Template Improved
- Added deeper sections to reduce thin/repetitive feel:
  - who this is for
  - who this is not for
  - deliverables
  - process
  - common mistakes
  - real examples
  - before/after
  - FAQ
  - related guides/resources
  - how it differs from generic builder setups

## Internal Linking Improved
- Blog post pages now use related-guides linking based on topic/tags/slugs.
- Service pages include guide-first resource callouts.

## Resource Architecture Ready
- Added article template scaffold for future publishing quality control.
- Added checklist asset architecture under `/public/resources/checklists`.

## Quality Gate Active
- Build-time warning utility added in `src/lib/contentQuality.ts` for:
  - missing author/review dates
  - weak takeaways/related guides
  - low section depth
  - weak service config completeness
