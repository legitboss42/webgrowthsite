export const TIKTOK_PUBLISHING_WORKER = "tiktok-publishing";
const SAFE_WORKER_HEALTH_CODES = new Set([
  "WORKER_FAILURE",
  "PRE_ACCEPTANCE_INFRASTRUCTURE",
  "POST_ACCEPTANCE_AMBIGUOUS",
]);
const SAFE_FAILURE_CATEGORIES = new Set([
  "PUBLISH_RETRY_SCHEDULED",
  "PUBLISH_RECONCILIATION_REQUIRED",
  "PUBLISH_BLOCKED",
]);

export type SchedulerOperationsClient = {
  rpc(name: string, input: Record<string, unknown>): Promise<unknown>;
};

export type SchedulerOwnerOverview = {
  users: { total: number; active: number; suspended: number };
  workflow: { scheduled: number; overdue: number; submitting: number; processing: number; published: number; failed: number; cancelled: number };
  heartbeat: { lastStartedAt: string | null; lastSucceededAt: string | null; lastErrorCode: string | null };
  cleanup: { pending: number; overdue: number };
  reconnectRequired: number;
  failureCategories: Record<string, number>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function counts(value: unknown, keys: readonly string[]) {
  const record = asRecord(value);
  return Object.fromEntries(keys.map((key) => [key, count(record?.[key])])) as Record<string, number>;
}

export function sanitizeWorkerHealthCode(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return SAFE_WORKER_HEALTH_CODES.has(normalized) ? normalized : "WORKER_FAILURE";
}

export function formatWorkerHeartbeatAge(lastSucceededAt: string | null, now = new Date()) {
  if (!lastSucceededAt) return "No successful cycle recorded";
  const succeededAt = new Date(lastSucceededAt).getTime();
  if (!Number.isFinite(succeededAt)) return "No successful cycle recorded";
  const minutes = Math.max(0, Math.floor((now.getTime() - succeededAt) / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
}

function sanitizeFailureCategories(value: unknown) {
  const record = asRecord(value);
  if (!record) return {};
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key, total]) => SAFE_FAILURE_CATEGORIES.has(key) && count(total) > 0)
      .map(([key, total]) => [key, count(total)]),
  );
}

export function projectSchedulerOwnerOverview(value: unknown): SchedulerOwnerOverview {
  const result = asRecord(value);
  const users = counts(result?.users, ["total", "active", "suspended"]);
  const workflow = counts(result?.workflow, ["scheduled", "overdue", "submitting", "processing", "published", "failed", "cancelled"]);
  const heartbeat = asRecord(result?.heartbeat);
  const cleanup = counts(result?.cleanup, ["pending", "overdue"]);
  return {
    users: { total: users.total, active: users.active, suspended: users.suspended },
    workflow: {
      scheduled: workflow.scheduled,
      overdue: workflow.overdue,
      submitting: workflow.submitting,
      processing: workflow.processing,
      published: workflow.published,
      failed: workflow.failed,
      cancelled: workflow.cancelled,
    },
    heartbeat: {
      lastStartedAt: nullableText(heartbeat?.lastStartedAt),
      lastSucceededAt: nullableText(heartbeat?.lastSucceededAt),
      lastErrorCode: nullableText(heartbeat?.lastErrorCode),
    },
    cleanup: { pending: cleanup.pending, overdue: cleanup.overdue },
    reconnectRequired: count(result?.reconnectRequired),
    failureCategories: sanitizeFailureCategories(result?.failureCategories),
  };
}

async function requireSuccessfulHealthWrite(operation: Promise<unknown>) {
  if (await operation !== true) throw new Error("Scheduler worker health write was not accepted.");
}

export function createSchedulerOperations(client: SchedulerOperationsClient) {
  return {
    async recordWorkerStarted(startedAt: string) {
      await requireSuccessfulHealthWrite(client.rpc("record_scheduler_worker_started", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_started_at: startedAt,
      }));
    },
    async recordWorkerSucceeded(succeededAt: string) {
      await requireSuccessfulHealthWrite(client.rpc("record_scheduler_worker_succeeded", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_succeeded_at: succeededAt,
      }));
    },
    async recordWorkerFailure(errorCode: unknown, failedAt: string) {
      await requireSuccessfulHealthWrite(client.rpc("record_scheduler_worker_failure", {
        p_worker_name: TIKTOK_PUBLISHING_WORKER,
        p_error_code: sanitizeWorkerHealthCode(errorCode),
        p_failed_at: failedAt,
      }));
    },
    async getOwnerOverview() {
      return projectSchedulerOwnerOverview(await client.rpc("get_scheduler_owner_operations", {}));
    },
    async suspendUser(userId: string, reason: string) {
      return (await client.rpc("suspend_scheduler_user", {
        p_user_id: userId,
        p_reason: reason.trim().slice(0, 240),
      })) === true;
    },
    async restoreUser(userId: string) {
      return (await client.rpc("restore_scheduler_user", { p_user_id: userId })) === true;
    },
  };
}

export async function createSupabaseSchedulerOperations() {
  const { createSchedulerSupabaseClient } = await import("./supabase");
  const supabase = createSchedulerSupabaseClient();
  return createSchedulerOperations({
    async rpc(name, input) {
      const { data, error } = await supabase.rpc(name, input);
      if (error) throw new Error(`Scheduler operations failed (${error.code}).`);
      return data;
    },
  });
}
