# Meta Linked Instagram Connection Bugfix — 2026-09-07

## Incident

After the blog-to-social feature was released, the Content Automation dashboard successfully started Meta OAuth but returned to the dashboard without saving a Meta connection.

Production Vercel runtime logs showed the callback failure:

`No Instagram-linked Facebook Page is available for this Meta account.`

The account owner verified in Facebook Page Settings that the Page is already linked to the Instagram professional account `@web.growth`. Supabase had no `social_connections` row, confirming the failure occurred during managed Page / Instagram discovery before connection persistence.

## Root cause

`src/lib/socialAutomation/metaClient.ts` resolved managed Pages using only the inline Graph field `instagram_business_account`. A valid Page/Instagram link may instead be represented through `connected_instagram_account` or require resolving the Page `instagram_accounts` edge. Those valid shapes were being discarded, causing the callback to report that no linked Instagram account existed.

## TDD evidence

RED commit: `71061dfcda7356c50bac30e0739640555a2d3751`

- Added regression coverage for `connected_instagram_account`.
- Added regression coverage for the Page `instagram_accounts` edge fallback.
- Feature validation run `34082359209` failed exactly as expected.
- Result: 85 social tests, 83 passing, 2 failing. Both new tests failed with the same `No Instagram-linked Facebook Page...` error seen in production.

GREEN implementation commit: `cbae10208f5668194409ff88adc479264b422d26`

- `/me/accounts` requests both `instagram_business_account` and `connected_instagram_account`.
- Existing `instagram_business_account` behavior remains supported.
- `connected_instagram_account` is accepted as a linked professional account.
- When neither inline field is present, the resolver queries `/{page-id}/instagram_accounts` with the Page access token.
- Preferred Page selection and the existing multiple-eligible-Page ambiguity guard are preserved.

Focused GREEN validation:

- Blog social feature validation run `34082509631`: PASS.

Full code-head release validation:

- Run `34082509788`: PASS.
- Social tests: PASS.
- Scheduler tests: PASS.
- WhatsApp tests: PASS.
- TypeScript: PASS.
- Lint: PASS.
- SEO validation: PASS.
- Sitemap validation: PASS.
- Production build: PASS.
- Dual Meta/TikTok Remotion smoke render: PASS.
- Rendered dimension verification: PASS.
- Release render evidence upload: PASS.

## Deployment boundary

The fix is isolated on `feature/blog-social-automation`. Vercel preview deployment remains disabled for this branch and no deployment was created for the bugfix commits.

Do not merge this fix to `main` or trigger a production deployment until separate user approval is provided. After deployment, the account owner must repeat **Connect Meta** so the callback can resolve and persist the linked Page/Instagram connection.
