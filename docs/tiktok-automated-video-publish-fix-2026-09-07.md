# TikTok Automated Video Publishing Fix — 2026-09-07

## Status

Implementation prepared on `fix/tiktok-automated-video-validation`. No production deployment has been requested or performed for this fix.

## Production failure reproduced

The controlled blog-to-social test successfully published Facebook and Instagram and created TikTok scheduler post:

- Scheduler post: `e2d7e74e-cf3f-48e1-a751-22c8f87f579c`
- Scheduled locally: 2026-09-07 21:53 Africa/Lagos
- Final scheduler state: `NEEDS_ATTENTION`
- User failure code: `PUBLISH_BLOCKED`
- Publish attempt error: `MEDIA_VALIDATION_STALE`
- TikTok `publish_id`: null

Vercel's `/api/scheduler/cron/publish/` worker ran normally at 20:55:01 UTC. The failure therefore occurred inside the scheduler's pre-submission safety boundary, before TikTok accepted any publish request.

## Root cause

The blog-social bridge incorrectly treated the GitHub-rendered TikTok MP4 as if the scheduler had already validated it.

The generated scheduler `media_assets` row was written with:

- `validation_status = VALID`
- `validation_version = null`
- `video_codec = null`
- `frame_rate = null`
- `width = null`
- `height = null`

The scheduler intentionally rechecks approved video media against the current `VIDEO_VALIDATION_VERSION` before Direct Post. Because the bridge had skipped the scheduler validator, the worker correctly rejected the media with `MEDIA_VALIDATION_STALE`.

A second latent bug was discovered while tracing the next publishing boundary. The bridge also wrote `article_slug` on an automated VIDEO asset. In the scheduler, `article_slug` is the marker for virtual article PHOTO slides. `runWorker.ts` therefore would have converted the MP4 into `/api/tiktok/slides/<slug>/` rather than staging the stored video if the stale-validation check had not stopped it first.

## Corrective implementation

The fix keeps the existing creator-consent and Direct Post safety model intact:

1. Automated TikTok VIDEO media enters `media_assets` as `PENDING`.
2. Automated VIDEO media does not set `article_slug`; the field remains reserved for virtual PHOTO slide assets.
3. Before a `NEEDS_APPROVAL` scheduler post is created, the bridge calls the same `finalizeSchedulerUpload` pipeline used by normal scheduler uploads.
4. The finalizer inspects the object in `tiktok-scheduler-media`, downloads the stored video, queries the current TikTok creator duration limit, probes the real bytes, validates container/codec/dimensions/FPS/duration, and persists the current `VIDEO_VALIDATION_VERSION` plus probe evidence.
5. A validation failure prevents creation of the approval post.
6. If media validation succeeded but post creation failed, a retry recognizes current valid evidence and does not try to re-finalize the already validated asset.
7. Existing scheduler approval, scheduling, worker revalidation, token refresh, and Direct Post submission boundaries are unchanged.

## Regression coverage

RED reproduction was created against the old bridge behavior and failed for the expected reasons:

- expected `PENDING`, received `VALID`;
- expected stored-video finalization before post creation, but no finalization occurred.

The corrected pure bridge/store behavior then passed locally:

- automated VIDEO starts `PENDING`;
- automated VIDEO has no `article_slug` virtual-media marker;
- finalization occurs before post creation;
- failed finalization creates no approval post;
- idempotent retry reuses an existing media/post link and does not duplicate finalization.

Repository CI, scheduler tests, type-checking, linting, and production build validation must still run against the final branch commit before deployment approval is requested.

## Current failed test-post recovery

The already failed scheduler post was created using the old invalid media row, so it must not be force-submitted or repaired by bypassing scheduler validation.

After the code fix is validated and receives deployment approval:

1. Deploy the fix once.
2. Remove only the temporary failed TikTok scheduler draft/approval/attempt/media bridge records for the controlled test.
3. Reset only the temporary test job's TikTok social-publication state so the idempotent blog-social runner can prepare a fresh scheduler draft from the already rendered MP4.
4. Re-run the existing social automation job without duplicating the already-published Facebook or Instagram posts.
5. The owner reviews and approves the new TikTok scheduler post.
6. Verify a real TikTok `publish_id` and terminal publication state.
7. Only after final TikTok verification, remove the temporary blog article and its route-governance entry.

No production data outside this controlled test should be modified during recovery.
