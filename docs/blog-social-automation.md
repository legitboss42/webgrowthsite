# Blog-to-Social Automation

## Current status

Development remains isolated on `feature/blog-social-automation` and PR #15 remains a draft. The production Supabase schema has been applied by explicit approval, but the Next.js application changes have not been merged to `main` or deployed.

## What the feature does

A genuinely new Markdown article added under `content/blog/*.md` is converted into short-form social content automatically:

1. GitHub detects only files whose Git name-status is `A` (added). Edits, renames and deletions do not repost existing articles.
2. The article is normalized and deterministic platform copy is generated.
3. Remotion renders two separate 1080x1920 videos:
   - `META`: Web Growth branding and article CTA are allowed.
   - `TIKTOK`: Web Growth logo, website overlay, promotional CTA, presenter branding and promotional narration are removed.
4. GitHub creates an idempotent job through signed internal API routes.
5. Rendered videos are uploaded with short-lived Supabase signed upload URLs. GitHub never receives `SUPABASE_SERVICE_ROLE_KEY`.
6. The application waits for the production article URL for at most 15 minutes.
7. Instagram and Facebook publish automatically when a usable Meta connection exists.
8. TikTok is queued into the existing scheduler as `NEEDS_APPROVAL`; creator consent/settings remain mandatory before Direct Post.
9. Terminal assets receive the configured retention deadline. Expired media is removed by the signed cleanup workflow only when no active publication/consent state still needs it.

## Production database

The Supabase migration was explicitly approved and applied to the Web Growth production project on 2026-09-06.

Production migration history:

- Version: `20260906105535`
- Name: `blog_social_automation`
- Branch file: `supabase/migrations/20260906105535_blog_social_automation.sql`

The following tables exist in production with RLS enabled:

- `social_automation_jobs`
- `social_media_assets`
- `social_publications`
- `social_connections`
- `social_automation_settings`
- `social_automation_audit_log`

The `social-automation` Storage bucket exists and is private. Default settings are enabled for Instagram, Facebook and TikTok generation, with 7-day asset retention and timezone `Africa/Lagos`.

## Security model

The social tables revoke browser access from `anon` and `authenticated` and grant required CRUD access to `service_role`. The service-role key remains server-only.

Internal GitHub-to-application requests use HMAC-SHA256 over the exact `${timestamp}.${body}` bytes with `SOCIAL_AUTOMATION_WEBHOOK_SECRET`. Requests outside the five-minute timestamp window or with an invalid signature are rejected.

Meta tokens are encrypted before storage using `META_TOKEN_ENCRYPTION_KEY`. The browser receives only safe connection metadata. The runtime publisher rejects a connection when `reconnect_required` is true or `access_expires_at` has passed before decrypting/using provider tokens.

Supabase security advisors report informational `RLS Enabled No Policy` notices for the new tables. This is intentional because they are service-role-only and browser grants are revoked. Supabase Auth separately reports leaked-password protection as disabled; that is an existing project-level warning unrelated to this feature.

## Required Vercel/server environment variables

Configure these in the production application environment before the application release. Never commit their real values:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_GRAPH_VERSION`
- `META_REDIRECT_URI` = `https://webgrowth.info/api/admin/content-automation/meta/callback/`
- `META_PAGE_ID` (optional preferred Page when the account manages multiple eligible Pages)
- `META_OAUTH_STATE_SECRET`
- `META_TOKEN_ENCRYPTION_KEY`
- `SOCIAL_AUTOMATION_WEBHOOK_SECRET`
- `SOCIAL_AUTOMATION_BASE_URL` = `https://webgrowth.info`
- `SOCIAL_AUTOMATION_VERSION` = `v1`
- existing `SUPABASE_URL`
- existing `SUPABASE_SERVICE_ROLE_KEY`
- existing `NEXT_PUBLIC_SUPABASE_URL`
- existing `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- existing `OWNER_TIKTOK_OPEN_IDS` used by the scheduler owner boundary

`META_APP_SECRET`, `META_OAUTH_STATE_SECRET`, `META_TOKEN_ENCRYPTION_KEY`, `SOCIAL_AUTOMATION_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are secrets and must never use a `NEXT_PUBLIC_` prefix.

## GitHub Actions configuration

The repository requires one Actions secret for this feature:

- `SOCIAL_AUTOMATION_WEBHOOK_SECRET` - must match the server-side value exactly.

The production publication workflow is `.github/workflows/blog-social-automation.yml`.

- Automatic publishing runs only on pushes to `main` that touch `content/blog/**`.
- `scripts/detect-new-blog-posts.mjs` uses `git diff --name-status` and selects only newly added publishable Markdown files.
- Focused social and scheduler tests run before rendering/publishing.
- `scripts/run-blog-social-automation.mjs` creates the job, renders, validates, uploads, registers and invokes publication.
- `workflow_dispatch` is intentionally dry-run only. It renders an existing article and uploads the generated output as a one-day GitHub artifact; it does not call publication APIs.

The retention workflow is `.github/workflows/blog-social-cleanup.yml`.

- It runs daily at `04:17 UTC` and may also be manually dispatched.
- `scripts/run-social-cleanup.mjs` signs a request to `/api/internal/social-automation/cleanup/`.
- Meta media is deleted from the private `social-automation` bucket only after its Instagram/Facebook states are terminal.
- TikTok media is deleted from `tiktok-scheduler-media` only after the real scheduler post is published or cancelled. TikTok `NEEDS_APPROVAL`, processing, scheduled, retryable and attention states remain protected.
- Database deletion state is recorded only after Storage confirms removal.

## Meta OAuth setup

The Content Automation dashboard starts the Meta OAuth connection flow. The callback exchanges the authorization code, upgrades the user token to a longer-lived token, discovers the managed Facebook Page and linked Instagram professional account, encrypts the tokens and stores only safe display metadata alongside the ciphertext.

The Meta app must permit the scopes used by the implementation and the callback URI must exactly match `META_REDIRECT_URI`. Real Facebook/Instagram account consent is an external account action and must be completed by an authorized account holder after the application release.

## TikTok consent boundary

TikTok generation is automatic, but TikTok `NEEDS_APPROVAL` is a successful preparation state, not a failure. The generated video is handed to the existing scheduler and continues through its creator-info, privacy, disclosure, approval-fingerprint and Direct Post gates. The blog automation never bypasses those controls.

## Idempotency and retries

- Job identity is deterministic for article slug + source commit + automation version.
- Duplicate job requests return/reuse the existing job.
- Instagram reuses an existing processing container on retry.
- Facebook persists its upload session state and resumes start/upload/finish without blindly starting a second Reel.
- TikTok draft persistence reuses an existing media/post link.
- One platform failure does not block successful work on another platform.
- Permanent provider errors move that platform to `NEEDS_ATTENTION`; automatic publication does not repeatedly retry it.

## Performance advisor follow-up

The Supabase performance advisor reports informational missing covering indexes for:

- `social_media_assets.job_id`
- `social_publications.media_id`
- `social_automation_audit_log.publication_id`

These are non-blocking INFO findings and are deliberately not being turned into an unrequested second production migration during this application build.

## Verification record

Verified during feature development so far:

- Social domain tests have repeatedly returned green after each completed RED/GREEN cycle.
- Stage 11 validation returned green after `/admin/content-automation/` was registered as `NOINDEX` and excluded from the sitemap.
- The WhatsApp suite returned 211/211 passing in the Stage 11 build gate after the route-governance fix.
- Vercel preview deployment remains disabled for `feature/blog-social-automation`.
- Production Supabase tables, RLS state, default settings, private bucket and migration history were verified after migration application.

The final release gate still requires a fresh full test/build/render/advisor/branch review after all feature files are committed. Actual final command results are appended here when that gate completes.

## Deployment boundary

The database migration is live, but the application release remains intentionally blocked.

- Do not merge `feature/blog-social-automation` to `main` yet.
- Do not trigger a production Vercel deployment yet.
- Keep Vercel preview deployment disabled for this feature branch.
- Complete final verification and present the result before any application release.
