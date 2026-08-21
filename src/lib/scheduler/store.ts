export type SchedulerDatabaseClient = {
  insert(table: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
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
  encryptedTokens: string;
  scopes: string[];
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

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
    claimDuePosts(nowIso: string, limit: number) {
      return client.rpc("claim_due_tiktok_posts", {
        p_now: nowIso,
        p_limit: Math.max(1, Math.min(25, Math.floor(limit))),
      });
    },
    saveConnection(input: SaveTikTokConnectionInput) {
      return client.insert("tiktok_connections", {
        user_id: input.userId,
        encrypted_tokens: input.encryptedTokens,
        scopes: input.scopes,
        access_expires_at: input.accessExpiresAt,
        refresh_expires_at: input.refreshExpiresAt,
        reconnect_required: false,
      });
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
      await client.remove("tiktok_connections", "user_id", userId);
      return client.rpc("cancel_tiktok_connection_jobs", { p_user_id: userId });
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
