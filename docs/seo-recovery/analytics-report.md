# Analytics Report

## Local Implementation Audit

- GTM loads in production using `GTM-TKSB7S75`.
- TikTok Pixel loads lazily in production.
- Direct Google Analytics loads only when `NEXT_PUBLIC_GA_ID` is configured.
- Microsoft Clarity loads only when `NEXT_PUBLIC_CLARITY_ID` is configured.
- Vercel Analytics, Speed Insights, and Web Vitals instrumentation are present.
- Low-CPU mode returns controlled `503` responses for protected API work.

## UNVERIFIED

GA4 property data, GTM container contents, Search Console coverage, AdSense status, Clarity recordings, traffic sources, engagement, referral quality, invalid clicks, rankings, and revenue are `UNVERIFIED`. No authenticated account session or export was available.

## Risk

If GTM also deploys GA4 or TikTok, direct tags could duplicate events. Container contents must be checked in an authenticated session before making traffic-quality claims.
