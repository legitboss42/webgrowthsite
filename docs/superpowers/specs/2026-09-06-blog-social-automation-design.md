# Blog-to-Social Automation Design

Date: 2026-09-06
Status: Approved in chat, awaiting written-spec review
Branch: `feature/blog-social-automation`

## Goal

Automatically turn every genuinely new Web Growth blog post into platform-ready social content for Facebook, Instagram, and TikTok while preserving platform compliance, keeping required recurring service cost at $0 where practical, reusing the existing Remotion and scheduler systems, and preventing duplicate publication.

The operating model is fully automatic publishing wherever the platform permits it.

## Non-negotiable constraints

1. A genuinely new Markdown article added under `content/blog/` on `main` is the trigger.
2. Editing an existing article must not create a new social post automatically.
3. Facebook and Instagram publication is unattended once the Meta connection is valid.
4. TikTok generation is automatic, but final Direct Post must preserve the platform-required preview, editable metadata, privacy choice, interaction controls, disclosures, and express creator consent.
5. No production deployment occurs until the entire feature is implemented, verified, documented, and the user explicitly approves deployment.
6. No required paid API or recurring service may be introduced for v1.
7. Existing TikTok scheduler functionality is extended, not replaced.
8. Secrets and long-lived platform credentials stay server-side and are encrypted at rest where persisted.
9. New exposed Supabase tables have RLS enabled. Server-only tables have no browser policies unless a real browser use case requires them.
10. Platform failures are isolated. One failed network must not prevent successful publishing to the others.

## Existing assets to reuse

The repository already contains:

- Structured Markdown blog posts under `content/blog/`.
- Frontmatter including title, excerpt, category, topic, tags, cover, key takeaways, common mistakes, steps, and related-guide metadata.
- Remotion 4 with `WebGrowthArticleVideo` and a 1080x1920 vertical renderer.
- Existing Edge TTS narration and subtitle generation.
- TikTok OAuth, token encryption, creator-info checks, Direct Post support, publish-status checks, scheduler approvals, retries, media validation, and worker state.
- Supabase scheduler tables for users, TikTok connections, media assets, scheduled posts, approvals, publish attempts, audit log, and worker health.
- A Vercel-hosted Next.js application and admin surface.

The implementation must reuse these pieces instead of creating parallel systems.

## Architecture decision

### Selected approach: GitHub Actions + Supabase + existing Vercel application

The feature must remain free to operate at current expected volume, so v1 does not require Vercel Workflow, a paid queue, a paid LLM, or a third-party social scheduler.

Responsibilities:

### GitHub / GitHub Actions

- Detect genuinely new blog Markdown files merged to `main`.
- Run deterministic article extraction and social-copy generation.
- Run Remotion/Chromium rendering on standard GitHub-hosted runners.
- Upload generated assets to Supabase Storage through a trusted server path or scoped secret.
- Start/resume the social automation job.

### Supabase

- Persist automation jobs, Meta connection metadata, per-platform publication state, media metadata, retries, and audit information.
- Store rendered social media.
- Continue storing existing scheduler/TikTok state.

### Vercel / Next.js

- Serve the admin UI.
- Handle Meta OAuth and callback routes.
- Provide server-side Instagram and Facebook publishing adapters.
- Expose authenticated/internal automation endpoints.
- Integrate generated TikTok items with the existing scheduler consent UI.

Heavy video rendering therefore stays out of the request-serving path.

## End-to-end flow

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
            +--> Instagram caption
            +--> Facebook copy
            +--> TikTok caption
            |
            v
Generate shared short-form script
            |
            +--> Render Meta-branded 1080x1920 video
            +--> Render TikTok-safe 1080x1920 video
            |
            v
Upload assets to Supabase Storage
            |
            v
Wait for canonical production article URL
            |
            +--> Instagram Reel auto-publish
            +--> Facebook Reel auto-publish
            +--> TikTok scheduled-post draft -> NEEDS_APPROVAL
            |
            v
Persist platform IDs, states, errors, and URLs
```

## Trigger design

A GitHub Actions workflow listens for pushes to `main` affecting `content/blog/**.md`.

It compares the base and head commits and selects only files whose Git status is `added`. Modified, renamed, or deleted articles do not trigger automatic reposting.

### Publishability checks

Before a job is created, the article must:

- have valid frontmatter;
- have a non-empty title;
- derive a valid canonical slug from its filename;
- not be `_article-template.md` or another reserved template;
- not be explicitly draft/noindex when such metadata exists;
- pass existing content parsing rules.

### Duplicate prevention

Idempotency key:

`article_slug + source_commit_sha + automation_version`

`social_automation_jobs.idempotency_key` is unique. A GitHub retry, API retry, callback retry, or browser refresh must return/reuse the existing job rather than create another one.

## Article normalization and copy generation

Create a reusable article-domain module that returns:

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

The existing renderer-only parsing logic should be moved/reused through this module.

### Instagram copy

- Strong opening hook.
- Short educational caption.
- Article CTA.
- Conservative relevant hashtags.

### Facebook copy

- Slightly longer explanatory copy.
- Direct article CTA/link where supported.
- Minimal hashtags.

### TikTok copy

- Short hook-led caption.
- Relevant hashtags.
- No promotional copy burned into the video itself.

V1 generation is deterministic from article metadata/prose. No paid LLM API is required. A future AI writer can be added behind an interface without changing job or publishing contracts.

## Remotion design

The existing article renderer becomes a reusable social renderer with a platform profile.

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

### Meta profile

Used by Instagram and Facebook:

- 1080x1920;
- existing Web Growth visual identity;
- Web Growth branding/logo allowed;
- article CTA allowed;
- subtitles retained;
- existing TTS voice retained initially.

### TikTok profile

Uses the same editorial/motion language but removes promotional overlays that conflict with TikTok Content Posting requirements:

- 1080x1920;
- no Web Growth watermark/logo burned into the video;
- no web URL burned into the video;
- no promotional CTA overlay;
- subtitles retained;
- natural ending rather than onscreen website promotion.

## Media storage and cleanup

Generated paths:

`social-automation/<article-slug>/<job-id>/meta.mp4`

`social-automation/<article-slug>/<job-id>/tiktok.mp4`

Use short-lived signed URLs when supported. If a platform requires a publicly fetchable media URL during ingestion, expose only the required asset and remove public exposure after provider processing is complete.

**Default asset retention is 7 days after all relevant platform publication flows reach a terminal state.** A future settings change may alter this value, but v1 ships with seven days.

Cleanup failure must never delete the database publication record; it moves the asset cleanup state to attention/retry.

## Supabase model

Prefer dedicated social-automation tables rather than mutating TikTok-specific tables into generic multi-platform tables.

### `social_automation_jobs`

One row per new-article automation run.

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
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `last_error_code text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Statuses:

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

One row per platform per job.

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

Constraint:

`unique(job_id, platform)`

Platforms:

- `INSTAGRAM`
- `FACEBOOK`
- `TIKTOK`

Publication states:

- `PENDING`
- `PROCESSING`
- `NEEDS_APPROVAL` for TikTok only
- `PUBLISHED`
- `FAILED_RETRYABLE`
- `NEEDS_ATTENTION`
- `SKIPPED`

### `social_connections`

Server-only Meta connection metadata:

- owner/user identifier;
- provider = `META`;
- encrypted token payload;
- Facebook Page ID/name;
- linked Instagram professional account ID/name;
- granted scopes;
- expiry/refresh metadata where applicable;
- reconnect-required flag;
- timestamps.

Raw credentials are never returned to client components.

### `social_automation_settings`

Single-owner v1 settings:

- enabled
- instagram_enabled
- facebook_enabled
- tiktok_generation_enabled
- asset_retention_days, default 7
- default timezone
- updated_at

### Existing `media_assets`

Reuse it only if current ownership/FK constraints remain valid for automation assets. Tests must first capture the scheduler's current media contract.

If reuse would require weakening scheduler constraints, create `social_media_assets` instead. **Do not weaken the existing scheduler security/ownership model merely to share a table.**

## Security model

- Enable RLS on every new public-schema table.
- Server-only automation/connection tables have no permissive browser policies by default.
- Secret/service credentials never use `NEXT_PUBLIC_*` variables.
- Meta tokens are encrypted before persistence.
- Existing TikTok encrypted-token handling remains unchanged.
- GitHub-triggered internal endpoints require a dedicated shared secret/signature plus idempotency key.
- Browser-provided job/article IDs require owner/admin authorization.
- Provider errors are sanitized before UI display.
- Audit events never persist raw access tokens, client secrets, or provider payloads containing credentials.

## Meta connection

Add a Content Automation connection screen to the authenticated/admin surface.

The owner connects Meta once. The callback resolves and stores:

- selected Facebook Page;
- linked Instagram professional account;
- required publishing scopes/permissions;
- encrypted credential material and expiry metadata.

## Instagram publishing adapter

Responsibilities:

1. Validate connection/scopes.
2. Create the Reel media container using the generated video URL and Instagram caption.
3. Poll/check processing status when required.
4. Publish the container.
5. Persist platform ID and external URL when available.
6. Classify errors as retryable or attention-required.

## Facebook publishing adapter

Responsibilities:

1. Validate Page connection/scopes.
2. Create/upload/publish the Page Reel using the generated Meta video.
3. Persist platform ID and external URL when available.
4. Classify errors as retryable or attention-required.

Facebook and Instagram operations are independent.

## TikTok integration

TikTok uses the existing scheduler and Direct Post stack.

Automation creates a generated video scheduled-post draft and places it into the existing **`NEEDS_APPROVAL`** state. No new `NEEDS_CONSENT` scheduler status is introduced in v1.

The existing composer/approval flow remains responsible for mandatory final TikTok choices and consent.

Automation must not bypass:

- creator-info queries;
- privacy selection;
- interaction settings;
- required disclosures;
- creator consent;
- production/audit gates;
- existing fail-closed `SELF_ONLY` behaviour where applicable.

Generated TikTok posts are marked as originating from Blog Automation and link back to their article/job in the admin surface.

## Admin UI

Add **Content Automation** to the existing authenticated/admin product.

### Dashboard

Show:

- article title and slug;
- creation time;
- overall job state;
- generated media preview/thumbnail where practical;
- Instagram state/external link;
- Facebook state/external link;
- TikTok `NEEDS_APPROVAL` state with route/action into the existing TikTok publish flow;
- retry/attention state;
- sanitized error message.

### Connections

Show:

- Meta connected/disconnected/reconnect-required;
- connected Facebook Page;
- linked Instagram account;
- TikTok connection state from existing scheduler data.

### Settings

Switches:

- Automation enabled
- Instagram auto-publish
- Facebook auto-publish
- TikTok auto-generate

Disabling one network does not disable the others.

## Error handling and retry policy

All external operations are guarded locally against duplicate execution.

- network failures: retry;
- provider 5xx: retry;
- temporary media processing: poll/retry;
- rate limit: retry after provider hint or exponential backoff;
- expired/invalid authentication: `NEEDS_ATTENTION`;
- missing permissions: `NEEDS_ATTENTION`;
- invalid media: `NEEDS_ATTENTION`;
- duplicate local job: no-op and return existing record.

Backoff is persisted, not held in browser/in-memory timers.

A failed Instagram publication does not block Facebook. A failed Facebook publication does not block TikTok generation. TikTok waiting in `NEEDS_APPROVAL` is expected and does not make the article job a failure.

## Article availability gate

Meta publication begins only after the canonical production article is actually reachable.

The runner checks the canonical production URL for **up to 15 minutes**, starting at 30-second intervals and capping the interval at 120 seconds.

Success requires:

- HTTP 2xx; and
- response content/canonical identity matching the expected article slug or canonical URL.

If the 15-minute window expires, the job becomes `NEEDS_ATTENTION` with reason `ARTICLE_NOT_AVAILABLE`. It does not publish to Meta. The admin surface exposes a manual retry once the article is live.

This gate is for availability only; it does not itself deploy or promote Vercel.

## Free-tier strategy

V1 introduces no required paid service:

- standard GitHub Actions runners perform render/automation work while the repo remains eligible for the applicable free model;
- existing Remotion is reused, subject to Remotion's current company/team-size licensing terms;
- existing Supabase Free project stores state/media, with seven-day cleanup limiting storage growth;
- existing Edge TTS avoids paid voice generation;
- deterministic copy generation avoids paid LLM APIs;
- official Facebook, Instagram, and TikTok APIs are used directly;
- Vercel continues serving the existing app but the feature adds no required Vercel paid compute dependency.

Provider free tiers and licence terms can change, so usage/cleanup health must remain visible rather than assuming unlimited free capacity.

## GitHub Actions workflow

Create a workflow dedicated to blog social automation.

High-level steps:

1. checkout with enough history to calculate the before/after diff;
2. identify newly added publishable blog Markdown files;
3. for each new article:
   - run focused content/social tests;
   - create/reuse idempotent automation job;
   - generate normalized article/social props;
   - generate TTS/subtitles;
   - render Meta video;
   - render TikTok video;
   - upload generated media;
   - wait for production article availability;
   - invoke the trusted publication path;
4. retain only sanitized diagnostics/artifacts useful for troubleshooting.

No production token may be written to repository files or action logs.

## Testing strategy

### Unit tests

Cover:

- new-vs-modified article detection;
- template/draft exclusion;
- article normalization;
- deterministic platform captions;
- Meta/TikTok branding rules;
- idempotency generation;
- state transitions;
- retry classification;
- article-availability gate;
- TikTok generated-post integration;
- connection-state presentation.

### Database verification

After schema work:

- verify constraints/indexes;
- verify RLS enabled;
- verify browser roles cannot read encrypted connection rows;
- verify trusted server path can create/update jobs;
- run Supabase database advisors and resolve relevant findings.

### Rendering verification

Render one representative article through both profiles and verify:

- 1080x1920 dimensions;
- valid video/audio;
- readable subtitles;
- Meta branding/CTA present;
- TikTok promotional overlays absent;
- existing media validation accepts output.

### Provider integration tests

Mock:

- successful Instagram create/process/publish;
- successful Facebook Reel publication;
- expired Meta token;
- permission failure;
- rate limit;
- transient 5xx;
- TikTok generated post entering `NEEDS_APPROVAL`.

### Repository gates

Before completion run:

- existing scheduler tests;
- new social automation tests;
- existing WhatsApp build-gate tests where the normal build requires them;
- TypeScript;
- ESLint;
- relevant SEO/content validation if touched;
- production build;
- Supabase advisors.

**No deployment is part of verification.**

## Documentation requirements

Update project documentation with:

- architecture;
- Meta connection/setup;
- environment variables/secrets by provider;
- GitHub Actions secret requirements;
- state definitions;
- retry/recovery procedure;
- seven-day asset cleanup;
- TikTok consent/compliance limitation;
- how to disable each platform safely.

Never document real tokens, client secrets, service keys, or encryption keys.

## Implementation sequence

1. Capture scheduler/media contracts in tests.
2. Extract reusable article normalization.
3. Add deterministic social-copy generation.
4. Refactor Remotion into Meta and TikTok profiles.
5. Add rendering/profile tests.
6. Add Supabase schema and RLS model.
7. Add social automation repository/state machine.
8. Add Meta OAuth/connection storage.
9. Add Instagram publishing adapter.
10. Add Facebook publishing adapter.
11. Add TikTok automation-to-scheduler adapter.
12. Add trusted job-start/progress/retry endpoints.
13. Add Content Automation admin UI.
14. Add GitHub Actions new-article/render pipeline.
15. Add seven-day cleanup handling.
16. Run full verification and update documentation.
17. Stop and request explicit user approval before any deployment or production promotion.

## Out of scope for v1

- automatic carousels;
- multiple videos per article;
- paid LLM rewriting;
- AI image generation;
- YouTube Shorts;
- LinkedIn publishing;
- automatic reposting after article edits;
- multi-tenant social accounts;
- cross-network analytics aggregation.

These may be added later without changing the core article-job-publication boundaries.

## Success criteria

The feature is complete when:

1. One valid new blog Markdown article creates one idempotent automation job.
2. The article becomes a Meta-branded Reel and TikTok-safe Reel through the existing Remotion/TTS stack.
3. Generated media is persisted and tracked securely.
4. Instagram publishes automatically when the configured account is connected and permitted.
5. Facebook publishes automatically when the configured Page is connected and permitted.
6. TikTok receives an automatically generated scheduler item in the existing `NEEDS_APPROVAL` flow without bypassing platform gates.
7. Each platform has independent status, retry, and failure handling.
8. Duplicate workflow execution does not create duplicate publications.
9. The admin UI clearly shows automation and per-platform state.
10. Tests, build, security checks, and Supabase verification pass.
11. No required paid API/service is introduced.
12. No production deployment occurs before explicit user approval.
