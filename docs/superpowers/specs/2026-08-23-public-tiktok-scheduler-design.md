# Public TikTok Scheduler Production Design

**Date:** 2026-08-23  
**Status:** Approved design  
**Product:** Web Growth TikTok Scheduler  
**Repository:** `webgrowth-info`  
**Extends:** `docs/superpowers/specs/2026-08-21-tiktok-creator-scheduler-design.md`

## 1. Objective

Turn the proven owner-operated TikTok scheduler into an open, self-service public beta. Any eligible creator will sign in only with TikTok, accept the scheduler terms, upload original photos or videos, approve the exact TikTok settings, and schedule automatic Direct Posts from a private personal workspace.

Public enrollment requires no owner approval after TikTok approves the production application. Before that approval, the public scheduler must remain in a truthful pre-launch state because Sandbox credentials only authorize configured target users. Public TikTok visibility must remain fail-closed until TikTok explicitly approves the production application.

The owner retains private article-generation tools and platform operations. Regular creators must never discover or access Web Growth articles, article-derived assets, other users' content, tokens, or operational data.

## 2. Product decisions

- Launch model: free limited beta.
- Admission after production approval: open self-service enrollment with no manual approval.
- Authentication: TikTok Login Kit only; no email/password accounts.
- Day-one media: photos and videos.
- Video processing: validate and clearly reject incompatible files; no automatic transcoding in the beta.
- Daily quota: three newly scheduled posts per user per rolling 24 hours.
- Active queue quota: twenty future posts per user.
- Media per post: ten files maximum.
- Original media retention: seven days after publication, cancellation, or terminal failure.
- Temporary publishing copies: remove after terminal TikTok processing.
- Owner article catalogue and article generation: strictly owner-only.
- Billing, teams, cross-platform publishing, AI generation, and video transcoding: outside this beta.

## 3. Delivery boundaries

This work has four separate completion gates:

1. **Product readiness:** code, database, security, legal UX, tests, and production deployment are complete.
2. **Sandbox evidence:** valid photo and video Direct Posts complete privately and their terminal states are recorded.
3. **TikTok approval:** TikTok approves the production application, Direct Post use, scopes, URLs, and review evidence.
4. **Public launch:** production credentials are active, public visibility is enabled through the server gate, an owner smoke test passes, and self-service enrollment opens.

No earlier gate may be described as satisfying a later gate. In particular, deployed code does not mean TikTok has approved the app, and TikTok Sandbox success does not mean general creators can authorize.

## 4. Recommended architecture

Harden the existing `/scheduler/` product in the current Next.js application. Preserve the existing TikTok OAuth, signed scheduler sessions, Supabase persistence, encrypted per-user token records, user-scoped media, immutable approvals, atomic worker claiming, publishing attempts, verified media-delivery path, and Supabase Cron execution.

Do not rebuild the scheduler as a separate application and do not replace the official TikTok integration with a third-party social publisher. The existing system has already produced a terminal private `PUBLISHED` result and is the lowest-risk foundation.

### 4.1 High-level flow

```text
Public scheduler page
  -> Continue with TikTok
  -> TikTok Login Kit identity
  -> terms and privacy acceptance
  -> private user dashboard
  -> validated photo or video upload
  -> editable title and caption
  -> current TikTok creator settings
  -> explicit disclosures and publishing consent
  -> immutable approval snapshot
  -> timezone-aware schedule
  -> atomic worker claim
  -> verified temporary media URL
  -> TikTok Direct Post
  -> durable publish_id
  -> status reconciliation
  -> Published or actionable Needs attention
  -> media cleanup
```

## 5. Access, identity, and rollout states

### 5.1 Pre-approval state

- `/scheduler/` is publicly accessible and explains the product accurately.
- General visitors cannot start an OAuth flow that uses Sandbox credentials.
- The interface explains that public creator access opens after TikTok approval.
- Configured Sandbox target users retain access for review evidence.
- `TIKTOK_PUBLIC_POSTING_ENABLED` remains `false`.
- The site does not claim public automatic posting is available.

### 5.2 Post-approval state

- Any eligible TikTok user can select **Continue with TikTok**.
- A successful TikTok login creates or updates the scheduler user automatically.
- No manual owner approval, invite code, email, password, or separate verification is required.
- First use requires acceptance of the current Scheduler Terms, Privacy Policy, content responsibility rules, media-retention policy, and applicable TikTok disclosures.
- A suspended scheduler user may authenticate for account support but cannot upload, approve, schedule, reconnect, or publish.

### 5.3 Sessions and ownership

- The browser receives an opaque, signed, HTTP-only, secure, same-site session cookie.
- Sessions expire at a bounded signed timestamp and rotate after OAuth authentication.
- Every post, media asset, approval, attempt, connection, quota lookup, and destructive operation is scoped to the authenticated `scheduler_users.id`.
- Owner access additionally requires the authenticated TikTok `open_id` to match `OWNER_TIKTOK_OPEN_IDS` exactly.
- Database flags alone never grant owner privileges.

## 6. Public routes and user experience

- `/scheduler/`: public product page and rollout-state messaging.
- `/scheduler/sign-in/`: TikTok Login Kit entry or approval-pending explanation.
- `/scheduler/terms/`: scheduler-specific terms, content responsibility, acceptable use, and retention summary.
- `/scheduler/dashboard/`: authenticated personal queue and history.
- `/scheduler/new/`: personal upload flow; owner-only article source remains server-gated.
- `/scheduler/posts/[id]/`: preview, approval, schedule, retry eligibility, and status.
- `/scheduler/settings/`: TikTok connection, session, data export summary, disconnect, and account deletion.
- `/scheduler/admin/`: owner-only operational controls.

### 6.1 Creator flow

1. Select **Continue with TikTok**.
2. Complete TikTok authorization.
3. Accept the current scheduler legal and content-responsibility terms when required.
4. Enter a private dashboard.
5. Upload compliant creator-owned photos or videos.
6. Edit the title and caption.
7. Load current creator information from TikTok.
8. Select only a visibility option returned for that TikTok account.
9. Select supported interaction controls.
10. Complete commercial-content, own-brand, music, and publishing declarations.
11. Approve the exact immutable snapshot.
12. Choose a future instant and IANA timezone.
13. Schedule the post.
14. Observe status changes without reloading.
15. Receive a status-specific success or corrective failure message.

### 6.2 Status language

The interface must render the durable status, not infer success from `scheduled_for` alone:

- `DRAFT`: Draft not ready for approval.
- `NEEDS_CONNECTION`: Reconnect TikTok before publishing.
- `NEEDS_APPROVAL`: Review and approve the current content.
- `SCHEDULED`: Scheduled for the displayed local time.
- `CLAIMED` or `SUBMITTING`: Sending to TikTok.
- `PROCESSING`: TikTok is processing the post.
- `PUBLISHED`: Published successfully.
- `FAILED_RETRYABLE`: A safe automatic retry is pending.
- `NEEDS_ATTENTION`: Publishing failed; show a sanitized corrective action.
- `CANCELLED`: Cancelled before submission.

The current generic “Post scheduled successfully” card must not appear for `PROCESSING`, `PUBLISHED`, or `NEEDS_ATTENTION` states.

## 7. TikTok visibility and consent

- Before production approval, the server forces `SELF_ONLY` even if stale client data requests another value.
- After approval, the creator endpoint returns only the visibility levels supplied by TikTok for the current account.
- The user must manually select a visibility level; the scheduler does not default it silently.
- The worker queries creator information again before submission and fails closed if approved settings are no longer available.
- Changes to media, order, title, caption, account, visibility, interactions, disclosures, or declaration version invalidate the approval.
- TikTok submission occurs only after explicit user approval and scheduling of that unchanged snapshot.

## 8. Photo handling

- Accepted source formats: JPEG and WebP. PNG may be accepted at upload only when it is decoded and normalized to JPEG before TikTok delivery.
- Maximum source size: 20 MB per image.
- Maximum images per post: ten for the beta even if TikTok permits more.
- Decode the source and reject corrupt or disguised files.
- Correct orientation from metadata.
- Preserve aspect ratio.
- Resize within 1080 by 1080 without enlargement.
- Deliver a valid JPEG with an accurate `Content-Type` and `Content-Length`.
- The verified `/tiktok-media/` route must return the media directly without redirecting.

## 9. Video handling

Videos are available on day one but are not automatically transcoded.

- Accepted containers: MP4, MOV, and WebM.
- Accepted codecs must match TikTok's current documented supported codecs.
- Minimum dimensions: 360 by 360.
- Maximum dimensions: 4096 by 4096.
- Frame rate: 23 through 60 FPS.
- Duration: no greater than the lesser of TikTok's endpoint limit and the connected creator's reported maximum.
- Maximum beta file size: 500 MB even if TikTok permits a larger transfer.
- Validation inspects the stored object, not browser-reported MIME or metadata.
- Rejection messages identify the failed property and allowed range.
- The upload cannot become `VALID` until container, codec, dimensions, frame rate, duration, MIME, and byte size pass.

Automatic video transcoding is deferred to a future paid tier because it requires a separate media-processing cost and operational model.

## 10. Quotas and abuse controls

### 10.1 Per-user limits

- Three newly scheduled submissions per rolling 24 hours.
- Twenty posts in active future states per user.
- Ten media assets per post.
- Explicit upload byte and count limits before storage work begins.
- Per-IP and per-user limits for OAuth initiation, callback failures, upload initiation, upload finalization, post creation, approval, scheduling, retry requests, and account deletion.

### 10.2 Platform controls

- Worker claims a bounded global batch using `FOR UPDATE SKIP LOCKED` semantics.
- Per-user fairness prevents one creator from consuming the full worker batch.
- One failed post cannot terminate processing for other claimed posts.
- A global emergency gate can stop new scheduling independently from stopping due-job publication.
- A separate emergency publishing gate can stop all Direct Post calls while preserving data for diagnosis.
- The owner can suspend abusive accounts and cancel only safely pre-submission jobs.
- No anonymous publishing is permitted.

## 11. Media storage and retention

- Originals use private, user-scoped storage paths with unguessable asset identifiers.
- Temporary publishing copies use unguessable attempt-scoped paths under the TikTok-verified Web Growth prefix.
- Active scheduled media remains available until the post reaches a terminal state.
- Temporary publishing copies are removed after terminal TikTok processing.
- Original media is removed seven days after publication, cancellation, or terminal failure.
- Abandoned, unapproved uploads are removed after 24 hours.
- Cleanup is idempotent and must not remove media referenced by an active attempt.
- Audit metadata does not retain media contents, tokens, secrets, or unnecessary personal data.
- Retention behavior is disclosed before the user's first upload.

## 12. Durable attempts, retries, and duplicate prevention

- Every TikTok submission has a durable `publish_attempts` row created before the API mutation.
- The attempt records the immutable approval fingerprint and an explicit attempt number.
- TikTok `publish_id` is persisted immediately after a successful initialization response.
- A recorded `publish_id` is reconciled; it is never submitted again.
- Conclusively safe failures before TikTok acceptance may retry with bounded exponential backoff.
- Ambiguous failures after possible acceptance move to operator review or reconciliation, not blind retry.
- A creator-initiated retry after a terminal TikTok failure creates a new attempt against the same unchanged approval without cloning the visible post or erasing history.
- Database constraints prevent two live or successful submissions for the same attempt number.
- Retry controls are available only when policy classifies the prior result as safe.

## 13. Data model changes

Use additive migrations. Preserve existing migration history.

### 13.1 `scheduler_users`

Add or enforce:

- current terms version and acceptance timestamp;
- current privacy notice version and acceptance timestamp;
- suspension reason and timestamp;
- deletion-request state and timestamp;
- last activity timestamp.

### 13.2 `scheduled_posts`

Add or enforce:

- explicit retry eligibility and next retry timestamp;
- attempt sequence counter;
- terminal timestamp used for original-media retention;
- user-visible sanitized failure classification;
- active-queue indexes supporting the twenty-post quota.

### 13.3 `publish_attempts`

Replace single-attempt assumptions with numbered attempts while retaining each prior TikTok `publish_id`, result, and sanitized error. Uniqueness must prevent duplicate execution of one numbered attempt without preventing a safe new attempt after a terminal failure.

### 13.4 `media_assets`

Store validated dimensions, frame rate, codec, duration, normalized photo metadata, validation version, and deletion eligibility.

### 13.5 Operational tables

Add focused records for:

- worker heartbeat and last successful cycle;
- rate-limit counters if the existing in-memory limiter cannot provide multi-instance enforcement;
- account deletion jobs;
- optional public-launch configuration when environment gates alone are insufficient.

## 14. Legal, privacy, and account controls

The scheduler requires product-specific terms and disclosures covering:

- TikTok-only authentication;
- encrypted access and refresh tokens;
- creator-owned media and captions;
- user responsibility for rights, accuracy, disclosures, and platform compliance;
- commercial-content and music declarations;
- storage locations and subprocessors;
- quota and suspension rules;
- seven-day terminal media retention;
- account disconnect and deletion consequences;
- support contact and complaint handling.

Users can disconnect TikTok without deleting their scheduler history. Disconnect removes the publishing connection and cancels future schedules. Account deletion is a separate confirmed workflow that removes the connection, future jobs, user-owned posts, approvals, attempts, and media, subject only to documented minimal legal or security retention.

Authentication, upload, account, approval, and dashboard screens remain ad-free. Any AdSense placement on the public landing page must remain content-first and must not imply Google endorsement of the scheduler.

## 15. Owner operations and observability

The owner dashboard provides:

- total and active users;
- connected, reconnect-required, and suspended accounts;
- scheduled, overdue, submitting, processing, published, failed, and cancelled counts;
- worker heartbeat and last successful cron response;
- storage awaiting cleanup and overdue deletion counts;
- TikTok rate-limit and classified failure summaries;
- per-user quota usage without exposing tokens;
- safe account suspension and restoration;
- global scheduling and publishing emergency gates;
- retry eligibility inspection without a blind retry control.

The beta does not grant the owner a general interface for browsing another creator's private media. Any later support-access capability requires a separate design with explicit authorization and audit controls.

## 16. TikTok production review package

The production application must contain accurate and consistent configuration:

- app name, category, icon, and description;
- Web Growth website, Scheduler Terms, Privacy Policy, and support URLs;
- verified redirect URI;
- verified `/tiktok-media/` URL prefix;
- Direct Post enabled;
- only required scopes: `user.info.basic`, `video.publish`, and `video.upload` only if the draft-upload product remains user-visible;
- no stale or unused profile/statistics scopes;
- production credentials stored only in encrypted Vercel configuration.

The demonstration video must show the real scheduler workflow:

1. TikTok sign-in.
2. Terms acceptance.
3. Private dashboard.
4. Valid photo upload and preview.
5. Editable title and caption.
6. Creator information and TikTok-returned settings.
7. Visibility, interactions, disclosure, and music declarations.
8. Explicit approval and scheduling.
9. Automatic worker execution.
10. Durable processing and published status.
11. Valid video upload and validation evidence.
12. Disconnect and account-data controls.

The current unrelated website demonstration video must be replaced. Review copy must explain token encryption, consent timing, media transfer, retention, duplicate prevention, and user control without claiming public posting is already approved.

## 17. Feature gates and configuration

Required fail-closed gates include:

- `TIKTOK_DIRECT_POST_ENABLED`: permits Direct Post initialization.
- `TIKTOK_PUBLIC_POSTING_ENABLED`: permits non-`SELF_ONLY` values after TikTok approval.
- `SCHEDULER_PUBLIC_ENROLLMENT_ENABLED`: permits general users to start TikTok OAuth after production approval.
- `SCHEDULER_NEW_SCHEDULING_ENABLED`: emergency control for new schedules.
- `SCHEDULER_VIDEO_ENABLED`: remains false until private video end-to-end verification passes.

Production, Preview, and Development values remain separate. Secrets must never appear in Git, client bundles, logs, screenshots, documentation, or user-visible diagnostics.

## 18. Testing strategy

### 18.1 Automated tests

- OAuth state, callback relay, session rotation, expiration, and sign-out.
- Pre-approval enrollment gate and post-approval automatic account creation.
- Terms and privacy-version enforcement.
- Exact owner allowlist and article isolation.
- Cross-user database, route, post, media, approval, and attempt denial.
- Photo decoding, format, size, orientation, and 1080p normalization.
- Video container, codec, dimensions, frame rate, duration, MIME, and size validation.
- Three-per-day and twenty-active-post quotas under concurrency.
- Ten-media limit.
- Immutable approval invalidation.
- Atomic due-job claiming and per-user fairness.
- Numbered safe retry attempts.
- Recorded publish-ID duplicate prevention.
- TikTok terminal state mapping and sanitized errors.
- Token refresh, revocation, reconnect, disconnect, suspension, and deletion.
- Temporary and original-media retention boundaries.
- Status-specific user copy.
- Emergency scheduling and publishing gates.

### 18.2 Repository and production verification

- Focused scheduler tests.
- TypeScript.
- ESLint for changed files and full lint where feasible.
- Production build.
- Migration history comparison before remote application.
- Remote schema, indexes, constraints, RLS, storage, and cron verification.
- `git diff --check`.
- Desktop and narrow rendered checks.
- No-reload status transition checks.
- Direct retrieval tests for staged photo and video media.

### 18.3 External gates

- Private Sandbox photo reaches terminal `PUBLISHED`.
- Private Sandbox video reaches terminal `PUBLISHED`.
- Review demonstration matches the submitted product configuration.
- TikTok explicitly approves the production application.
- Production OAuth works for a non-Sandbox eligible test account.
- Owner-controlled public-visibility smoke test uses only a TikTok-returned option.

## 19. Rollout

1. Add the public-enrollment, scheduling, video, and publishing gates with fail-closed defaults.
2. Add legal acceptance, quotas, numbered attempts, deletion state, retention fields, indexes, RLS, and operational heartbeat through additive migrations.
3. Correct status-specific UX and add no-reload polling.
4. Harden photo and video validation and media delivery.
5. Add safe retry semantics without cloning posts.
6. Add self-service disconnect and account deletion.
7. Add owner operational monitoring and emergency gates.
8. Deploy the truthful public pre-launch state while Sandbox testing remains restricted.
9. Complete private photo and video end-to-end evidence.
10. Record the final demonstration video.
11. Remove unused TikTok scopes and submit the production application.
12. Keep public enrollment and public visibility disabled during review.
13. After approval, install production credentials and verify their exact deployment environments.
14. Enable public visibility for an owner-controlled smoke test.
15. Enable open self-service enrollment.
16. Monitor authentication, quotas, worker latency, failures, storage, and cleanup throughout the free beta.

## 20. Rollback

- Disable new scheduling first if user-facing creation is unsafe.
- Disable Direct Post if provider submission is unsafe or ambiguous.
- Disable public enrollment without invalidating existing sessions when onboarding is the issue.
- Force `SELF_ONLY` by disabling public posting if approval or visibility behavior becomes uncertain.
- Preserve attempt, publish ID, and audit evidence during incident response.
- Do not use destructive rollback migrations.
- Restore service only after the affected gate has a verified fix.

## 21. Completion criteria

### 21.1 Product-ready

- Public pre-launch and authenticated routes render accurately.
- TikTok-only identity, legal acceptance, ownership isolation, quotas, retention, deletion, safe retries, media validation, and operations pass their tests.
- Photos and videos are available in the day-one product scope.
- Status messages match durable states without reloading.
- Production deployment and database verification pass.

### 21.2 TikTok-ready

- Valid Sandbox photo and video posts reach terminal `PUBLISHED`.
- The review video and written review package match the deployed product.
- Required URLs and scopes are verified and minimal.
- Public enrollment and public visibility remain fail-closed.

### 21.3 Publicly launched

- TikTok has explicitly approved the production application.
- Production credentials are active in the intended environment.
- A controlled public-visibility smoke test passes.
- `SCHEDULER_PUBLIC_ENROLLMENT_ENABLED` is enabled.
- Any eligible TikTok user can create a scheduler account without owner approval.
- Monitoring shows worker, quota, retention, and storage behavior is healthy.

