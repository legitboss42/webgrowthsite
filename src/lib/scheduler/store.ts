import { sanitizeWorkerHealthCode, TIKTOK_PUBLISHING_WORKER } from "./operations";

export type SchedulerDatabaseClient = {
  insert(table: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
  find(table: string, column: string, value: string): Promise<Record<string, unknown> | null>;
  update(table: string, id: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
  remove(table: string, column: string, value: string): Promise<void>;
  rpc(name: string, input: Record<string, unknown>): Promise<unknown>;
};

export type UpsertSchedulerUserInput = {
  tiktokOpenId: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type SaveTikTokConnectionInput = {
  userId: string;
  tiktokOpenId: string;
  encryptedTokens: string;
  scopes: string[];
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

export type SchedulerLegalAcceptanceInput = {
  termsVersion: string;
  privacyVersion: string;
};

export type CreateSchedulerPostInput = {
  userId: string;
  mediaIds: string[];
  title: string;
  caption: string;
};

export type ApproveSchedulerPostInput = {
  userId: string;
  postId: string;
  fingerprint: string;
  snapshot: Record<string, unknown>;
};

export type ReservePublicSchedulerSlotInput = {
  userId: string;
  postId: string;
  scheduledForIso: string;
  timezone: string;
  nowIso: string;
};

const ACCOUNT_DELETION_STATES = new Set(["REQUESTED", "RUNNING", "COMPLETE", "NEEDS_ATTENTION"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function createSchedulerStore(client: SchedulerDatabaseClient) {
  return {
    upsertUser(input: UpsertSchedulerUserInput) {
      return client.insert("scheduler_users", {
        tiktok_open_id: input.tiktokOpenId,
        display_name: input.displayName,
        avatar_url: input.avatarUrl,
        last_login_at: new Date().toISOString(),
      });
    },
    getUser(userId: string) {
      return client.find("scheduler_users", "id", userId);
    },
    acceptLegalAcceptance(userId: string, input: SchedulerLegalAcceptanceInput) {
      const acceptedAt = new Date().toISOString();
      return client.update("scheduler_users", userId, {
        terms_version: input.termsVersion,
        privacy_version: input.privacyVersion,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt,
      });
    },
    createPost(input: CreateSchedulerPostInput) {
      return client.rpc("create_public_scheduler_post", {
        p_user_id: input.userId,
        p_media_ids: input.mediaIds,
        p_title: input.title,
        p_caption: input.caption,
      });
    },
    approvePost(input: ApproveSchedulerPostInput) {
      return client.rpc("approve_public_scheduler_post", {
        p_user_id: input.userId,
        p_post_id: input.postId,
        p_fingerprint: input.fingerprint,
        p_snapshot: input.snapshot,
      });
    },
    async reservePublicSchedulerSlot(input: ReservePublicSchedulerSlotInput) {
      const result = await client.rpc("reserve_public_scheduler_slot", {
        p_post_id: input.postId,
        p_user_id: input.userId,
        p_scheduled_for: input.scheduledForIso,
        p_timezone: input.timezone,
        p_now: input.nowIso,
      });
      if (typeof result !== "boolean") throw new Error("Scheduler reservation returned an invalid result.");
      return result;
    },
    claimDuePosts(nowIso: string, limit: number) {
      return client.rpc("claim_due_tiktok_posts", {
        p_now: nowIso,
        p_limit: Math.max(1, Math.min(25, Math.floor(limit))),
      });
    },
    async saveActiveConnection(input: SaveTikTokConnectionInput) {
      return (await client.rpc("save_active_tiktok_connection", {
        p_user_id: input.userId,
        p_tiktok_open_id: input.tiktokOpenId,
        p_encrypted_tokens: input.encryptedTokens,
        p_scopes: input.scopes,
        p_access_expires_at: input.accessExpiresAt,
        p_refresh_expires_at: input.refreshExpiresAt,
      })) === true;
    },
    reserveDailySlot(userId: string, nowIso: string, limit = 3) {
      return client.rpc("reserve_tiktok_daily_slot", {
        p_user_id: userId,
        p_now: nowIso,
        p_limit: limit,
      });
    },
    cancelConnectionJobs(userId: string) {
      return client.rpc("cancel_tiktok_connection_jobs", { p_user_id: userId });
    },
    recordPublishId(attemptId: string, publishId: string) {
      return client.update("publish_attempts", attemptId, {
        publish_id: publishId,
        status: "PROCESSING",
      });
    },
    async disconnectUser(userId: string) {
      const result = asRecord(await client.rpc("disconnect_tiktok_scheduler_user", { p_user_id: userId }));
      if (!result
        || result.ok !== true
        || !Number.isSafeInteger(result.cancelledJobs)
        || Number(result.cancelledJobs) < 0) {
        throw new Error("Scheduler disconnect returned an invalid result.");
      }
      return { ok: true as const, cancelledJobs: Number(result.cancelledJobs) };
    },
    recordWorkerStarted(startedAt: string) {
      return client.rpc("record_scheduler_worker_started", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_started_at: startedAt,
      });
    },
    recordWorkerSucceeded(succeededAt: string) {
      return client.rpc("record_scheduler_worker_succeeded", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_succeeded_at: succeededAt,
      });
    },
    recordWorkerFailure(errorCode: string, failedAt: string) {
      return client.rpc("record_scheduler_worker_failure", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_error_code: sanitizeWorkerHealthCode(errorCode),
        p_failed_at: failedAt,
      });
    },
    async requestAccountDeletion(userId: string) {
      const result = asRecord(await client.rpc("request_scheduler_account_deletion", { p_user_id: userId }));
      if (!result
        || typeof result.requestId !== "string"
        || !ACCOUNT_DELETION_STATES.has(String(result.state || ""))) {
        throw new Error("Scheduler account deletion returned an invalid result.");
      }
      return {
        requestId: result.requestId,
        state: String(result.state) as "REQUESTED" | "RUNNING" | "COMPLETE" | "NEEDS_ATTENTION",
      };
    },
  };
}

export async function createSupabaseSchedulerStore() {
  const { createSchedulerSupabaseClient } = await import("./supabase");
  const supabase = createSchedulerSupabaseClient();
  const client: SchedulerDatabaseClient = {
    async insert(table, input) {
      const conflict = table === "scheduler_users" ? "tiktok_open_id" : table === "tiktok_connections" ? "user_id" : null;
      const query = conflict
        ? supabase.from(table).upsert(input, { onConflict: conflict })
        : supabase.from(table).insert(input);
      const { data, error } = await query.select().single();
      if (error) throw new Error(`Scheduler database write failed (${error.code}).`);
      return data as Record<string, unknown>;
    },
    async find(table, column, value) {
      const { data, error } = await supabase.from(table).select().eq(column, value).maybeSingle();
      if (error) throw new Error(`Scheduler database read failed (${error.code}).`);
      return data as Record<string, unknown> | null;
    },
    async rpc(name, input) {
      const { data, error } = await supabase.rpc(name, input);
      if (error) throw new Error(`Scheduler database operation failed (${error.code}).`);
      return data;
    },
    async update(table, id, input) {
      const { data, error } = await supabase.from(table).update(input).eq("id", id).select().single();
      if (error) throw new Error(`Scheduler database update failed (${error.code}).`);
      return data as Record<string, unknown>;
    },
    async remove(table, column, value) {
      const { error } = await supabase.from(table).delete().eq(column, value);
      if (error) throw new Error(`Scheduler database delete failed (${error.code}).`);
    },
  };
  return createSchedulerStore(client);
}
