import test from "node:test";
import assert from "node:assert/strict";

import { runSocialPublication } from "./publicationRunner";
import type { SocialPublicationStatus } from "./store";

type Call = { name: string; value?: unknown };
type TestPublication = {
  status: SocialPublicationStatus;
  caption: string;
  externalPublicationId?: string | null;
  providerState?: Record<string, unknown> | null;
};

function baseState() {
  return {
    job: {
      id: "00000000-0000-4000-8000-000000000001",
      startedAt: "2026-09-06T01:00:00.000Z",
      article: {
        slug: "seo-checklist",
        title: "SEO checklist",
        canonicalUrl: "https://webgrowth.info/blog/seo-checklist/",
      },
    },
    settings: { enabled: true, instagram: true, facebook: true, tiktok: true, retentionDays: 7 },
    assets: {
      meta: { id: "meta-asset", storagePath: "social/job/meta.mp4" },
      tiktok: {
        id: "tt-asset",
        storagePath: "social/job/tiktok.mp4",
        checksum: "a".repeat(64),
        byteSize: 1000,
        durationSeconds: 20,
      },
    },
    publications: {
      INSTAGRAM: { status: "PENDING", caption: "IG caption", externalPublicationId: null } as TestPublication,
      FACEBOOK: { status: "PENDING", caption: "FB caption", providerState: {} } as TestPublication,
      TIKTOK: { status: "PENDING", caption: "TT caption", externalPublicationId: null } as TestPublication,
    },
  };
}

function deps(calls: Call[], options: { live?: boolean } = {}) {
  return {
    nowMs: () => Date.parse("2026-09-06T01:05:00.000Z"),
    isArticleLive: async () => options.live ?? true,
    getMetaVideoUrl: async () => "https://signed.example/meta.mp4",
    getMetaConnection: async () => ({ pageAccessToken: "page-token", instagramAccountId: "ig-1" }),
    createInstagramReel: async () => {
      calls.push({ name: "ig-create" });
      return "ig-container";
    },
    readInstagramContainer: async () => "IN_PROGRESS" as const,
    publishInstagramContainer: async () => "ig-media",
    startFacebookReel: async () => {
      calls.push({ name: "fb-start" });
      return { videoId: "fb-video", uploadUrl: "https://rupload.facebook.com/fb-video" };
    },
    uploadFacebookReel: async () => {
      calls.push({ name: "fb-upload" });
    },
    finishFacebookReel: async () => {
      calls.push({ name: "fb-finish" });
      return "fb-video";
    },
    prepareTikTok: async () => {
      calls.push({ name: "tt-prepare" });
      return { postId: "tt-post" };
    },
    savePublication: async (platform: string, patch: Record<string, unknown>) => {
      calls.push({ name: `save-${platform}`, value: patch });
    },
    saveJob: async (patch: Record<string, unknown>) => {
      calls.push({ name: "save-job", value: patch });
    },
    setAssetRetention: async (retainedUntil: string) => {
      calls.push({ name: "retention", value: retainedUntil });
    },
  };
}

test("waits for the production article before any social provider call", async () => {
  const calls: Call[] = [];
  const result = await runSocialPublication(baseState(), deps(calls, { live: false }));
  assert.equal(result.status, "WAITING_FOR_ARTICLE");
  assert.equal(result.retryAfterSeconds, 30);
  assert.equal(calls.some((call) => /ig-|fb-|tt-/.test(call.name)), false);
});

test("reuses an Instagram processing container on retry instead of creating another", async () => {
  const calls: Call[] = [];
  const state = baseState();
  state.publications.INSTAGRAM = {
    status: "PROCESSING",
    caption: "IG caption",
    externalPublicationId: "existing-container",
  };
  const result = await runSocialPublication(state, {
    ...deps(calls),
    readInstagramContainer: async () => "FINISHED" as const,
  });
  assert.equal(calls.some((call) => call.name === "ig-create"), false);
  assert.equal(calls.some((call) => call.name === "save-INSTAGRAM" && (call.value as any).status === "PUBLISHED"), true);
  assert.equal(result.platforms.INSTAGRAM, "PUBLISHED");
});

test("resumes a Facebook upload session and never starts a second video", async () => {
  const calls: Call[] = [];
  const state = baseState();
  state.publications.FACEBOOK = {
    status: "PROCESSING",
    caption: "FB caption",
    providerState: {
      videoId: "existing-video",
      uploadUrl: "https://rupload.facebook.com/existing-video",
      uploaded: true,
    },
  };
  await runSocialPublication(state, deps(calls));
  assert.equal(calls.some((call) => call.name === "fb-start"), false);
  assert.equal(calls.some((call) => call.name === "fb-upload"), false);
  assert.equal(calls.some((call) => call.name === "fb-finish"), true);
});

test("a permanent Meta failure does not block the TikTok consent draft", async () => {
  const calls: Call[] = [];
  const permanent = Object.assign(new Error("Meta rejected the request."), { retryable: false });
  const result = await runSocialPublication(baseState(), {
    ...deps(calls),
    createInstagramReel: async () => { throw permanent; },
    startFacebookReel: async () => { throw permanent; },
  });
  assert.equal(result.platforms.INSTAGRAM, "NEEDS_ATTENTION");
  assert.equal(result.platforms.FACEBOOK, "NEEDS_ATTENTION");
  assert.equal(result.platforms.TIKTOK, "NEEDS_APPROVAL");
  assert.equal(result.status, "PARTIALLY_PUBLISHED");
  assert.equal(calls.some((call) => call.name === "tt-prepare"), true);
});
