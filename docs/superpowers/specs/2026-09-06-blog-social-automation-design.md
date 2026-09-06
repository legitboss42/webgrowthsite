# Blog-to-Social Automation Design

Date: 2026-09-06
Status: Approved in chat, awaiting written-spec review
Branch: `feature/blog-social-automation`

## Goal

Automatically turn every genuinely new Web Growth blog post into platform-ready social content for Facebook, Instagram, and TikTok while preserving platform compliance, keeping required recurring service cost at $0 where practical, reusing the existing Remotion and scheduler systems, and avoiding duplicate publication.

The preferred operating model is fully automatic publishing wherever the platform permits it.

## Non-negotiable constraints

1. A genuinely new Markdown article added under `content/blog/` on `main` is the trigger.
2. Editing an existing article must not create a new social post automatically.
3. Facebook and Instagram publication should be unattended once the account connection is configured and valid.
4. TikTok content generation should be automatic, but the final Direct Post action must preserve the platform-required preview, privacy selection, editable metadata, interaction controls, and express creator consent.
5. No production deployment occurs until the complete feature has been implemented, verified, documented, and the user explicitly approves deployment.
6. The implementation must not introduce a required paid API or recurring service.
7. Existing scheduler functionality must be extended, not replaced.
8. Secrets and long-lived platform credentials must remain server-side and encrypted at rest where stored.
9. All exposed Supabase tables must have RLS enabled. Server-only tables should have no browser policies unless a real browser use case requires them.
10. The feature must fail safely and independently per platform. One platform failure must not prevent successful publishing to the others.

## Existing assets to reuse

The repository already contains:

- Structured Markdown blog posts under `content/blog/`.
- Frontmatter fields including title, excerpt, category, topic, tags, cover, key takeaways, common mistakes, steps, and related guide metadata.
- Remotion 4 with `WebGrowthArticleVideo` and a 1080x1920 vertical renderer.
- TTS and subtitle generation through the existing Edge TTS integration.
- Existing TikTok OAuth, token encryption, creator-info checks, Direct Post support, publish-status checks, scheduler approvals, retries, media validation, and worker state.
- Supabase tables for scheduler users, TikTok connections, media assets, scheduled posts, approvals, attempts, audit log, and worker health.
- Vercel-hosted Next.js application and admin interfaces.

The implementation should reuse these components rather than create parallel systems.

## Architecture decision

### Selected approach: hybrid GitHub Actions + Supabase + existing Vercel application

The user asked that the feature remain free to operate. The architecture therefore avoids introducing Vercel Workflow or another paid orchestration dependency as a required component.

The responsibilities are:

- **GitHub / GitHub Actions**
  - Detect genuinely new blog Markdown files merged to `main`.
  - Run deterministic article extraction and social-content generation.
  - Run Remotion/Chromium rendering on standard GitHub-hosted runners.
  - Upload generated assets to Supabase Storage.
  - Call the trusted application API that creates/publishes social jobs.

- **Supabase**
  - Persist article automation jobs, connection metadata, platform publication state, media metadata, retries, and audit information.
  - Store rendered media.
  - Continue storing existing scheduler/TikTok state.

- **Vercel / Next.js application**
  - Serve the admin UI.
  - Handle Meta OAuth and callback routes.
  - Hold server-side publishing adapters for Instagram and Facebook.
  - Expose authenticated/internal automation endpoints.
  - Integrate generated TikTok posts with the existing scheduler consent UI.

This separates heavy video rendering from request-serving infrastructure while preserving a single product surface.

## End-to-end data flow

```text
New content/blog/<slug>.md committed to main
            |
            v
GitHub Action compares before/after commit
            |
            v
Confirm file is genuinely new + publishable
            |
            v
Create idempotent social automation job
            |
            v
Parse Markdown/frontmatter
            |
            +--> Build Instagram caption
            +--> Build Facebook copy
            +--> Build TikTok caption
            |
            v
Generate shared article social script
            |
            +--> Render Meta-branded 1080x1920 video
            +--> Render TikTok-safe 1080x1920 video
            |
            v
Upload assets to Supabase Storage
            |
            v
Wait until canonical production article URL is reachable
            |
            +--> Publish Instagram Reel automatically
            +--> Publish Facebook Reel automatically
            +--> Create TikTok scheduler item in Ready/Needs Consent state
            |
            v
Persist platform IDs, states, errors, and URLs
```

## Trigger design

### Source trigger

A GitHub Actions workflow listens for pushes to `main` that touch `content/blog/**.md`.

The workflow must compare the base commit and head commit and select only files with Git change status `added`. Modified, renamed, and deleted articles do not trigger automatic reposting.

### Publishability checks

Before creating an automation job, the article must:

- Have valid frontmatter.
- Have a non-empty title.
- Have a canonical slug derived from the filename.
- Not be `_article-template.md` or another reserved template.
- Not be explicitly marked draft/noindex if such metadata exists.
- Pass the existing content parsing rules.

### Duplicate prevention

The idempotency key is based on:

`article_slug + source_commit_sha + automation_version`

A unique database constraint prevents two jobs with the same idempotency key.

A GitHub Action retry, API retry, page refresh, or repeated callback therefore cannot create duplicate platform posts.

## Social content generation

Version one deliberately creates one strong short-form video per platform rather than many derived formats.

### Shared extraction layer

Create a reusable article extraction module that returns a normalized object containing:

- slug
- title
- excerpt
- canonical URL
- category
- topic
- tags
- cover image
- key takeaways
- steps
- common mistakes
- clean prose sentences

This replaces renderer-only article parsing with a reusable domain module.

### Platform-specific copy

The generator creates separate text for each network:

#### Instagram

- Strong opening hook.
- Short educational caption.
- Article CTA.
- Conservative relevant hashtags.

#### Facebook

- Slightly longer explanatory copy.
- Direct article link/CTA where supported.
- No unnecessary hashtag stuffing.

#### TikTok

- Short hook-led caption.
- Relevant hashtags.
- No promotional text burned into the video.

Generation in version one is deterministic and derived from article metadata/prose. It does not require a paid LLM API.

A future AI rewriting provider can be added behind an interface without changing the workflow contracts.

## Remotion design

The existing article renderer becomes a reusable social renderer with platform-aware props.

Suggested input shape:

```ts
type SocialVideoProps = {
  articleSlug: string;
  platformProfile: "META" | "TIKTOK";
  title: string;
  scenes: SocialScene[];
  subtitles: SubtitleCue[];
  audioSrc: string;
  branding: boolean;
  ctaMode: "ARTICLE" | "NONE";
};
```

### Meta render profile

Used for both Instagram Reels and Facebook Reels.

- 1080x1920.
- Existing Web Growth visual identity.
- Web Growth logo/brand permitted.
- Article CTA permitted.
- Captions/subtitles retained.
- Existing TTS voice retained initially.

### TikTok render profile

Uses the same editorial/motion language while removing platform-problematic promotional overlays.

- 1080x1920.
- No Web Growth watermark/logo burned into the video.
- No web URL burned into the video.
- No promotional CTA overlay.
- Captions/subtitles retained.
- Content ends naturally without an onscreen website promotion.

The TikTok caption itself may still contain platform-allowed metadata produced by the scheduler, subject to current TikTok rules.

## Media storage

Rendered files are uploaded to a dedicated Supabase Storage location, for example:

`social-automation/<article-slug>/<job-id>/meta.mp4`

`social-automation/<article-slug>/<job-id>/tiktok.mp4`

The database stores the storage path and media metadata.

Where a platform accepts signed URLs, use short-lived signed URLs. Where an ingestion endpoint requires a publicly fetchable URL for processing, expose only the minimum required asset/path and clean it up after the retention period.

A cleanup job deletes rendered assets after a configurable retention period once all required platform publication flows reach a terminal state. The default retention should be long enough for troubleshooting but short enough to protect the Supabase free storage quota.

## Supabase data model

Prefer dedicated automation tables rather than widening TikTok-specific tables into generic multi-platform objects.

### `social_automation_jobs`

One row per new article automation run.

Core fields:

- `id uuid primary key`
- `article_slug text not null`
- `source_commit_sha text not null`
- `automation_version text not null`
- `idempotency_key text not null unique`
- `status text not null`
- `article_snapshot jsonb not null`
- `meta_media_id uuid null`
- `tiktok_media_id uuid null`
- `started_at timestamptz`
- `completed_at timestamptz`
- `last_error_code text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Suggested statuses:

- `QUEUED`
- `GENERATING`
- `RENDERING`
- `UPLOADING`
- `WAITING_FOR_ARTICLE`
- `PUBLISHING`
- `PARTIALLY_PUBLISHED`
- `COMPLETE`
- `NEEDS_ATTENTION`

### `social_publications`

One row per platform publication for a job.

Core fields:

- `id uuid primary key`
- `job_id uuid not null`
- `platform text not null`
- `status text not null`
- `caption text not null`
- `media_id uuid null`
- `external_publication_id text null`
- `external_url text null`
- `attempt_count integer not null default 0`
- `next_retry_at timestamptz null`
- `last_error_code text null`
- `last_error_message text null`
- `published_at timestamptz null`
- timestamps

Unique constraint:

`unique(job_id, platform)`

Platforms:

- `INSTAGRAM`
- `FACEBOOK`
- `TIKTOK`

Publication statuses should distinguish pending, processing, published, needs-consent, retryable failure, and permanent attention states.

### `social_connections`

Server-only connection metadata for Meta.

Core fields:

- owner/user identifier
- provider (`META`)
- encrypted token payload
- Facebook Page ID/name
- Instagram professional account ID/name
- scopes
- expiry/refresh metadata where applicable
- reconnect-required flag
- timestamps

No raw credentials are returned to client components.

### `social_automation_settings`

Single-owner configuration for version one.

Fields include:

- enabled
- instagram_enabled
- facebook_enabled
- tiktok_generation_enabled
- asset_retention_days
- default timezone
- last updated timestamp

### Existing `media_assets`

Reuse the existing media registry if doing so does not compromise its scheduler invariants. It already supports VIDEO assets and `article_slug`.

If the existing ownership/FK constraints make cross-subsystem use awkward, create a dedicated `social_media_assets` table instead of weakening scheduler constraints.

This decision should be made during implementation after tests capture the current media-asset contract.

## Security model

- RLS enabled on every new public-schema table.
- Server-only automation tables have no permissive browser policies by default.
- Service/secret credentials are never exposed through `NEXT_PUBLIC_*` variables.
- Meta access tokens are encrypted before database persistence.
- Existing TikTok encrypted-token handling remains unchanged.
- Internal GitHub-triggered API calls require a dedicated secret/signature and idempotency key.
- Never trust article/job IDs supplied by a browser without checking owner/admin authorization.
- API error payloads are sanitized before reaching the UI.
- Audit events record important state changes without storing raw tokens or provider responses that contain credentials.

## Meta connection and publishing

### Connection flow

Add a Content Automation connection screen in the authenticated/admin surface.

The owner connects Meta once. The callback resolves:

- Facebook Page available to the token.
- Linked Instagram professional account.
- Required publishing permissions/scopes.

Only IDs, display metadata, scopes, expiry metadata, and encrypted credentials are persisted.

### Instagram

Publishing adapter responsibilities:

1. Validate connection/scopes.
2. Create Reel media container using the generated video URL and caption.
3. Poll/check media processing state where required.
4. Publish the media container.
5. Persist returned platform ID and URL when available.
6. Categorize errors into retryable vs attention-required.

### Facebook

Publishing adapter responsibilities:

1. Validate Page connection/scopes.
2. Create/upload/publish Page Reel using the generated Meta video.
3. Persist returned platform ID and URL when available.
4. Categorize errors into retryable vs attention-required.

Facebook and Instagram publication execute independently.

## TikTok integration

TikTok uses the existing scheduler and Direct Post stack.

The automation creates a video scheduled-post draft from the generated TikTok media/caption and places it in a state such as `NEEDS_APPROVAL` / `NEEDS_CONSENT` according to the current scheduler state model.

The existing composer/approval surface remains responsible for the mandatory final TikTok choices and consent.

The automation must not bypass:

- creator-info queries
- privacy selection
- interaction settings
- required disclosure controls
- creator consent
- production/audit gates
- existing `SELF_ONLY` fail-closed behavior where applicable

The generated TikTok post should be easy to identify as coming from Blog Automation and link back to its article/job in the admin UI.

## Admin UI

Add a Content Automation area in the existing authenticated/admin product.

### Dashboard

Shows:

- article title and slug
- creation time
- overall automation state
- generated video previews/thumbnails where practical
- Instagram state and external link
- Facebook state and external link
- TikTok state with `Publish on TikTok` action when consent is required
- retry/attention state
- sanitized error message

### Connections

Shows:

- Meta connected/disconnected/reconnect-required
- connected Facebook Page
- linked Instagram account
- TikTok connection status via existing scheduler connection data

### Settings

Switches:

- Automation enabled
- Instagram auto-publish
- Facebook auto-publish
- TikTok auto-generate

Disabling one platform does not disable the other platforms.

## Error handling and retries

Every external operation is idempotent where the provider permits it and guarded locally by unique publication state.

Retry policy:

- network errors: retry
- provider 5xx: retry
- temporary processing states: poll/retry
- rate-limit response: retry after provider/backoff window
- invalid/expired authentication: `NEEDS_ATTENTION`
- missing permissions: `NEEDS_ATTENTION`
- invalid media: `NEEDS_ATTENTION`
- duplicate local job: no-op and return existing job

Backoff should be bounded and persisted rather than relying on in-memory timers.

A failed Instagram publication does not block Facebook. A failed Facebook publication does not block TikTok generation. TikTok awaiting consent does not make the article job a failure.

## Article availability gate

Social publication must not begin merely because a Git commit exists.

Before publishing to Meta, check the canonical production article URL until one of these outcomes occurs:

- HTTP success and expected canonical article identity are confirmed: proceed.
- bounded retry window expires: mark `WAITING_FOR_ARTICLE` / `NEEDS_ATTENTION` and allow manual retry.

This prevents social posts linking to a production URL that has not finished deploying.

## Free-tier strategy

The implementation should require no new paid service.

- GitHub Actions standard runners are used for rendering/automation while the repository remains eligible for the applicable free usage model.
- Remotion uses the project's existing package and licensing remains subject to Remotion's current company/team-size terms.
- Supabase remains on the existing Free project. Rendered assets are cleaned up to limit storage/egress growth.
- Existing Edge TTS avoids adding paid voice generation.
- Caption/script generation is deterministic in v1, avoiding paid LLM APIs.
- Facebook/Instagram/TikTok use official platform APIs with no third-party scheduler subscription.
- Vercel continues serving the existing application; the feature does not add Vercel paid compute as a required architecture dependency.

Free tiers and provider terms can change. The application should expose enough storage/job health data to detect when usage approaches practical limits rather than assuming free service is unlimited.

## GitHub Actions design

Create a workflow dedicated to blog social automation.

High-level jobs:

1. checkout with enough history to compute the diff
2. identify added publishable blog files
3. for each added article:
   - run content/social unit tests
   - generate props/audio/subtitles
   - render Meta video
   - render TikTok video
   - upload generated assets through a trusted server endpoint or server credentials
   - start/resume the social publication job
4. archive sanitized logs/artifacts only when useful for troubleshooting

Do not store production tokens in repository files or workflow output.

Secrets required by the workflow must use GitHub Actions secrets or an appropriately scoped trusted callback design.

## Testing strategy

### Unit tests

Add tests for:

- new-vs-modified article detection
- template/draft exclusion
- article normalization
- deterministic caption generation
- platform-specific caption rules
- Meta-vs-TikTok branding rules
- idempotency key generation
- state-machine transitions
- retry classification
- TikTok generated-post integration
- connection-state presentation

### Database verification

After schema work:

- verify constraints and indexes
- verify RLS enabled
- verify browser roles cannot read encrypted connection rows
- verify server path can create/update jobs
- run Supabase database advisors and address relevant findings

### Rendering verification

Render at least one representative article through both profiles.

Verify:

- dimensions are 1080x1920
- video/audio are valid
- subtitles are readable
- Meta video contains intended branding/CTA
- TikTok video contains no prohibited promotional overlay
- output is accepted by existing media validation

### Integration tests

Mock provider APIs for:

- successful Facebook publication
- successful Instagram create/process/publish flow
- Meta expired token
- Meta permission error
- rate limits
- transient 5xx
- TikTok post creation requiring consent

### Repository gates

Before completion run:

- scheduler tests
- new social automation tests
- existing WhatsApp tests affected by build gating
- TypeScript
- scoped/full ESLint as appropriate
- SEO/content validation if touched
- production build
- Supabase advisors

No deployment is performed as part of verification.

## Documentation

Update project documentation with:

- architecture
- connection/setup instructions
- required environment variables/secrets by provider
- GitHub Actions secret requirements
- state definitions
- retry/recovery procedures
- storage cleanup behavior
- TikTok compliance limitation
- how to disable a platform safely

Documentation must never contain real tokens, client secrets, service keys, or encryption keys.

## Implementation sequence

1. Capture current scheduler/media contracts in tests.
2. Extract reusable article normalization module.
3. Add deterministic social-copy generator.
4. Refactor Remotion renderer into Meta and TikTok profiles.
5. Add rendering/profile tests.
6. Add Supabase schema and secure RLS model.
7. Add server-side social automation repository/state machine.
8. Add Meta OAuth/connection storage.
9. Add Instagram publishing adapter.
10. Add Facebook publishing adapter.
11. Add TikTok automation-to-scheduler adapter.
12. Add internal job-start/progress/retry endpoints.
13. Add Content Automation admin UI.
14. Add GitHub Actions new-article trigger and render pipeline.
15. Add cleanup/retention handling.
16. Run full verification and update docs.
17. Stop and request explicit user approval before any deployment or production promotion.

## Out of scope for v1

To keep the first implementation focused:

- automatic social carousels
- multiple videos per article
- paid LLM copy rewriting
- AI image generation
- YouTube Shorts publishing
- LinkedIn publishing
- automatic reposting when an old article changes
- multi-tenant social account management
- analytics aggregation from every social network

The architecture should leave room for these without requiring a rewrite, but they are not implementation requirements for this release.

## Success criteria

The feature is complete when:

1. Adding one valid new blog Markdown article can trigger one idempotent automation job.
2. The article is transformed into a Meta-branded Reel and a TikTok-safe Reel using the existing Remotion/TTS stack.
3. Generated media is persisted and tracked securely.
4. Instagram can publish the generated Reel automatically once its configured account is connected and permitted.
5. Facebook can publish the generated Reel automatically once its configured Page is connected and permitted.
6. TikTok receives an automatically generated scheduler item ready for the required creator consent flow without bypassing existing platform gates.
7. Each platform has independent status, retry, and failure handling.
8. Duplicate workflow execution does not create duplicate social publications.
9. The admin UI clearly shows job and platform states.
10. Tests, build, security checks, and Supabase verification pass.
11. No required paid API/service has been introduced.
12. No production deployment has occurred before explicit user approval.
