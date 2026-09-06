import "server-only";

import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createBlogTikTokDraft } from "./tiktokBridgeServer";
import { createMetaClient } from "./metaClient";
import { runSocialPublication } from "./publicationRunner";
import type { SocialPlatform } from "./types";

const PLATFORMS: SocialPlatform[] = ["INSTAGRAM", "FACEBOOK", "TIKTOK"];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function graphVersion() {
  const value = process.env.META_GRAPH_VERSION?.trim();
  if (!value) throw new Error("META_GRAPH_VERSION is not configured.");
  return value;
}

function dbError(operation: string, error: { message?: string } | null | undefined): never {
  throw new Error(error?.message ? `${operation}: ${error.message}` : operation);
}

async function articleIsLive(url: string) {
  const options: RequestInit = {
    method: "HEAD",
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(7_000),
  };
  try {
    let response = await fetch(url, options);
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(7_000),
      });
    }
    return response.ok;
  } catch {
    return false;
  }
}

function mapPublicationPatch(patch: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const keys: Array<[string, string]> = [
    ["status", "status"],
    ["externalPublicationId", "external_publication_id"],
    ["externalUrl", "external_url"],
    ["providerState", "provider_state"],
    ["lastErrorCode", "last_error_code"],
    ["lastErrorMessage", "last_error_message"],
    ["nextRetryAt", "next_retry_at"],
    ["publishedAt", "published_at"],
  ];
  for (const [source, target] of keys) {
    if (Object.prototype.hasOwnProperty.call(patch, source)) mapped[target] = patch[source];
  }
  return mapped;
}

function mapJobPatch(patch: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const keys: Array<[string, string]> = [
    ["status", "status"],
    ["completedAt", "completed_at"],
    ["lastErrorCode", "last_error_code"],
  ];
  for (const [source, target] of keys) {
    if (Object.prototype.hasOwnProperty.call(patch, source)) mapped[target] = patch[source];
  }
  return mapped;
}

export async function runSocialPublicationJob(jobId: string) {
  const supabase = createSchedulerSupabaseClient();

  const [{ data: job, error: jobError }, { data: publications, error: publicationError }, { data: assets, error: assetError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("social_automation_jobs").select("*").eq("id", jobId).maybeSingle(),
      supabase.from("social_publications").select("*").eq("job_id", jobId),
      supabase.from("social_media_assets").select("*").eq("job_id", jobId).is("deleted_at", null),
      supabase.from("social_automation_settings").select("*").eq("singleton_id", true).single(),
    ]);

  if (jobError) dbError("Unable to load social automation job", jobError);
  if (!job) throw Object.assign(new Error("Social automation job was not found."), { code: "JOB_NOT_FOUND" });
  if (publicationError) dbError("Unable to load social publications", publicationError);
  if (assetError) dbError("Unable to load social media assets", assetError);
  if (settingsError || !settings) dbError("Unable to load social automation settings", settingsError);

  const snapshot = record(job.article_snapshot);
  const article = record(snapshot?.article);
  if (!article) throw new Error("Social automation job article snapshot is invalid.");
  const canonicalUrl = text(article.canonicalUrl);
  const slug = text(article.slug);
  const title = text(article.title);
  if (!canonicalUrl.startsWith("https://") || !slug || !title) {
    throw new Error("Social automation job article snapshot is incomplete.");
  }

  const publicationRows = new Map<string, Record<string, unknown>>();
  for (const row of publications ?? []) {
    const value = record(row);
    if (value && typeof value.platform === "string") publicationRows.set(value.platform, value);
  }
  for (const platform of PLATFORMS) {
    if (!publicationRows.has(platform)) throw new Error(`Missing ${platform} publication state.`);
  }

  const assetRows = new Map<string, Record<string, unknown>>();
  for (const row of assets ?? []) {
    const value = record(row);
    if (value && typeof value.profile === "string") assetRows.set(value.profile, value);
  }
  const metaAsset = assetRows.get("META");
  const tiktokAsset = assetRows.get("TIKTOK");
  if (!metaAsset || !tiktokAsset) throw new Error("Both social render assets are required before publication.");

  const state = {
    job: {
      id: String(job.id),
      startedAt: text(job.started_at) || text(job.created_at),
      article: { slug, title, canonicalUrl },
    },
    settings: {
      enabled: settings.enabled === true,
      instagram: settings.instagram_enabled === true,
      facebook: settings.facebook_enabled === true,
      tiktok: settings.tiktok_generation_enabled === true,
      retentionDays: numberValue(settings.asset_retention_days, 7),
    },
    assets: {
      meta: {
        id: String(metaAsset.id),
        storagePath: text(metaAsset.storage_path),
      },
      tiktok: {
        id: String(tiktokAsset.id),
        storagePath: text(tiktokAsset.storage_path),
        checksum: text(tiktokAsset.checksum),
        byteSize: numberValue(tiktokAsset.byte_size),
        durationSeconds: numberValue(tiktokAsset.duration_seconds),
      },
    },
    publications: Object.fromEntries(
      PLATFORMS.map((platform) => {
        const row = publicationRows.get(platform)!;
        return [
          platform,
          {
            status: String(row.status) as any,
            caption: text(row.caption),
            externalPublicationId: typeof row.external_publication_id === "string" ? row.external_publication_id : null,
            providerState: record(row.provider_state) ?? {},
          },
        ];
      })
    ) as any,
  };

  const meta = createMetaClient({ graphVersion: graphVersion() });

  return runSocialPublication(state, {
    nowMs: () => Date.now(),
    isArticleLive: articleIsLive,
    async getMetaVideoUrl(storagePath) {
      const { data, error } = await supabase.storage
        .from("social-automation")
        .createSignedUrl(storagePath, 60 * 60);
      if (error || !data?.signedUrl) dbError("Unable to create Meta media URL", error);
      return data.signedUrl;
    },
    async getMetaConnection() {
      const { data, error } = await supabase
        .from("social_connections")
        .select("encrypted_tokens,instagram_account_id,reconnect_required")
        .eq("provider", "META")
        .maybeSingle();
      if (error) dbError("Unable to load Meta connection", error);
      if (!data || data.reconnect_required === true) return null;
      const { decryptMetaTokens } = await import("./crypto");
      const tokens = decryptMetaTokens(typeof data.encrypted_tokens === "string" ? data.encrypted_tokens : undefined);
      const instagramAccountId = text(data.instagram_account_id);
      if (!tokens?.pageAccessToken || !instagramAccountId) return null;
      return { pageAccessToken: tokens.pageAccessToken, instagramAccountId };
    },
    createInstagramReel: (input) => meta.createInstagramReel(input),
    readInstagramContainer: (input) => meta.readInstagramContainer(input),
    publishInstagramContainer: (input) => meta.publishInstagramContainer(input),
    startFacebookReel: (input) => meta.startFacebookReel(input),
    uploadFacebookReel: (input) => meta.uploadFacebookReel(input),
    finishFacebookReel: (input) => meta.finishFacebookReel(input),
    prepareTikTok: (input) => createBlogTikTokDraft(input),
    async savePublication(platform, patch) {
      const { error } = await supabase
        .from("social_publications")
        .update(mapPublicationPatch(patch))
        .eq("job_id", jobId)
        .eq("platform", platform);
      if (error) dbError(`Unable to update ${platform} publication`, error);
    },
    async saveJob(patch) {
      const { error } = await supabase
        .from("social_automation_jobs")
        .update(mapJobPatch(patch))
        .eq("id", jobId);
      if (error) dbError("Unable to update social automation job", error);
    },
    async setAssetRetention(retainedUntil) {
      const { error } = await supabase
        .from("social_media_assets")
        .update({ retained_until: retainedUntil, updated_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .is("deleted_at", null);
      if (error) dbError("Unable to update social media retention", error);
    },
  });
}
