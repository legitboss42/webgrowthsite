# Blog-to-Social Automation

## Current status

Implementation is complete on `feature/blog-social-automation`. PR #15 remains isolated from `main` pending the project's separate deployment approval. The production Supabase schema has already been applied by explicit approval, but the Next.js application changes have **not** been merged to `main` or deployed to Vercel production.

Final verified code head before this documentation-only update:

- Commit: `f88c5fb88cbe28e6ad5b525c73b8f01693c355e2`
- Strict release workflow: `34041023779` - GREEN
- Blog social feature validation: `34041023844` - GREEN
- Stage 11 validation: `34041026297` - GREEN

## What the feature does

A genuinely new Markdown article added under `content/blog/*.md` is converted into short-form social content automatically:

1. GitHub detects only files whose Git name-status is `A` (added). Edits, renames and deletions do not repost existing articles.
2. The article is normalized and deterministic platform copy is generated.
3. Remotion renders two separate 1080x1920 videos:
   - `META`: Web Growth branding and article CTA are allowed.
   - `TIKTOK`: Web Growth logo, website overlay, promotional CTA, presenter branding and promotional narration are removed.
4. GitHub creates an idempotent job through signed internal API routes.
5. Rendered videos are uploaded with short-lived Supabase signed upload URLs. GitHub never receives `SUPABASE_SERVICE_ROLE_KEY`.
6. If GitHub starts before the new production article is available, job creation retries only `425 ARTICLE_NOT_AVAILABLE` responses for a maximum of 15 minutes. Other job-creation errors fail immediately.
7. Instagram and Facebook publish automatically when a usable Meta connection exists.
8. TikTok is queued into the existing scheduler as `NEEDS_APPROVAL`; creator consent/settings remain mandatory before Direct Post.
9. Terminal assets receive the configured retention deadline. Expired media is removed by the signed cleanup workflow only when no active publication/consent state still needs it. TikTok media also remains stored for at least seven days after the scheduler's actual terminal timestamp.

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

The connector can verify code references and infrastructure state, but it cannot inspect or prove the values of protected environment secrets. Before production release, the required variables must exist in the intended environment and the GitHub/Vercel `SOCIAL_AUTOMATION_WEBHOOK_SECRET` values must match. Secret values must never be pasted into project documentation or chat.

## GitHub Actions configuration

The repository requires one Actions secret for this feature:

- `SOCIAL_AUTOMATION_WEBHOOK_SECRET` - must match the server-side value exactly.

The production publication workflow is `.github/workflows/blog-social-automation.yml`.

- Automatic publishing runs only on pushes to `main` that touch `content/blog/**`.
- `scripts/detect-new-blog-posts.mjs` uses `git diff --name-status` and selects only newly added publishable Markdown files.
- Focused social and scheduler tests run before rendering/publishing.
- `scripts/run-blog-social-automation.mjs` creates the job, waits through the bounded production-article deployment race when necessary, renders, validates, uploads, registers and invokes publication.
- `workflow_dispatch` is intentionally dry-run only. It renders an existing article and uploads the generated output as a one-day GitHub artifact; it does not call publication APIs.

The retention workflow is `.github/workflows/blog-social-cleanup.yml`.

- It runs daily at `04:17 UTC` and may also be manually dispatched.
- `scripts/run-social-cleanup.mjs` signs a request to `/api/internal/social-automation/cleanup/`.
- Meta media is deleted from the private `social-automation` bucket only after its Instagram/Facebook states are terminal.
- TikTok media is deleted from `tiktok-scheduler-media` only after the real scheduler post is terminal and its actual `terminal_at` is at least seven days old. TikTok `NEEDS_APPROVAL`, processing, scheduled, retryable and attention states remain protected.
- Database deletion state is recorded only after Storage confirms removal.

## Meta OAuth setup

The Content Automation dashboard starts the Meta OAuth connection flow. The callback exchanges the authorization code, upgrades the user token to a longer-lived token, discovers the managed Facebook Page and linked Instagram professional account, encrypts the tokens and stores only safe display metadata alongside the ciphertext.

The Meta app must permit the scopes used by the implementation and the callback URI must exactly match `META_REDIRECT_URI`. Real Facebook/Instagram account consent is an external account action and must be completed by an authorized account holder after the application release.

## TikTok consent boundary

TikTok generation is automatic, but TikTok `NEEDS_APPROVAL` is a successful preparation state, not a failure. The generated video is handed to the existing scheduler and continues through its creator-info, privacy, disclosure, approval-fingerprint and Direct Post gates. The blog automation never bypasses those controls.

## Idempotency and retries

- Job identity is deterministic for article slug + source commit + automation version.
- Duplicate job requests return/reuse the existing job.
- New-article job creation tolerates the GitHub/Vercel deployment race by retrying only `425 ARTICLE_NOT_AVAILABLE` for at most 15 minutes.
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

## Final verification record

The exact code head `f88c5fb88cbe28e6ad5b525c73b8f01693c355e2` completed the strict release workflow `34041023779` successfully.

Verified release gates:

- `npm ci` reproducible install: GREEN
- Social automation suite: **79/79** passing
- Scheduler suite: **280/280** passing
- WhatsApp suite: **211/211** passing
- TypeScript: GREEN
- Lint: GREEN, with only existing non-blocking warnings
- SEO governance: GREEN
- Sitemap governance: GREEN
- Next.js production build: GREEN
- Real branded Meta Remotion render: GREEN
- Real neutral TikTok Remotion render: GREEN
- ffprobe metadata/dimension validation: GREEN for both outputs at **1080x1920**
- Blog social feature validation `34041023844`: GREEN
- Stage 11 validation `34041026297`: GREEN

Render evidence:

- Artifact name: `blog-social-release-render`
- Artifact ID: `5682756349`
- Artifact size: approximately 4.79 MB
- Artifact SHA-256 digest: `fc0055cb8713cabb8128f51e67e272d9b34735fb9e2c264f6db7b7185ee107f4`

Final verification also caught and resolved three launch-critical edge cases before release:

1. Articles without optional `public/article-assets/<slug>/` screenshots now render using built-in motion/gradient visuals instead of failing.
2. The GitHub/Vercel new-article race now performs bounded retry on `425 ARTICLE_NOT_AVAILABLE` instead of failing the automation prematurely.
3. Social-generated TikTok media now honors seven days from the scheduler's real terminal timestamp before deletion, rather than counting only from social-job completion.

Supabase production migration history and advisors were rechecked after implementation. Vercel feature-branch preview blocking was also rechecked during finalization and no current feature commits produced a deployment.

## Deployment boundary

Implementation is complete and release-verified, but application deployment remains intentionally blocked by project policy.

- Do not merge `feature/blog-social-automation` to `main` without separate deployment approval.
- Do not trigger a production Vercel deployment without separate deployment approval.
- Keep Vercel preview deployment disabled for this feature branch.
- Confirm protected production environment variables/secrets are configured before the release.
- PR #15 may be marked release-ready after the documentation-only final head also passes the release gate, but it must remain unmerged until explicit approval.
