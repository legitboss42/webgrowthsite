# Blog-to-Social Automation

## Current status

The core blog-to-social feature is live in production.

Production release history:

- Main release commit: `01fbb959920eb9130334f414bb0e4144f3cbfada`
- Meta linked-account compatibility bugfix: `cc4dc0fd47249e46f428716fea23229f56072f06`
- Production Vercel deployment for the linked-account bugfix: `dpl_4vk7FCfhP4KHagZVhtR4TdvS7vfX` - READY
- Supabase migration: `20260906105535_blog_social_automation` - applied

The remaining production blocker is Meta OAuth reconnection. After the first successful Meta authorization round-trip failed during linked-Instagram discovery, subsequent Connect Meta attempts reach `/api/admin/content-automation/meta/connect/` and receive a 307 to Meta, but Meta does not return to our callback.

A follow-up patch is being verified on the preview-blocked `feature/blog-social-automation` branch. It adds explicit permission re-request semantics and current Facebook Login for Business `config_id` support. It is not yet merged or deployed.

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

## Security model

Internal GitHub-to-application requests use HMAC-SHA256 over `${timestamp}.${body}` with `SOCIAL_AUTOMATION_WEBHOOK_SECRET`. Invalid signatures and requests outside the timestamp window are rejected.

Meta tokens are encrypted before storage using `META_TOKEN_ENCRYPTION_KEY`. The browser receives only safe connection metadata. Runtime publishing rejects Meta connections marked for reconnect or with expired access credentials before decrypting provider tokens.

Supabase security advisors report informational `RLS Enabled No Policy` notices for the social tables because they are intentionally service-role-only. Supabase Auth separately reports leaked-password protection as disabled; that is a project-level warning unrelated to this feature.

## Required Vercel/server environment variables

Never commit real values.

- `META_APP_ID`
- `META_APP_SECRET`
- `META_GRAPH_VERSION`
- `META_REDIRECT_URI=https://webgrowth.info/api/admin/content-automation/meta/callback/`
- `META_LOGIN_CONFIG_ID` - Facebook Login for Business configuration ID
- `META_PAGE_ID` - optional preferred Facebook Page when multiple eligible Pages exist
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

`META_APP_SECRET`, `META_OAUTH_STATE_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, `SOCIAL_AUTOMATION_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` remain server-only secrets.

## Meta OAuth setup

The Content Automation dashboard starts Meta OAuth. The callback exchanges the authorization code, upgrades the user token to a longer-lived token, discovers the managed Facebook Page and linked Instagram professional account, encrypts the tokens, and stores safe connection metadata.

The production resolver supports both Meta Page representations used by the account-linking flow:

- `instagram_business_account`
- `connected_instagram_account`

The follow-up reconnect patch adds two OAuth compatibility behaviors:

1. `auth_type=rerequest` is always sent so a prior failed/partial authorization does not silently reuse stale permission state.
2. When `META_LOGIN_CONFIG_ID` is configured, OAuth uses Meta's Facebook Login for Business `config_id` flow and does not send the legacy raw `scope` parameter. `override_default_response_type=true` keeps the callback on authorization-code flow.

If `META_LOGIN_CONFIG_ID` is absent, the implementation preserves the existing scope-based fallback for compatibility, but production should use a Business Login configuration for the Web Growth Meta app.

The Meta app must include the exact callback URL in Valid OAuth Redirect URIs and the Business Login configuration must contain the Page/Instagram publishing permissions needed by this feature.

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

Reconnect incident TDD evidence:

- `85f5606a289f722e547454c2140779e1107422fe` added the `auth_type=rerequest` regression contract. Run `34084858720` failed only on that new assertion while the other 83 social tests passed.
- `2a55780217f6ebb6cb1bbe71e31800105b0e76e0` added the Facebook Login for Business `config_id` contract. Run `34084959918` failed on both intentionally missing OAuth behaviors while the other 83 tests passed.
- `80686d7d7d57f2d5f05cfd8fdc68f6161f85f6c1` implemented the reconnect and Business Login URL support. Focused feature validation returned GREEN.

## Deployment boundary for the reconnect patch

The reconnect patch is not yet in production.

- Keep `feature/blog-social-automation` preview deployment disabled.
- Do not merge the reconnect patch into `main` until `META_LOGIN_CONFIG_ID` is configured in the intended production environment and the final branch validation is green.
- Do not trigger another production Vercel deployment without explicit approval.
