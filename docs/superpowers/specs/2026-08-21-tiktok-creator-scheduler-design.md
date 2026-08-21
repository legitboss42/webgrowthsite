# TikTok Creator Scheduler Design

**Date:** 2026-08-21  
**Status:** Approved design  
**Product:** Web Growth TikTok Creator Scheduler  
**Repository:** `webgrowth-info`

## 1. Objective

Build a public, creator-facing TikTok scheduling product inside the existing Web Growth Next.js application. Any creator can sign in with TikTok, upload original videos or photo carousels, approve the exact content and publishing settings, and schedule a Direct Post for automatic submission within a five-minute window.

The Web Growth owner receives the same creator capabilities plus private access to the existing article catalogue and article-to-carousel/video generation workflows. No regular creator may discover or access Web Growth article data or generated article assets.

The product must use TikTok's official Login Kit and Content Posting API. It must remain compliant with TikTok's creator-control, disclosure, media, audit, and unaudited-client requirements. Public visibility remains disabled until TikTok has approved the Direct Post integration.

## 2. Scope

### 2.1 MVP capabilities

- Public registration and sign-in with TikTok.
- A personal creator dashboard.
- TikTok Direct Post connection using `video.publish`.
- Upload of creator-owned videos and photo carousels.
- Owner-only article-to-photo-carousel generation.
- Owner-only article-to-video generation using the existing Remotion workflow.
- Exact content preview and editable metadata before approval.
- TikTok-derived privacy and interaction controls.
- Commercial-content disclosure controls and required declarations.
- Timezone-aware scheduling with five-minute execution precision.
- Durable encrypted TikTok token storage.
- Exactly-once-oriented publishing attempts and durable status history.
- A public-beta limit of three scheduled submissions per creator per rolling 24 hours.
- Owner controls for accounts, jobs, failures, feature gates, and cleanup.

### 2.2 Explicitly outside the MVP

- Paid subscriptions or billing.
- AI caption generation.
- TikTok analytics ingestion.
- Team workspaces or multi-member organizations.
- A full video editor.
- Cross-platform social publishing.
- Guaranteed public visibility time.
- Public Direct Post before TikTok audit approval.
- Browser automation, password storage, simulated TikTok clicks, or unofficial APIs.

## 3. Platform constraints

TikTok Login Kit provides authentication through OAuth 2.0. The baseline `user.info.basic` scope identifies the creator and supplies basic profile information. Direct Post requires the separately approved and user-authorized `video.publish` scope.

The application must tolerate partial authorization. A creator who grants login access but declines publishing access may still sign in and use non-publishing parts of the dashboard. Scheduling remains blocked until a valid publishing connection exists.

Before every Direct Post approval, the product must show the creator a preview, editable metadata, current TikTok privacy options, applicable interaction controls, commercial-content disclosures, and TikTok's required declaration. The application must capture explicit consent before scheduling. Scheduling that already-approved snapshot for later execution preserves creator control without requiring the creator to return at execution time.

Unaudited Direct Post clients are restricted to TikTok-permitted private visibility. The application must therefore enforce `SELF_ONLY` or the currently permitted unaudited visibility and keep public posting behind a server-side feature gate until audit approval is confirmed.

## 4. Roles and authorization

### 4.1 Creator

A creator can:

- Sign in and sign out with TikTok.
- Connect or disconnect Direct Post authorization.
- Upload and manage only their own media.
- Create, approve, schedule, cancel, and inspect only their own posts.
- View only their own publishing history and errors.
- Delete their own application data subject to legal and operational retention requirements.

### 4.2 Owner

The owner can perform all creator operations and can additionally:

- Access the private Web Growth article catalogue.
- Generate article-based photo carousels and videos.
- Inspect platform-level operational status.
- Suspend or restore creator accounts.
- Cancel pending abusive or unsafe schedules.
- Review publishing failures and ambiguous attempts without viewing plaintext tokens.
- Configure owner-specific posting limits through server configuration.

Owner authorization requires both a current authenticated TikTok identity and membership in the server-side `OWNER_TIKTOK_OPEN_IDS` allowlist. A mutable database role alone never grants owner access.

### 4.3 Article isolation

Article protection is enforced on the server and in database/storage authorization, not only in the interface. Regular creators must not receive article titles, slugs, catalogue metadata, generation endpoints, previews, or generated assets. Owner-only endpoints re-check the current `open_id` allowlist on every request.

## 5. Product routes and experience

### 5.1 Public and authenticated routes

- `/scheduler`: public product landing page.
- `/scheduler/sign-in`: TikTok Login Kit entry.
- `/scheduler/dashboard`: personal post and status overview.
- `/scheduler/new`: creator upload flow and owner-only article source selection.
- `/scheduler/posts/[id]`: preview, approval, schedule, and status detail.
- `/scheduler/settings`: TikTok connection, session, and data controls.
- `/scheduler/admin`: owner-only operational dashboard.

The existing `/connect/tiktok` route remains temporarily available for migration and controlled testing. It may be removed or redirected only after the new workflow has passed end-to-end verification.

### 5.2 Creator flow

1. Select **Continue with TikTok**.
2. Complete Login Kit authorization for `user.info.basic`.
3. Enter the personal dashboard.
4. Connect `video.publish` if publishing permission is not already active.
5. Upload a video or photo carousel.
6. Preview the exact content and edit the caption.
7. Retrieve the creator's current TikTok publishing capabilities.
8. Manually choose privacy and applicable interaction settings.
9. Configure own-brand or branded-content disclosures.
10. Accept TikTok's required publishing and music-use declaration.
11. Select a date, time, and IANA timezone.
12. Select **Approve and schedule**.
13. Track the submission through terminal success or actionable failure.

### 5.3 Owner flow

The owner may choose either an upload or a Web Growth article as the source. Article generation reuses the existing article parsing, photo-slide, video-script, Remotion, and media-serving foundations. The generated result is treated like any other post: the owner must preview it, edit metadata if desired, select current settings, disclose commercial content, and explicitly approve the scheduled snapshot.

### 5.4 AdSense and product claims

Authentication, upload, approval, account, and operational screens remain ad-free. The public landing page may describe the free beta but must not claim that public automatic posting is available before TikTok audit approval. Google policy requirements and product best practices must remain clearly distinguished in public copy.

## 6. Architecture

Use the existing Next.js/Vercel application for the interface, session handling, TikTok API client, upload authorization, and protected worker endpoints. Use the linked Web Growth Supabase project for Postgres persistence and private media storage. Use Vercel Cron to invoke a protected worker every five minutes.

This approach minimizes new vendors, keeps TikTok logic in the existing TypeScript codebase, supports durable database locking, and fits the approved five-minute publishing window.

### 6.1 High-level data flow

```text
TikTok Login Kit
    -> creator session and encrypted token record
    -> creator upload or owner-only article generation
    -> exact preview and metadata controls
    -> immutable approval snapshot
    -> UTC schedule
    -> five-minute worker claims due job
    -> refresh token and query creator info
    -> validate current settings and media
    -> one durable TikTok Direct Post attempt
    -> TikTok publish_id
    -> webhook or controlled polling
    -> published or actionable terminal state
```

## 7. Data model

The final migration may refine names while preserving these responsibilities.

### 7.1 `scheduler_users`

- Stable TikTok `open_id` identity.
- Display name and avatar metadata.
- Active or suspended status.
- Terms/privacy version and acceptance timestamp.
- Created, updated, and last-login timestamps.

### 7.2 `tiktok_connections`

- Owning scheduler user.
- Encrypted access and refresh token payloads.
- Granted scopes.
- Access and refresh expirations.
- Connection, refresh, revocation, and reconnect state.
- No plaintext token in logs, client responses, or audit metadata.

### 7.3 `media_assets`

- Owning scheduler user.
- Private storage object path.
- Video or photo media type.
- MIME type, byte size, checksum, dimensions, and duration where applicable.
- Validation and retention state.
- Optional owner-only article provenance that is never returned to creators.

### 7.4 `scheduled_posts`

- Owning scheduler user.
- Video or photo-carousel content type.
- Caption and title metadata.
- Requested publish time stored in UTC.
- Original IANA timezone for display.
- Current workflow state.
- Current approval identifier.
- Worker claim metadata and bounded attempt counters.

### 7.5 `post_media`

- Ordered mapping from a scheduled post to its media assets.
- Cover-photo or video-cover metadata where supported.

### 7.6 `post_approvals`

- Immutable snapshot of media checksums and order.
- Caption and title.
- TikTok creator identity.
- Privacy and interaction selections.
- Commercial-content disclosure selections.
- Required declaration version and acceptance.
- Approval and invalidation timestamps.

### 7.7 `publish_attempts`

- Scheduled post and approval snapshot.
- Unique request fingerprint.
- Worker claim and attempt number.
- TikTok `publish_id` when received.
- Classified result and sanitized error information.
- Submission, processing, and completion timestamps.

### 7.8 `scheduler_audit_log`

- Security and operational events.
- Actor, target, event type, timestamp, and sanitized metadata.
- No access tokens, refresh tokens, secrets, or unnecessary personal data.

## 8. Authentication, sessions, and token security

TikTok Login Kit is the sole MVP sign-in method. OAuth state validation is mandatory, and PKCE is used where supported by the selected TikTok web flow. The callback exchanges authorization codes only on the server.

TikTok tokens move from encrypted browser cookies to durable encrypted database records. A dedicated `TIKTOK_TOKEN_ENCRYPTION_KEY` lives only in encrypted Vercel environment configuration. Tokens are decrypted only inside server-side connection refresh and publishing operations.

The browser receives an opaque, HTTP-only, secure, same-site application session cookie. Sessions rotate after authentication and expire after a bounded lifetime. Sign-out terminates the application session. Disconnecting TikTok removes or invalidates the stored publishing connection and cancels pending schedules, but it does not delete posts already published on TikTok.

CSRF defenses protect state-changing routes. Per-IP and per-user rate limits protect login, callback, upload, approval, scheduling, and status operations.

## 9. Row-level and storage security

Every user-owned record includes a scheduler user identifier. Row Level Security denies cross-user access by default. Server endpoints translate the signed application session into scoped operations and independently verify record ownership before each mutation.

Creator media uses a private Supabase Storage bucket and user-scoped object paths. Upload initiation requires an authenticated, active user. Upload finalization validates the stored object rather than trusting browser-provided metadata.

TikTok `PULL_FROM_URL` media is exposed only through a controlled, short-lived retrieval path under a TikTok-verified Web Growth domain or URL prefix. The retrieval route validates the publishing attempt and expiration before serving media. The design must accommodate TikTok's download timing so URLs remain valid long enough for processing without becoming permanent public media URLs.

## 10. Media rules and retention

Initial application limits are:

- Video: MP4, QuickTime, or WebM; maximum 500 MB per file.
- Photos: JPEG, PNG, or WebP; maximum 20 MB per image.
- Photo carousel: no more than TikTok's currently supported maximum, initially capped at 35 images.
- MIME sniffing, decoding, dimensions, duration, and checksum validation are mandatory.

Default retention is:

- Abandoned, unapproved uploads: delete after 24 hours.
- Failed or cancelled post media: delete after 7 days.
- Successfully published media: delete after 30 days.
- Approval and audit metadata: retained longer without retaining media unnecessarily.

The user interface and privacy policy disclose retention behavior. Cleanup runs as an idempotent scheduled operation and never deletes media referenced by an active publishing attempt.

## 11. Approval and scheduling semantics

An approval is an immutable snapshot of the exact content and settings the creator authorized. Changing media, media order, caption, TikTok account, privacy, interactions, disclosure, or required declarations invalidates the approval and returns the post to `NEEDS_APPROVAL`.

An unchanged approved post may be rescheduled without repeating content approval, provided the connection is valid and TikTok's current creator capabilities still support the selected settings at execution time.

The application stores the requested time in UTC and the original IANA timezone. A post becomes due at the selected instant. The worker runs every five minutes, so normal submission occurs between the scheduled time and approximately five minutes afterward. The interface describes this as a submission window and does not promise exact TikTok visibility time.

## 12. Publishing worker

For each invocation, the protected worker:

1. Selects a bounded batch of due approved jobs.
2. Atomically claims jobs through database locking.
3. Verifies active account status and the three-post rolling daily limit.
4. Refreshes the TikTok access token when required.
5. Queries current TikTok creator information.
6. Confirms the approved privacy and interaction selections remain available.
7. Validates media and TikTok URL-property eligibility.
8. Creates a durable attempt and unique request fingerprint.
9. Submits exactly one Direct Post request.
10. Stores the TikTok `publish_id` before releasing the claim.
11. Moves the post to processing or a classified actionable state.

Photo posts use the official content initialization endpoint with `DIRECT_POST`. Video posts use the official Direct Post video endpoint. Server-hosted media uses `PULL_FROM_URL` when required by TikTok's current transfer guidance.

## 13. Workflow states

- `DRAFT`: editable content without a valid approval.
- `NEEDS_CONNECTION`: publishing authorization is absent or expired.
- `NEEDS_APPROVAL`: creator review or renewed consent is required.
- `SCHEDULED`: approved and awaiting its due window.
- `CLAIMED`: atomically reserved by one worker.
- `SUBMITTING`: Direct Post request is in progress.
- `PROCESSING`: TikTok returned a `publish_id` and is processing or moderating.
- `PUBLISHED`: TikTok reports successful publication.
- `FAILED_RETRYABLE`: a conclusively safe pre-submission retry is pending.
- `NEEDS_ATTENTION`: terminal or ambiguous failure requiring creator or owner action.
- `CANCELLED`: cancelled before submission began.

The dashboard distinguishes scheduler submission time from TikTok public-availability time.

## 14. Status, retries, and duplicate prevention

TikTok Content Posting webhooks become the primary terminal status signal if approved and configured. Controlled status polling remains a fallback.

Retries follow these rules:

- Conclusively safe pre-submission failures may use bounded exponential backoff.
- Rate limits honor TikTok's limits and retry guidance.
- Revoked or expired authorization moves the post to `NEEDS_CONNECTION`.
- Unavailable privacy or interaction settings move it to `NEEDS_APPROVAL`.
- Invalid media moves it to `NEEDS_ATTENTION`.
- After TikTok returns a `publish_id`, the system polls that identifier instead of creating another post.
- An ambiguous network failure after possible submission is held for reconciliation or operator review, not blindly retried.
- Database uniqueness constraints prevent more than one successful attempt for an approval snapshot.

A creator may cancel only while a post remains safely pre-submission. Once submission starts, the interface explains that cancellation cannot guarantee removal from TikTok.

## 15. Abuse protection and beta limits

- Public TikTok sign-in; no anonymous publishing.
- Three scheduled submissions per creator per rolling 24 hours.
- Configurable higher internal owner limit.
- Per-user storage quota and upload rate limits.
- Media validation and cleanup of abandoned uploads.
- Owner suspension and pending-job cancellation controls.
- Suspended users cannot upload, approve, reconnect, or publish.
- No access to another user's media, tokens, schedules, or history.

The beta is publicly accessible and intended for real creators, not represented as a private internal upload tool.

## 16. Administration and observability

The owner dashboard shows:

- Due and overdue jobs.
- Failed and ambiguous publishing attempts.
- Connections requiring reauthorization.
- Per-user rolling usage.
- Media awaiting cleanup.
- Worker heartbeat and last successful cycle.
- TikTok rate-limit responses.
- Direct Post and public-visibility feature-gate status.

Logs use request and attempt identifiers, not secrets. Critical failures fail closed: missing connection, invalid approval, unavailable settings, incomplete disclosure, ambiguous prior attempt, disabled feature gate, or invalid media means no post.

## 17. Environment configuration

Expected server-side variables include:

- `OWNER_TIKTOK_OPEN_IDS`
- `TIKTOK_TOKEN_ENCRYPTION_KEY`
- `SCHEDULER_SESSION_SECRET`
- `SCHEDULER_CRON_SECRET`
- Existing TikTok client credentials and redirect URI
- Required Supabase server and storage credentials
- `TIKTOK_DIRECT_POST_ENABLED`
- `TIKTOK_PUBLIC_POSTING_ENABLED`

Production, Preview, and Development values are managed separately through Vercel. Supabase database migrations and any Edge Function secrets are managed through the linked Supabase project. Real values never enter Git, documentation, client bundles, screenshots, or command output.

## 18. Testing strategy

Focused automated tests cover:

- OAuth state validation and callbacks.
- Session creation, rotation, expiration, and logout.
- Owner allowlist and article isolation.
- Cross-user access denial.
- Token encryption, refresh, and refresh-token rotation.
- Upload type, size, count, checksum, and duration validation.
- Three-post rolling daily limits.
- Approval creation and invalidation.
- UTC and timezone conversion, including daylight-saving transitions.
- Concurrent atomic job claiming.
- Duplicate-attempt prevention.
- Retryable, terminal, and ambiguous failure classification.
- Creator capability changes.
- Commercial-content disclosure rules.
- Disconnect, cancellation, suspension, and retention cleanup.

Repository verification includes TypeScript, ESLint, focused tests, a production build, migration comparison, `git diff --check`, and browser review of all critical flows.

## 19. Migration and rollback safety

Database changes are additive: new scheduler tables, constraints, indexes, RLS policies, storage bucket configuration, and storage policies. Existing WhatsApp CRM tables and their migration history remain untouched.

Immediately before applying a migration, local and remote migration histories must still match. After application, schema, constraints, indexes, RLS behavior, and storage policies are verified remotely.

Operational rollback disables cron execution and both publishing feature gates first. Initial rollback procedures do not include destructive data-removal migrations.

## 20. Rollout

1. Apply and verify the additive Supabase migration.
2. Add Vercel environment variables with publishing gates disabled.
3. Deploy authentication, dashboard, uploads, and scheduling controls as a free public beta.
4. Sign in with the owner's TikTok account and securely add its `open_id` to the owner allowlist.
5. Verify article isolation through server, database, and browser tests.
6. Test upload, preview, approval, and scheduling without Direct Post enabled.
7. Enable unaudited Direct Post for owner `SELF_ONLY` testing.
8. Verify photo and video submission, processing, status, and retention end to end.
9. Admit real public-beta creators within TikTok's unaudited limits.
10. Assemble the required product walkthrough and audit evidence.
11. Submit the TikTok Direct Post integration for audit.
12. Enable public visibility only after confirmed TikTok approval.

## 21. Completion criteria

The MVP is complete only when:

- Any creator can sign in with TikTok.
- Creators can upload validated videos and photo carousels.
- Only the allowlisted owner can access Web Growth articles and article generation.
- An approved post is submitted automatically within the five-minute window.
- Duplicate execution tests result in only one TikTok submission.
- Cross-user data and media access is denied.
- The dashboard reports processing and failure states accurately.
- Unapproved Direct Post tests remain private.
- Public visibility remains locked until confirmed TikTok approval.
- Supabase migration, Vercel configuration, automated checks, production build, and browser verification pass.

