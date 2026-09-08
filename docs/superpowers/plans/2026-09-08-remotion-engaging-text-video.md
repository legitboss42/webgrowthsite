# Remotion Engaging Text Video Implementation Plan

> **For Codex:** Use Superpowers test-driven-development for each behavior, then verification-before-completion before claiming success.

**Goal:** Deliver deterministic, no-voice-first kinetic article videos while preserving every production automation and TikTok approval contract.

**Architecture:** A pure TypeScript story/timing module generates platform-safe beats and render props. Shared Remotion components render the visual system, while thin Meta/TikTok wrappers preserve composition IDs and platform differences. Render scripts consume the pure model and keep current output paths.

**Tech Stack:** TypeScript, React 18, Remotion 4, Node.js, `tsx --test`, bundled ffmpeg/ffprobe.

---

### Task 1: Lock Story, Timing, And Platform Contracts With RED Tests

**Files:**
- Create: `src/lib/socialAutomation/kineticVideo.test.ts`
- Create: `src/lib/socialAutomation/kineticVideo.ts`
- Modify: `docs/remotion-engaging-text-video-progress-2026-09-08.md`

1. Add behavior tests for no-voice props, deterministic output, 4-6 concise beats, required story roles, platform endings, and 12-18 second duration.
2. Run `npx tsx --test src/lib/socialAutomation/kineticVideo.test.ts` and record the expected missing-implementation failure.
3. Implement the minimum pure article, beat, highlight, and timing model.
4. Re-run the focused test until green, then refactor names and boundaries while green.

### Task 2: Build The Shared Kinetic Remotion System

**Files:**
- Create: `src/remotion/components/AtmosphericBackground.tsx`
- Create: `src/remotion/components/KineticTypewriterText.tsx`
- Create: `src/remotion/components/KineticArticleVideo.tsx`
- Modify: `src/remotion/components/WebGrowthArticleVideo.tsx`
- Modify: `src/remotion/components/TikTokArticleVideo.tsx`
- Modify: `src/remotion/Root.tsx`
- Modify: `src/lib/socialAutomation/remotionIntegration.test.ts`

1. Add failing integration assertions for default-off audio, shared kinetic components, preserved composition IDs, and absent TikTok promotional material.
2. Run the focused integration test and record RED.
3. Implement the atmospheric background, typewriter/highlight renderer, shared composition, platform wrappers, and metadata duration calculation.
4. Keep `<Audio>` conditional on an explicit non-none mode and source.
5. Run focused tests and TypeScript checking.

### Task 3: Decouple Rendering From TTS

**Files:**
- Modify: `scripts/render-article-video.mjs`
- Modify: `scripts/render-social-article.mjs`
- Modify: `package.json` only if TypeScript loading is needed
- Modify: `src/lib/socialAutomation/remotionIntegration.test.ts`

1. Add failing behavior coverage proving the default social render path does not synthesize TTS and emits no audio source.
2. Move both render commands to deterministic props from the pure model.
3. Preserve compatibility output and all social output/manifest paths.
4. Keep `scripts/generate-article-voice.mjs` available for explicit optional voice generation.
5. Run focused tests and a props-only local command before full rendering.

### Task 4: Prove Automation And Scheduler Boundaries

**Files:**
- Modify tests only if a missing consumer-level contract is found under `src/lib/socialAutomation/` or `src/lib/scheduler/`.

1. Run relevant existing tests for added-file detection, output registration, MP4 validation, TikTok bridge finalization, and `NEEDS_APPROVAL` workflow.
2. Add only behavior-level tests needed to close a real uncovered boundary.
3. Do not change publication, schema, consent, or scheduler implementation unless a local regression is directly caused by the render change.

### Task 5: Render And Inspect Real Article Outputs

**Files:**
- Generate ignored files under `out/remotion/` and `out/social/`.
- Modify: `docs/remotion-engaging-text-video-progress-2026-09-08.md`

1. Use an existing publishable article, initially `why-your-website-isnt-getting-leads`.
2. Render `out/remotion/kinetic-meta-preview.mp4` and `out/remotion/kinetic-tiktok-preview.mp4`.
3. Run `npm run social:render -- why-your-website-isnt-getting-leads` without publication.
4. Probe codec, pixel format, dimensions, frame rate, duration, and audio streams with bundled ffprobe.
5. Extract representative frames to a temporary untracked directory and inspect first, middle, transition, and final frames.
6. Iterate through RED/GREEN tests for any discovered clipping, pacing, or platform-copy defect.

### Task 6: Update Operational Documentation

**Files:**
- Modify: `docs/blog-social-automation.md`
- Modify: `docs/remotion-engaging-text-video-progress-2026-09-08.md`
- Review: this plan and its paired design spec

1. Correct the stale PR #18 status using existing production evidence.
2. Document successful Facebook, Instagram, and TikTok E2E publication plus live terminal synchronization.
3. Document the kinetic architecture, default-off voice mode, commands, output contracts, and safe template extension points.
4. Reconcile all three new documents for matching paths, defaults, durations, and deployment state.

### Task 7: Fresh Full Verification And Local Commit

1. Run the focused kinetic/remotion tests.
2. Run `npm run test:social`.
3. Run `npm run test:scheduler`.
4. Run `npm run test:whatsapp`.
5. Run `npm run lint`.
6. Run `npm run seo:validate`.
7. Run `node scripts/validate-sitemap.mjs`.
8. Run `npm run build`.
9. Re-run final local smoke renders and ffprobe checks after the last code change.
10. Update the final verification matrix and remaining limitations.
11. Confirm generated media is not staged, inspect the complete diff, and commit locally with `feat: redesign automated blog videos with kinetic text`.
12. Confirm the branch has no upstream and make no push, PR, merge, preview deployment, or production deployment.

