# Sitemap Report

## Implementation

- `/sitemap-index.xml` references page and blog sitemaps.
- `/sitemap-pages.xml` is generated from governed `INDEX` pages.
- `/sitemap-blog.xml` is generated from governed `INDEX` articles.
- Blog, Privacy, Terms, and Editorial Policy are included.
- Noindex, redirect, API, and removed URLs are excluded.
- `/sitemap.xml` permanently redirects to the sitemap index.

## Current Parity

- Indexed page URLs: 32.
- Indexed article URLs: 33.
- Sitemap validator result: pass.

## Classification

- SEO best practice: submit only canonical, indexable `200` URLs.
- Google policy: a sitemap is not an AdSense approval requirement.
