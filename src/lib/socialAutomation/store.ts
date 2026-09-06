import { decryptMetaTokens, type MetaTokenPayload } from "./crypto";
import type { SocialPlatform, SocialRenderProfile } from "./types";

export type SocialJobInput = {
  articleSlug: string;
  sourceCommitSha: string;
  automationVersion: string;
  idempotencyKey: string;
  articleSnapshot: Record<string, unknown>;
};

export type SocialPublicationStatus =
  | "PENDING"
  | "PROCESSING"
  | "NEEDS_APPROVAL"
  | "PUBLISHED"
  | "FAILED_RETRYABLE"
  | "NEEDS_ATTENTION"
  | "SKIPPED";

export type SocialConnectionSummary = {
  id: string;
  provider: "META";
  facebookPageId: string | null;
  facebookPageName: string | null;
  instagramAccountId: string | null;
  instagramAccountName: string | null;
  scopes: string[];
  accessExpiresAt: string | null;
  reconnectRequired: boolean;
};

type DbResult<T> = Promise<{ data: T | null; error: { message?: string; code?: string } | null }>;

export type SocialDatabaseClient = {
  from(table: string): any;
};

function databaseError(operation: string, error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";
  throw new Error(message ? `${operation}: ${message}` : operation);
}

function mapConnectionSummary(row: Record<string, unknown> | null): SocialConnectionSummary | null {
  if (!row) return null;
  return {
    id: String(row.id ?? ""),
    provider: "META",
    facebookPageId: typeof row.facebook_page_id === "string" ? row.facebook_page_id : null,
    facebookPageName: typeof row.facebook_page_name === "string" ? row.facebook_page_name : null,
    instagramAccountId:
      typeof row.instagram_account_id === "string" ? row.instagram_account_id : null,
    instagramAccountName:
      typeof row.instagram_account_name === "string" ? row.instagram_account_name : null,
    scopes: Array.isArray(row.scopes) ? row.scopes.filter((item): item is string => typeof item === "string") : [],
    accessExpiresAt: typeof row.access_expires_at === "string" ? row.access_expires_at : null,
    reconnectRequired: row.reconnect_required === true,
  };
}

export function createSocialAutomationStoreFromClient(client: SocialDatabaseClient) {
  return {
    async createJob(input: SocialJobInput) {
      const existing = (await client
        .from("social_automation_jobs")
        .select("*")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle()) as Awaited<DbResult<Record<string, unknown>>>;
      if (existing.error) databaseError("Unable to read social automation job", existing.error);
      if (existing.data) return existing.data;

      const inserted = (await client
        .from("social_automation_jobs")
        .insert({
          article_slug: input.articleSlug,
          source_commit_sha: input.sourceCommitSha,
          automation_version: input.automationVersion,
          idempotency_key: input.idempotencyKey,
          article_snapshot: input.articleSnapshot,
          status: "QUEUED",
          started_at: new Date().toISOString(),
        })
        .select("*")
        .single()) as Awaited<DbResult<Record<string, unknown>>>;
      if (inserted.error || !inserted.data) databaseError("Unable to create social automation job", inserted.error);
      return inserted.data!;
    },

    async getJob(id: string) {
      const result = (await client
        .from("social_automation_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error) databaseError("Unable to read social automation job", result.error);
      return result.data;
    },

    async updateJob(id: string, patch: Record<string, unknown>) {
      const result = await client.from("social_automation_jobs").update({
        ...patch,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (result.error) databaseError("Unable to update social automation job", result.error);
    },

    async upsertPublication(input: {
      jobId: string;
      platform: SocialPlatform;
      caption: string;
      status: SocialPublicationStatus;
      mediaId?: string | null;
      externalPublicationId?: string | null;
      externalUrl?: string | null;
      providerState?: Record<string, unknown> | null;
      lastErrorCode?: string | null;
      lastErrorMessage?: string | null;
      nextRetryAt?: string | null;
      publishedAt?: string | null;
      attemptCount?: number;
    }) {
      const row = {
        job_id: input.jobId,
        platform: input.platform,
        caption: input.caption,
        status: input.status,
        media_id: input.mediaId ?? null,
        external_publication_id: input.externalPublicationId ?? null,
        external_url: input.externalUrl ?? null,
        provider_state: input.providerState ?? {},
        last_error_code: input.lastErrorCode ?? null,
        last_error_message: input.lastErrorMessage ?? null,
        next_retry_at: input.nextRetryAt ?? null,
        published_at: input.publishedAt ?? null,
        ...(typeof input.attemptCount === "number" ? { attempt_count: input.attemptCount } : {}),
        updated_at: new Date().toISOString(),
      };
      const result = (await client
        .from("social_publications")
        .upsert(row, { onConflict: "job_id,platform" })
        .select("*")
        .single()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error || !result.data) databaseError("Unable to save social publication", result.error);
      return result.data!;
    },

    async listPublications(jobId: string) {
      const result = await client
        .from("social_publications")
        .select("*")
        .eq("job_id", jobId);
      if (result.error) databaseError("Unable to read social publications", result.error);
      return (result.data ?? []) as Record<string, unknown>[];
    },

    async listAssets(jobId: string) {
      const result = await client
        .from("social_media_assets")
        .select("*")
        .eq("job_id", jobId);
      if (result.error) databaseError("Unable to read social media assets", result.error);
      return (result.data ?? []) as Record<string, unknown>[];
    },

    async registerAsset(input: {
      jobId: string;
      profile: SocialRenderProfile;
      storagePath: string;
      originalFilename: string;
      mimeType: string;
      byteSize: number;
      width?: number | null;
      height?: number | null;
      durationSeconds?: number | null;
      checksum?: string | null;
      retainedUntil?: string | null;
    }) {
      const result = (await client
        .from("social_media_assets")
        .upsert(
          {
            job_id: input.jobId,
            profile: input.profile,
            storage_path: input.storagePath,
            original_filename: input.originalFilename,
            mime_type: input.mimeType,
            byte_size: input.byteSize,
            width: input.width ?? null,
            height: input.height ?? null,
            duration_seconds: input.durationSeconds ?? null,
            checksum: input.checksum ?? null,
            retained_until: input.retainedUntil ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "storage_path" }
        )
        .select("*")
        .single()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error || !result.data) databaseError("Unable to register social media asset", result.error);
      return result.data!;
    },

    async getConnectionSummary(provider: "META" = "META") {
      const result = (await client
        .from("social_connections")
        .select(
          "id,provider,facebook_page_id,facebook_page_name,instagram_account_id,instagram_account_name,scopes,access_expires_at,reconnect_required"
        )
        .eq("provider", provider)
        .maybeSingle()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error) databaseError("Unable to read social connection", result.error);
      return mapConnectionSummary(result.data);
    },

    async getMetaConnectionWithTokens(): Promise<{
      summary: SocialConnectionSummary;
      tokens: MetaTokenPayload;
    } | null> {
      const result = (await client
        .from("social_connections")
        .select(
          "id,provider,encrypted_tokens,facebook_page_id,facebook_page_name,instagram_account_id,instagram_account_name,scopes,access_expires_at,reconnect_required"
        )
        .eq("provider", "META")
        .maybeSingle()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error) databaseError("Unable to read Meta connection", result.error);
      if (!result.data || typeof result.data.encrypted_tokens !== "string") return null;
      const tokens = decryptMetaTokens(result.data.encrypted_tokens);
      const summary = mapConnectionSummary(result.data);
      if (!tokens || !summary) return null;
      return { summary, tokens };
    },

    async saveMetaConnection(input: {
      ownerUserId?: string | null;
      encryptedTokens: string;
      facebookPageId?: string | null;
      facebookPageName?: string | null;
      instagramAccountId?: string | null;
      instagramAccountName?: string | null;
      scopes?: string[];
      accessExpiresAt?: string | null;
    }) {
      const result = (await client
        .from("social_connections")
        .upsert(
          {
            owner_user_id: input.ownerUserId ?? null,
            provider: "META",
            encrypted_tokens: input.encryptedTokens,
            facebook_page_id: input.facebookPageId ?? null,
            facebook_page_name: input.facebookPageName ?? null,
            instagram_account_id: input.instagramAccountId ?? null,
            instagram_account_name: input.instagramAccountName ?? null,
            scopes: input.scopes ?? [],
            access_expires_at: input.accessExpiresAt ?? null,
            reconnect_required: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider" }
        )
        .select("*")
        .single()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error || !result.data) databaseError("Unable to save Meta connection", result.error);
      return mapConnectionSummary(result.data)!;
    },

    async getSettings() {
      const result = (await client
        .from("social_automation_settings")
        .select("*")
        .eq("singleton_id", true)
        .single()) as Awaited<DbResult<Record<string, unknown>>>;
      if (result.error || !result.data) databaseError("Unable to read social automation settings", result.error);
      return result.data!;
    },

    async updateSettings(patch: Record<string, unknown>) {
      const result = await client.from("social_automation_settings").update({
        ...patch,
        updated_at: new Date().toISOString(),
      }).eq("singleton_id", true);
      if (result.error) databaseError("Unable to update social automation settings", result.error);
    },

    async listRecentJobs(limit = 25) {
      const result = await client
        .from("social_automation_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(Math.max(1, Math.min(limit, 100)));
      if (result.error) databaseError("Unable to list social automation jobs", result.error);
      return (result.data ?? []) as Record<string, unknown>[];
    },

    async audit(input: {
      jobId?: string | null;
      publicationId?: string | null;
      eventType: string;
      actor?: string;
      metadata?: Record<string, unknown>;
    }) {
      const result = await client.from("social_automation_audit_log").insert({
        job_id: input.jobId ?? null,
        publication_id: input.publicationId ?? null,
        event_type: input.eventType,
        actor: input.actor ?? "SYSTEM",
        metadata: input.metadata ?? {},
      });
      if (result.error) databaseError("Unable to write social automation audit event", result.error);
    },
  };
}
