# Remotion Engaging Text Video Design

**Date:** 2026-09-08  
**Status:** Owner-approved for local implementation  
**Branch:** `feature/remotion-engaging-text-video`

## Goal

Replace the card-heavy blog video presentation with a concise kinetic-text system that produces useful 9:16 social videos from any publishable article. The first production-ready path is deterministic, offline, and voice-free. Existing Meta publication, TikTok validation and creator approval, output paths, and composition IDs remain intact.

## Constraints

- Render at 1080x1920, 30 FPS, H.264/yuv420p.
- Keep `WebGrowthSocialMeta` and `WebGrowthSocialTikTok`.
- Keep `out/social/<slug>/meta.mp4`, `tiktok.mp4`, and `manifest.json`.
- Keep new-file-only triggering, publication idempotency, Meta auto-publish, and TikTok `NEEDS_APPROVAL` behavior unchanged.
- Introduce no paid API, hosted media service, or render-time network dependency.
- Do not require TTS, subtitles, screenshots, or the presenter.
- Do not remove the existing voice generator; voice remains an optional rendering mode.
- Do not copy the reference video's text, watermark, logo, or creator identity.

## Reference Findings

The supplied `Download.mp4` is 13.004 seconds, 576x1024, 30 FPS, H.264/yuv420p, with AAC audio. Representative frames show left-aligned monospace copy over subdued moving landscape footage, generous negative space, white copy, and limited green emphasis. The implementation borrows only those visual principles and uses an original procedural atmosphere.

## Architecture

### Pure Story And Timing Model

`src/lib/socialAutomation/kineticVideo.ts` owns deterministic article-to-video behavior. It accepts normalized article metadata and prose, then returns 4-6 typed beats covering hook, problem, insight, action, takeaway, and a platform ending. It also selects one short highlight phrase per beat and calculates frame-based timing from word and character counts.

The timing model has explicit minimum and maximum scene durations, a faster hook reveal, a readable hold, and a total target range of 12-18 seconds. If source copy is long, it is shortened before timing rather than squeezed into unreadable scenes. Identical input and configuration produce identical props and frame counts.

### Rendering Components

- `AtmosphericBackground` renders a dark green-black base, slowly drifting radial light, a restrained grid, vignette, and deterministic grain. It uses Remotion frames only.
- `KineticTypewriterText` reveals characters by frame, preserves wrapping, renders a cursor when requested, and highlights a matched phrase without changing layout.
- `KineticArticleVideo` resolves the active beat and renders the shared full-screen composition. It has no cards, presenter, progress bar, or subtitle overlay.
- Existing Meta and TikTok component exports remain as small platform wrappers so current composition IDs and automation wiring do not change.

### Platform Profiles

Meta uses the article beats plus an understated final Web Growth treatment with `webgrowth.info` and a read-the-guide CTA. TikTok uses the same educational beats but replaces the ending with `Save this idea for later.` and supplies no Web Growth name, URL, presenter, promotional CTA, or promotional narration.

### Optional Audio

Props gain `audioMode: "none" | "voice" | "soundtrack"`, defaulting to `none`. `audioSrc` is optional and rendered only when the mode is not `none` and a source exists. Scene timing never depends on audio or subtitle timestamps. Existing Edge TTS scripts remain available for an explicitly selected future voice render.

## Render Flow

`render-social-article.mjs` reads an existing article, builds deterministic platform props without network calls, writes local props, and renders both preserved production compositions. The compatibility renderer still creates `out/<slug>.mp4`, but it delegates to the same no-voice story model. The social renderer copies/renders into the existing social output paths and writes the existing manifest contract.

The production automation runner continues to upload the resulting real MP4, then the existing server path performs stored-byte ffprobe validation before creating a TikTok post in `NEEDS_APPROVAL`. No approval fingerprint, creator-info, privacy, disclosure, or Direct Post behavior changes.

## Error Handling

- Reject unsafe or missing slugs before reading files.
- Fail when an article cannot produce at least four meaningful beats.
- Clamp every beat and total duration to documented bounds.
- Reject `voice` or `soundtrack` props that lack `audioSrc` at props-generation time; `none` never fabricates an audio path.
- Keep render failures local and fail the command before any publication activity.

## Test Strategy

Pure tests cover no-audio props, determinism, beat count and word bounds, story roles, platform-safe endings, Meta branding, and duration bounds. Existing social tests continue to protect composition IDs, output paths, trigger behavior, idempotency, real-MP4 scheduler bridging, and `NEEDS_APPROVAL`. Existing scheduler tests continue to protect validation and approval behavior.

Verification includes focused RED/GREEN tests, all required regression suites, lint, SEO, sitemap, build, two local preview renders, one production social-render smoke run, ffprobe inspection, and representative-frame visual review.

## Non-Goals

- No production deployment, push, PR, merge, schema change, publication, or live API call.
- No paid soundtrack or stock-video integration.
- No removal of TTS tooling.
- No redesign of Facebook, Instagram, TikTok, WhatsApp, Supabase, or scheduler behavior.

