# SEO Audit Setup

## What this setup uses
- Google Cloud project: `Web Growth SEO Audit`
- Enabled APIs:
  - `PageSpeed Insights API`
  - `Google Search Console API`
- Search Console property currently configured for audits:
  - `https://webgrowth.info/`

## Environment variables
Save real values only in `.env.local`.

Required keys:
- `PAGESPEED_API_KEY`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GSC_SITE_URL`

## Commands
Run a one-off audit against any URL:

```bash
npm run seo:audit -- https://example.com/
```

Run the saved Web Growth audit target:

```bash
npm run seo:audit:webgrowth
```

## Outputs
The audit writes these files into `reports/`:
- `final-seo-audit.md`
- `action-checklist.md`
- `client-summary.md`
- `seo-audit-debug.json`

## What the audit checks
- Lighthouse audit
- PageSpeed Insights API audit
- local crawler
- metadata checker
- canonical checker
- robots.txt checker
- sitemap.xml checker
- schema JSON-LD checker
- Search Console API integration
- final report generator

## Notes
- The Search Console API gives performance data, not full live index coverage totals.
- This repo currently uses the URL-prefix property `https://webgrowth.info/` for API access.
- If Search Console API calls fail, check:
  - the service account is still listed under Search Console users
  - `GSC_SITE_URL` exactly matches the property URL
  - `GOOGLE_PRIVATE_KEY` still matches the active service-account key
