# Blog Visibility Report

## Implementation

The same governance allowlist now controls static generation, blog listing visibility, related-post eligibility, and sitemap inclusion.

- Approved and visible: 33 articles.
- Redirected and unavailable as articles: 3 articles.
- Hidden approved articles: 0 by implementation.
- Sitemap-only approved articles: 0 by implementation.
- Listing-only approved articles: 0 by implementation.

`LOW_CPU_EMERGENCY_MODE` is unconditional and remains enabled. The article allowlist does not disable that operational protection.

## Remaining Verification

Production crawl and representative desktop/mobile rendering were verified on June 19, 2026. The live blog sitemap contains 33 approved articles, restored series pages return `200`, and consolidated articles return permanent redirects.
