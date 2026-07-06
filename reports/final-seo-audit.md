# Final SEO Audit

## Audit summary
- Target: https://webgrowth.info/
- Crawled pages: 40
- Sitemap URLs: 65
- Lighthouse SEO: 100/100
- PageSpeed mobile performance: 91/100
- Search Console configured: Yes

## Priorities
- Critical: 1
- High: 1
- Medium: 0
- Low: 0

## Critical issues
- Some canonical tags do not match the crawled URL: Canonical mismatches can consolidate rankings into the wrong URL or prevent the intended page from indexing well.

## High priority issues
- Some pages have weak or missing title tags: Title tags outside the usual 30-65 character range reduce click-through clarity and can weaken Google snippet control.

## Medium priority issues
- None detected in this run.

## Low priority issues
- None detected in this run.

## Technical SEO issues
- [critical] Some canonical tags do not match the crawled URL
- [high] Some pages have weak or missing title tags

## Search Console feedback
- Property used: https://webgrowth.info/
- Top pages by clicks:
- https://webgrowth.info/ | clicks 0 | impressions 24 | ctr 0.0% | position 10.5
- https://webgrowth.info/about/ | clicks 0 | impressions 3 | ctr 0.0% | position 23.0
- https://webgrowth.info/blog/ | clicks 0 | impressions 2 | ctr 0.0% | position 3.5
- https://webgrowth.info/blog/01-why-we-rebuilt-not-redesigned/ | clicks 0 | impressions 1 | ctr 0.0% | position 17.0
- https://webgrowth.info/blog/best-web-hosting-for-small-business-websites | clicks 0 | impressions 2 | ctr 0.0% | position 30.0
- https://webgrowth.info/blog/best-web-hosting-for-small-business-websites/ | clicks 0 | impressions 1 | ctr 0.0% | position 36.0
- https://webgrowth.info/blog/conversion-audit-checklist-service-homepage/ | clicks 0 | impressions 11 | ctr 0.0% | position 6.1
- https://webgrowth.info/blog/email-marketing-for-small-business/ | clicks 0 | impressions 1 | ctr 0.0% | position 15.0
- https://webgrowth.info/blog/high-converting-landing-pages-guide/ | clicks 0 | impressions 6 | ctr 0.0% | position 9.0
- https://webgrowth.info/blog/homepage-structure-that-converts-visitors-into-customers/ | clicks 0 | impressions 8 | ctr 0.0% | position 8.3
- Top queries by impressions:
- crm configuration guide | impressions 3 | ctr 0.0% | position 56.7
- crm configuration services | impressions 1 | ctr 0.0% | position 34.0
- html website performance optimization service | impressions 1 | ctr 0.0% | position 87.0
- maintenance and support for website | impressions 1 | ctr 0.0% | position 88.0
- ongoing website support | impressions 1 | ctr 0.0% | position 81.0
- slw hosting | impressions 1 | ctr 0.0% | position 42.0
- speed optimization service | impressions 1 | ctr 0.0% | position 66.0
- web audit service | impressions 93 | ctr 0.0% | position 17.8
- web design | impressions 1 | ctr 0.0% | position 7.0
- web development services: build sites that convert | impressions 6 | ctr 0.0% | position 70.7
- Low CTR opportunities:
- web audit service -> https://webgrowth.info/services/website-audit/ | impressions 85 | ctr 0.0% | position 16.8
- Pages ranking positions 8-20:
- website audit services -> https://webgrowth.info/services/website-audit/ | position 9.0 | impressions 1
- website growth -> https://webgrowth.info/ | position 12.0 | impressions 2
- web audit service -> https://webgrowth.info/services/website-audit/ | position 16.8 | impressions 85
- Indexed pages where available: 38
- Non-indexed pages where available: 37

## Core Web Vitals
- Mobile PageSpeed score: 91/100
- Desktop PageSpeed score: 98/100
- Mobile SEO score: 100/100
- Mobile LCP field data: Unavailable
- Mobile INP field data: Unavailable
- Mobile CLS field data: Unavailable

## Metadata issues
- Some pages have weak or missing title tags

## Canonical issues
- Some canonical tags do not match the crawled URL

## Sitemap issues
- None.

## robots.txt issues
- None.

## Schema issues
- None.

## Internal linking issues
- Priority paths checked: /, /about/, /contact/, /services/, /portfolio/, /pricing/, /blog/
- Lowest incoming internal links:
- https://webgrowth.info/services/google-my-business-setup-optimisation/ | incoming links 1
- https://webgrowth.info/services/crm-system-setup-configuration/ | incoming links 1
- https://webgrowth.info/services/booking-platform-setup-integration/ | incoming links 1
- https://webgrowth.info/services/analytics-tracking-setup/ | incoming links 1
- https://webgrowth.info/services/website-maintenance/ | incoming links 1
- https://webgrowth.info/services/email-marketing-setup-strategy/ | incoming links 1
- https://webgrowth.info/services/marketing-automation-build-implementation/ | incoming links 1
- https://webgrowth.info/contact/?service=Marketing%20Automation%20Build%20and%20Implementation | incoming links 1
- https://webgrowth.info/services/domain-registration-hosting-guidance/ | incoming links 1
- https://webgrowth.info/contact/?service=Website%20Hosting%20and%20Launch%20Setup%20Guidance | incoming links 1

## Image optimization issues
- Pages with images missing alt text:
- None found in crawled pages.

## AdSense readiness checks
- Required trust pages missing:
- None.
- Recommended disclaimer page present: No
- Thin crawled pages under ~150 words:
- https://webgrowth.info/services/ | words 1
- https://webgrowth.info/portfolio/ | words 1
- https://webgrowth.info/blog/ | words 1
- https://webgrowth.info/about/ | words 1
- https://webgrowth.info/services/search-engine-optimisation/ | words 1
- https://webgrowth.info/services/google-my-business-setup-optimisation/ | words 1
- https://webgrowth.info/services/crm-system-setup-configuration/ | words 1
- https://webgrowth.info/services/booking-platform-setup-integration/ | words 1
- https://webgrowth.info/services/analytics-tracking-setup/ | words 1
- https://webgrowth.info/services/website-maintenance/ | words 1

## CRO recommendations
- Strengthen CTA clarity on the pages with the highest impressions but low CTR.
- Add stronger internal CTA blocks from blog content into service and contact pages.
- Keep trust surfaces visible above the fold on homepage, service pages, and contact routes.
- Reduce friction on conversion routes by checking mobile forms, WhatsApp links, and proof blocks.

## Exact Next.js implementation steps
1. Cross-check absoluteUrl() usage, route metadata paths, and any redirect logic in src/lib/site.ts and src/app routes.
2. Update page metadata inputs passed to buildPageMetadata() or the route-level metadata exports in src/app/*/page.tsx.

## Final checklist
1. [CRITICAL] Some canonical tags do not match the crawled URL - Review each mismatched canonical and align it with the preferred live URL or apply redirects intentionally.
2. [HIGH] Some pages have weak or missing title tags - Tighten page titles so each one matches the primary intent and stays within a readable SERP length.
