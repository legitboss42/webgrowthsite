# Route Governance Report

## Audit

`src/lib/route-governance.json` is the machine-readable source of truth. It governs 56 application routes and 36 existing article slugs. Every entry has exactly one status: `INDEX`, `NOINDEX`, `REDIRECT`, or `REMOVE`.

## Decisions

- `INDEX`: 32 pages and 33 articles.
- `NOINDEX`: 8 operational pages and 5 API routes.
- `REDIRECT`: 11 route aliases and 3 consolidated articles.
- `REMOVE`: no standalone route requires removal after redundant alias page files were deleted.

## Fixes

- Active services and core trust pages remain indexed.
- Campaigns, forms, mockups, offers, APIs, and thank-you routes remain operational but outside the index.
- Low-CPU mode remains enabled by default. Only the 33 governed article slugs are generated and exposed.

## Classification

- Google/AdSense policy: no policy requires this exact registry.
- SEO best practice: avoid indexable thin utilities, duplicate routes, and sitemap/indexability conflicts.
- Conversion best practice: keep operational intake routes available even when noindexed.
- Personal recommendation: keep all future route decisions in this registry.
