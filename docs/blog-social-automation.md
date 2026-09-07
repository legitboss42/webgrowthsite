# Blog-to-Social Automation

## Current status

The core blog-to-social feature is live in production. The Meta connection correction described below is implemented on draft PR #18 (`fix/meta-dashboard-business-login`) but is **not merged or deployed**. Production therefore remains on the existing connection flow until the final release matrix is green and explicit deployment approval is received.

Production release history before PR #18:

- Main release commit: `01fbb959920eb9130334f414bb0e4144f3cbfada`
- Meta linked-account compatibility bugfix: `cc4dc0fd47249e46f428716fea23229f56072f06`
- Production Vercel deployment for the linked-account bugfix: `dpl_4vk7FCfhP4KHagZVhtR4TdvS7vfX` - READY
- Supabase migration: `20260906105535_blog_social_automation` - applied

The production Meta incident had two distinct symptoms:

1. Desktop could complete the authorization round trip, but an account with several Instagram-linked Facebook Pages reached `resolveManagedPage()` and was rejected as ambiguous. No connection row was saved, so the dashboard stayed `Not connected`.
2. Mobile depended on the full-page cross-site redirect. Production requests left Web Growth for Meta but did not reliably return to the callback.

PR #18 replaces that redirect as the primary connection mechanism with Facebook Login for Business inside the Content Automation dashboard and adds explicit Page selection.

## What the feature does

A genuinely new Markdown article added under `content/blog/*.md` is converted into short-form social content automatically:

1. GitHub selects only Git name-status `A` files, so edits, renames and deletions do not repost existing articles.
2. The article is normalized and deterministic platform copy is generated.
3. Remotion renders two separate 1080x1920 videos:
   - `META`: Web Growth branding and article CTA are allowed.
   - `TIKTOK`: promotional Web Growth branding, URLs and narration are removed.
4. GitHub creates an idempotent social automation job through signed internal API routes.
5. Videos upload through short-lived Supabase signed upload URLs. GitHub never receives the Supabase service-role key.
6. A GitHub/Vercel deployment race retries only `425 ARTICLE_NOT_AVAILABLE` for up to 15 minutes.
7. Instagram and Facebook publish automatically when a usable Meta connection exists.
8. TikTok enters the existing scheduler as `NEEDS_APPROVAL`, preserving creator consent and settings before Direct Post.
9. Terminal media is cleaned up according to retention rules. TikTok media remains protected until at least seven days after the scheduler's real terminal timestamp.

## Production database

The Supabase migration was explicitly approved and applied on 2026-09-06.

- Version: `20260906105535`
- Name: `blog_social_automation`
- Migration file: `supabase/migrations/20260906105535_blog_social_automation.sql`

Production tables:

- `social_automation_jobs`
- `social_media_assets`
- `social_publications`
- `social_connections`
- `social_automation_settings`
- `social_automation_audit_log`

RLS is enabled. Browser grants are revoked and required access is service-role-only. The `social-automation` Storage bucket is private. Default automation settings enable Instagram, Facebook and TikTok generation, use 7-day retention, and default to `Africa/Lagos`.

PR #18 requires **no database migration** and reuses the existing `social_connections` schema.

## Security model

Internal GitHub-to-application requests use HMAC-SHA256 over `${timestamp}.${body}` with `SOCIAL_AUTOMATION_WEBHOOK_SECRET`. Invalid signatures and requests outside the timestamp window are rejected.

Meta tokens are encrypted before storage using `META_TOKEN_ENCRYPTION_KEY`. Runtime publishing rejects Meta connections marked for reconnect or with expired access credentials before decrypting provider tokens.

The dashboard Business Login flow adds these boundaries:

- Only the Meta App ID, Graph version and Business Login configuration ID are exposed to browser JavaScript. They are identifiers required by the Meta SDK, not secret credentials.
- `META_APP_SECRET`, `META_OAUTH_STATE_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, user access tokens, Page access tokens and encrypted token payloads remain server-side.
- The browser receives only the authorization code returned by Meta and safe Page/Instagram candidate metadata: IDs and names.
- `POST /api/admin/content-automation/meta/exchange/` and `POST /api/admin/content-automation/meta/select/` both require the existing Content Automation admin session and a same-origin mutation.
- When several Pages are available, the long-lived user token is stored only in a short-lived AES-GCM-sealed HttpOnly cookie. The pending cookie expires after ten minutes and rejects tampered, non-canonical or expired values.
- The selection route re-queries Meta using the sealed pending user token before accepting the requested Page. A stale or fabricated Page ID is not trusted from the browser.
- Final user/Page tokens are encrypted before the existing `social_connections` row is saved.

Supabase security advisors report informational `RLS Enabled No Policy` notices for the social tables because they are intentionally service-role-only. Supabase Auth separately reports leaked-password protection as disabled; that is a project-level warning unrelated to this feature.

## Required Vercel/server environment variables

Never commit real values.

- `META_APP_ID`
- `META_APP_SECRET`
- `META_GRAPH_VERSION`
- `META_REDIRECT_URI=https://webgrowth.info/api/admin/content-automation/meta/callback/`
- `META_LOGIN_CONFIG_ID` - Facebook Login for Business configuration ID
- `META_PAGE_ID` - optional preferred Facebook Page used by the legacy callback fallback
- `META_OAUTH_STATE_SECRET`
- `META_TOKEN_ENCRYPTION_KEY`
- `SOCIAL_AUTOMATION_WEBHOOK_SECRET`
- `SOCIAL_AUTOMATION_BASE_URL=https://webgrowth.info`
- `SOCIAL_AUTOMATION_VERSION=v1`
- existing `SUPABASE_URL`
- existing `SUPABASE_SERVICE_ROLE_KEY`
- existing `NEXT_PUBLIC_SUPABASE_URL`
- existing `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- existing `OWNER_TIKTOK_OPEN_IDS`

`META_APP_SECRET`, `META_OAUTH_STATE_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, `SOCIAL_AUTOMATION_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` remain server-only secrets and must never use a `NEXT_PUBLIC_` prefix.

## Meta OAuth / Business Login setup

### Primary dashboard flow

The Content Automation dashboard loads Meta's JavaScript SDK from `https://connect.facebook.net/en_US/sdk.js` and initializes it with the configured App ID and Graph version. Clicking Connect/Reconnect calls `FB.login` directly from the button interaction with:

- `config_id=META_LOGIN_CONFIG_ID`
- `auth_type=rerequest`
- `response_type=code`
- `override_default_response_type=true`

The Business Login configuration owns the Page/Instagram permissions, so the SDK call does not send a second raw `scope` bundle.

After Meta returns an authorization code:

1. The browser POSTs only `{ code }` to `/api/admin/content-automation/meta/exchange/`.
2. The server exchanges the SDK code without inventing the legacy callback `redirect_uri` and upgrades the result to a longer-lived user token.
3. The server calls `/me/accounts` and accepts both linked-Instagram representations used by Meta:
   - `instagram_business_account`
   - `connected_instagram_account`
4. If exactly one eligible Page exists, it is connected automatically.
5. If several eligible Pages exist, the server seals the pending user token in an HttpOnly cookie and returns only safe Page/Instagram IDs and names.
6. The dashboard renders the candidate pairs as touch-friendly controls on both mobile and desktop.
7. Selecting a Page POSTs only its Facebook Page ID to `/api/admin/content-automation/meta/select/`.
8. The server decrypts the pending credential, re-queries Meta, validates the selected Page, encrypts the final user/Page token pair, saves the existing connection row and clears the pending cookie.

This removes the two brittle assumptions in the previous primary flow: that mobile must survive a full-page Meta round trip and that one Meta user necessarily manages only one eligible Instagram-linked Page.

### Fallback callback flow

The existing routes remain available as a secondary fallback when the Meta SDK is unavailable or the SDK configuration is missing:

- `/api/admin/content-automation/meta/connect/`
- `/api/admin/content-automation/meta/callback/`

The fallback retains sealed OAuth state, `auth_type=rerequest`, Business Login `config_id` support when configured, and the older scope-based compatibility path when no configuration ID exists. Unlike SDK-issued codes, callback-issued codes continue to be exchanged with the matching `META_REDIRECT_URI`.

The Meta app must include the exact callback URL in Valid OAuth Redirect URIs. The Facebook Login for Business configuration must include the Page and Instagram publishing permissions required by this feature.

## GitHub Actions

Production publication workflow: `.github/workflows/blog-social-automation.yml`

- Automatic execution occurs only on `main` pushes touching `content/blog/**`.
- Only newly added publishable Markdown articles are selected.
- Social and scheduler tests run before rendering/publishing.
- Manual `workflow_dispatch` is render-only and cannot publish.

Retention workflow: `.github/workflows/blog-social-cleanup.yml`

- Runs daily at `04:17 UTC` and can also be manually dispatched.
- Calls the signed cleanup endpoint.
- Meta media is deleted only when Instagram/Facebook states are terminal.
- TikTok media remains protected while consent or publishing work is active and for seven days after the scheduler's real terminal time.

## TikTok consent boundary

TikTok generation is automatic, but `NEEDS_APPROVAL` is a successful preparation state. The blog automation never bypasses creator-info, privacy, disclosure, approval-fingerprint or Direct Post controls in the existing scheduler.

## Idempotency and retries

- Job identity is deterministic for article slug + source commit + automation version.
- Duplicate requests reuse the existing job.
- Instagram reuses existing processing containers.
- Facebook publishing persists and resumes staged upload state.
- TikTok draft persistence reuses an existing media/post link.
- One provider failure does not block another provider.
- Permanent provider errors become `NEEDS_ATTENTION` and are not blindly retried.

## Performance advisor follow-up

Non-blocking Supabase INFO findings remain for missing covering indexes on:

- `social_media_assets.job_id`
- `social_publications.media_id`
- `social_automation_audit_log.publication_id`

These were intentionally not turned into an unrelated production migration during the social release.

## Verification history

The original release and linked-account resolver bugfix both passed the strict release matrix: social, scheduler, WhatsApp, TypeScript, lint, SEO, sitemap, Next.js production build, real branded Meta render, real neutral TikTok render, and 1080x1920 ffprobe verification.

PR #18 TDD evidence before final release validation:

- RED `2ed701b0b28fc857127ca528e6396297c8032286` / run `34103978127`: required multi-Page discovery; failed only on the missing `listManagedPages` behavior.
- RED `bcd795f1f1b9e46e218011dd4baba1bf2c35d36c` / run `34109563997`: required encrypted pending state and SDK Business Login options.
- Security follow-up `ce92cc2a41e9c282dbb5342eb09213ff947b2f71` / run `34109833584`: rejected non-canonical sealed-cookie tampering and returned GREEN.
- RED `fdc699544b9d2b8a75bf23f4bc0ca0a2642b28ea` / run `34110219049`: required SDK code exchange without the legacy callback URI and reconnect `rerequest` semantics. GREEN run: `34110446586`.
- RED `0dcad12dc7e15e8b6fbb2de12ed3a3885e3de0d3` / run `34110564820`: required protected exchange/select endpoints. GREEN run after implementation/test correction: `34110847886`.
- RED `0a22dc5ea7ae4fc5733af0799ba31db77b8bcd7d` / run `34110996107`: 91 existing social tests passed and only the intentionally missing dashboard-flow assertion failed.
- Dashboard implementation `d411365de7cc5f26292d76668cc4afabccf36498` + `4f3fc3d3c0e64dd133aa3cec31f9d06f3d92128c`: focused social validation run `34111340060` returned GREEN.

## Deployment boundary for PR #18

PR #18 remains draft and must not be merged or deployed until:

1. The exact final head passes the focused social suite and the repository's full release validation.
2. The final diff confirms there is no Supabase migration, no token-bearing browser response, and no unrelated TikTok/WhatsApp/publishing change.
3. Explicit user approval is received for the single production deployment.

Do not trigger a production Vercel deployment merely because environment variables or documentation changed.