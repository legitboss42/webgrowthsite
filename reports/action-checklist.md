# Action Checklist

## First 10 SEO fixes to implement
1. [CRITICAL] Some canonical tags do not match the crawled URL - Review each mismatched canonical and align it with the preferred live URL or apply redirects intentionally.
2. [HIGH] Some pages have weak or missing title tags - Tighten page titles so each one matches the primary intent and stays within a readable SERP length.

## Validation steps
1. Re-run `npm run seo:audit:webgrowth`.
2. Re-run `npm run lint`.
3. Re-run `npx tsc --noEmit`.
4. Re-run `npm run build`.
