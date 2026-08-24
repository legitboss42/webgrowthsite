const ABANDONED_UPLOAD_MS = 24 * 60 * 60 * 1000;
const TERMINAL_ORIGINAL_MS = 7 * 24 * 60 * 60 * 1000;
const TERMINAL_POST_STATUSES = new Set(["PUBLISHED", "CANCELLED", "NEEDS_ATTENTION", "FAILED_FINAL"]);

export type DeletionEligibility = "ABANDONED" | "TERMINAL";

export type RetentionAsset = {
  id: string;
  userId: string;
  storagePath: string;
  createdAt: string;
  terminalAt: string | null;
  terminalStatus: string | null;
  attachedToPost: boolean;
  approvedForPost: boolean;
  hasActiveReference: boolean;
};

export type TerminalStagingObject = {
  id: string;
  userId: string;
  storagePath: string;
  terminalReconciled: boolean;
};

export type AccountDeletionState = "REQUESTED" | "RUNNING" | "COMPLETE" | "NEEDS_ATTENTION";

export type AccountDeletionJob = {
  requestId: string;
  userId: string;
  state: "RUNNING";
};

export type AccountDeletionManifest = {
  ready: boolean;
  userId: string;
  originalPaths: string[];
  stagingPaths: string[];
  recordedPublishIds: string[];
};

type FailureInput = { errorCode: string };

export type RetentionRepository = {
  claimMediaCandidates(nowIso: string, limit: number): Promise<RetentionAsset[]>;
  completeMediaDeletion(input: { assetId: string; userId: string; deletedAt: string }): Promise<boolean>;
  recordMediaFailure(input: { assetId: string; userId: string } & FailureInput): Promise<void>;
  claimTerminalStaging(nowIso: string, limit: number): Promise<TerminalStagingObject[]>;
  completeStagingDeletion(input: { objectId: string; userId: string; removedAt: string }): Promise<boolean>;
  recordStagingFailure(input: { objectId: string; userId: string } & FailureInput): Promise<void>;
  claimAccountDeletionJobs(nowIso: string, limit: number): Promise<AccountDeletionJob[]>;
  loadAccountDeletionManifest(job: AccountDeletionJob): Promise<AccountDeletionManifest>;
  completeAccountDeletion(input: { requestId: string; userId: string }): Promise<boolean>;
  markAccountDeletionAttention(input: { requestId: string; userId: string } & FailureInput): Promise<void>;
};

export type RetentionStorage = {
  remove(bucket: "tiktok-scheduler-media" | "tiktok-publishing-staging", path: string): Promise<void>;
};

export type AccountDeletionRequester = {
  requestAccountDeletion(userId: string): Promise<{ requestId: string; state: AccountDeletionState }>;
};

export type RetentionRpcClient = {
  rpc(
    name: string,
    input: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};

export type RetentionStorageClient = {
  from(bucket: string): {
    remove(paths: string[]): PromiseLike<{ data: unknown; error: { name?: string } | null }>;
  };
};

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDeletionEligibility(asset: RetentionAsset, now: Date): DeletionEligibility | null {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs) || asset.hasActiveReference) return null;

  const terminalAt = timestamp(asset.terminalAt);
  if (terminalAt !== null
    && TERMINAL_POST_STATUSES.has(asset.terminalStatus || "")
    && nowMs - terminalAt >= TERMINAL_ORIGINAL_MS) return "TERMINAL";

  const createdAt = timestamp(asset.createdAt);
  if (createdAt !== null
    && !asset.attachedToPost
    && !asset.approvedForPost
    && nowMs - createdAt >= ABANDONED_UPLOAD_MS) return "ABANDONED";

  return null;
}

async function bestEffortFailure(record: () => Promise<void>) {
  try {
    await record();
  } catch {
    // A stale RUNNING claim is reclaimable; never convert an audit-write failure into a deletion claim.
  }
}

export async function cleanupOriginalMedia(
  repository: RetentionRepository,
  storage: RetentionStorage,
  now = new Date(),
  limit = 100,
) {
  const candidates = await repository.claimMediaCandidates(now.toISOString(), limit);
  let removed = 0;
  let failed = 0;

  for (const candidate of candidates) {
    if (!getDeletionEligibility(candidate, now)) {
      failed += 1;
      await bestEffortFailure(() => repository.recordMediaFailure({
        assetId: candidate.id,
        userId: candidate.userId,
        errorCode: "RETENTION_REVALIDATION_FAILED",
      }));
      continue;
    }
    try {
      await storage.remove("tiktok-scheduler-media", candidate.storagePath);
    } catch {
      failed += 1;
      await bestEffortFailure(() => repository.recordMediaFailure({
        assetId: candidate.id,
        userId: candidate.userId,
        errorCode: "STORAGE_REMOVE_FAILED",
      }));
      continue;
    }

    let confirmed = false;
    try {
      confirmed = await repository.completeMediaDeletion({
        assetId: candidate.id,
        userId: candidate.userId,
        deletedAt: now.toISOString(),
      });
    } catch {
      confirmed = false;
    }
    if (confirmed) {
      removed += 1;
    } else {
      failed += 1;
      await bestEffortFailure(() => repository.recordMediaFailure({
        assetId: candidate.id,
        userId: candidate.userId,
        errorCode: "DATABASE_CONFIRMATION_FAILED",
      }));
    }
  }

  return { checked: candidates.length, removed, failed };
}

export async function cleanupTerminalStaging(
  repository: RetentionRepository,
  storage: RetentionStorage,
  now = new Date(),
  limit = 100,
) {
  const candidates = await repository.claimTerminalStaging(now.toISOString(), limit);
  let removed = 0;
  let failed = 0;

  for (const candidate of candidates) {
    if (!candidate.terminalReconciled) {
      failed += 1;
      await bestEffortFailure(() => repository.recordStagingFailure({
        objectId: candidate.id,
        userId: candidate.userId,
        errorCode: "TERMINAL_RECONCILIATION_REQUIRED",
      }));
      continue;
    }
    try {
      await storage.remove("tiktok-publishing-staging", candidate.storagePath);
    } catch {
      failed += 1;
      await bestEffortFailure(() => repository.recordStagingFailure({
        objectId: candidate.id,
        userId: candidate.userId,
        errorCode: "STORAGE_REMOVE_FAILED",
      }));
      continue;
    }

    let confirmed = false;
    try {
      confirmed = await repository.completeStagingDeletion({
        objectId: candidate.id,
        userId: candidate.userId,
        removedAt: now.toISOString(),
      });
    } catch {
      confirmed = false;
    }
    if (confirmed) {
      removed += 1;
    } else {
      failed += 1;
      await bestEffortFailure(() => repository.recordStagingFailure({
        objectId: candidate.id,
        userId: candidate.userId,
        errorCode: "DATABASE_CONFIRMATION_FAILED",
      }));
    }
  }

  return { checked: candidates.length, removed, failed };
}

export async function cleanupAccountDeletionJobs(
  repository: RetentionRepository,
  storage: RetentionStorage,
  now = new Date(),
  limit = 10,
) {
  const jobs = await repository.claimAccountDeletionJobs(now.toISOString(), limit);
  let completed = 0;
  let needsAttention = 0;

  for (const job of jobs) {
    let manifest: AccountDeletionManifest;
    try {
      manifest = await repository.loadAccountDeletionManifest(job);
    } catch {
      needsAttention += 1;
      await bestEffortFailure(() => repository.markAccountDeletionAttention({
        requestId: job.requestId,
        userId: job.userId,
        errorCode: "MANIFEST_LOAD_FAILED",
      }));
      continue;
    }

    if (manifest.userId !== job.userId) {
      needsAttention += 1;
      await bestEffortFailure(() => repository.markAccountDeletionAttention({
        requestId: job.requestId,
        userId: job.userId,
        errorCode: "MANIFEST_SCOPE_MISMATCH",
      }));
      continue;
    }
    if (!manifest.ready) {
      needsAttention += 1;
      await bestEffortFailure(() => repository.markAccountDeletionAttention({
        requestId: job.requestId,
        userId: job.userId,
        errorCode: "ACTIVE_PUBLICATION_REFERENCE",
      }));
      continue;
    }

    let storageFailed = false;
    for (const path of manifest.originalPaths) {
      try {
        await storage.remove("tiktok-scheduler-media", path);
      } catch {
        storageFailed = true;
        break;
      }
    }
    if (!storageFailed) {
      for (const path of manifest.stagingPaths) {
        try {
          await storage.remove("tiktok-publishing-staging", path);
        } catch {
          storageFailed = true;
          break;
        }
      }
    }
    if (storageFailed) {
      needsAttention += 1;
      await bestEffortFailure(() => repository.markAccountDeletionAttention({
        requestId: job.requestId,
        userId: job.userId,
        errorCode: "STORAGE_REMOVE_FAILED",
      }));
      continue;
    }

    let confirmed = false;
    try {
      confirmed = await repository.completeAccountDeletion({ requestId: job.requestId, userId: job.userId });
    } catch {
      confirmed = false;
    }
    if (confirmed) {
      completed += 1;
    } else {
      needsAttention += 1;
      await bestEffortFailure(() => repository.markAccountDeletionAttention({
        requestId: job.requestId,
        userId: job.userId,
        errorCode: "DATABASE_CONFIRMATION_FAILED",
      }));
    }
  }

  return { checked: jobs.length, completed, needsAttention };
}

export async function requestAccountDeletionAtBoundary(
  input: { userId: string | null; sameOrigin: boolean; confirmation: string },
  requester: AccountDeletionRequester,
) {
  if (!input.userId) return { ok: false as const, status: 401 as const, error: "Authentication required." };
  if (!input.sameOrigin) return { ok: false as const, status: 403 as const, error: "Invalid request origin." };
  if (input.confirmation !== "DELETE MY SCHEDULER ACCOUNT") {
    return { ok: false as const, status: 400 as const, error: "Type the exact account deletion confirmation." };
  }
  try {
    const result = await requester.requestAccountDeletion(input.userId);
    return { ok: true as const, status: 202 as const, requestId: result.requestId, state: result.state };
  } catch {
    return { ok: false as const, status: 502 as const, error: "Unable to record the account deletion request." };
  }
}

export async function readAccountDeletionConfirmation(request: Request) {
  try {
    const form = await request.formData();
    const confirmation = form.get("confirmation");
    return typeof confirmation === "string" ? confirmation : "";
  } catch {
    return "";
  }
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function requiredString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" && record[key] ? String(record[key]) : null;
}

function nullableString(record: Record<string, unknown>, key: string) {
  return record[key] === null ? null : requiredString(record, key);
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value as string[]
    : null;
}

export function createRetentionRepository(client: RetentionRpcClient): RetentionRepository {
  async function rpc(name: string, input: Record<string, unknown>) {
    const result = await client.rpc(name, input);
    if (result.error) throw new Error(`Scheduler retention database operation failed (${result.error.code || "UNKNOWN"}).`);
    return result.data;
  }

  async function booleanRpc(name: string, input: Record<string, unknown>) {
    const data = await rpc(name, input);
    if (typeof data !== "boolean") throw new Error("Scheduler retention database operation returned an invalid result.");
    return data;
  }

  return {
    async claimMediaCandidates(nowIso, limit) {
      const data = await rpc("claim_scheduler_media_cleanup", { p_now: nowIso, p_limit: limit });
      if (!Array.isArray(data)) throw new Error("Scheduler media cleanup claim returned an invalid result.");
      return data.map((value) => {
        const row = objectRecord(value);
        const id = row && requiredString(row, "id");
        const userId = row && requiredString(row, "user_id");
        const storagePath = row && requiredString(row, "storage_path");
        const createdAt = row && requiredString(row, "created_at");
        const terminalAt = row && nullableString(row, "terminal_at");
        const terminalStatus = row && nullableString(row, "terminal_status");
        if (!row || !id || !userId || !storagePath || !createdAt
          || typeof row.attached_to_post !== "boolean"
          || typeof row.approved_for_post !== "boolean"
          || typeof row.has_active_reference !== "boolean"
          || (row.terminal_at !== null && !terminalAt)
          || (row.terminal_status !== null && !terminalStatus)) {
          throw new Error("Scheduler media cleanup claim returned an invalid row.");
        }
        return {
          id,
          userId,
          storagePath,
          createdAt,
          terminalAt,
          terminalStatus,
          attachedToPost: row.attached_to_post,
          approvedForPost: row.approved_for_post,
          hasActiveReference: row.has_active_reference,
        };
      });
    },
    completeMediaDeletion(input) {
      return booleanRpc("complete_scheduler_media_cleanup", {
        p_asset_id: input.assetId,
        p_user_id: input.userId,
        p_deleted_at: input.deletedAt,
      });
    },
    async recordMediaFailure(input) {
      const recorded = await booleanRpc("record_scheduler_media_cleanup_failure", {
        p_asset_id: input.assetId,
        p_user_id: input.userId,
        p_error_code: input.errorCode,
      });
      if (!recorded) throw new Error("Scheduler media cleanup failure was not recorded.");
    },
    async claimTerminalStaging(nowIso, limit) {
      const data = await rpc("claim_terminal_staging_cleanup", { p_now: nowIso, p_limit: limit });
      if (!Array.isArray(data)) throw new Error("Scheduler staging cleanup claim returned an invalid result.");
      return data.map((value) => {
        const row = objectRecord(value);
        const id = row && requiredString(row, "id");
        const userId = row && requiredString(row, "user_id");
        const storagePath = row && requiredString(row, "storage_path");
        if (!row || !id || !userId || !storagePath || typeof row.terminal_reconciled !== "boolean") {
          throw new Error("Scheduler staging cleanup claim returned an invalid row.");
        }
        return { id, userId, storagePath, terminalReconciled: row.terminal_reconciled };
      });
    },
    completeStagingDeletion(input) {
      return booleanRpc("complete_terminal_staging_cleanup", {
        p_object_id: input.objectId,
        p_user_id: input.userId,
        p_removed_at: input.removedAt,
      });
    },
    async recordStagingFailure(input) {
      const recorded = await booleanRpc("record_terminal_staging_cleanup_failure", {
        p_object_id: input.objectId,
        p_user_id: input.userId,
        p_error_code: input.errorCode,
      });
      if (!recorded) throw new Error("Scheduler staging cleanup failure was not recorded.");
    },
    async claimAccountDeletionJobs(nowIso, limit) {
      const data = await rpc("claim_scheduler_account_deletions", { p_now: nowIso, p_limit: limit });
      if (!Array.isArray(data)) throw new Error("Scheduler account deletion claim returned an invalid result.");
      return data.map((value) => {
        const row = objectRecord(value);
        const requestId = row && requiredString(row, "request_id");
        const userId = row && requiredString(row, "user_id");
        if (!row || !requestId || !userId || row.state !== "RUNNING") {
          throw new Error("Scheduler account deletion claim returned an invalid row.");
        }
        return { requestId, userId, state: "RUNNING" as const };
      });
    },
    async loadAccountDeletionManifest(job) {
      const data = objectRecord(await rpc("get_scheduler_account_deletion_manifest", {
        p_request_id: job.requestId,
        p_user_id: job.userId,
      }));
      const userId = data && requiredString(data, "userId");
      const originalPaths = data && stringArray(data.originalPaths);
      const stagingPaths = data && stringArray(data.stagingPaths);
      const recordedPublishIds = data && stringArray(data.recordedPublishIds);
      if (!data || typeof data.ready !== "boolean" || !userId
        || !originalPaths || !stagingPaths || !recordedPublishIds) {
        throw new Error("Scheduler account deletion manifest returned an invalid result.");
      }
      return { ready: data.ready, userId, originalPaths, stagingPaths, recordedPublishIds };
    },
    completeAccountDeletion(input) {
      return booleanRpc("complete_scheduler_account_deletion", {
        p_request_id: input.requestId,
        p_user_id: input.userId,
      });
    },
    async markAccountDeletionAttention(input) {
      const recorded = await booleanRpc("mark_scheduler_account_deletion_attention", {
        p_request_id: input.requestId,
        p_user_id: input.userId,
        p_error_code: input.errorCode,
      });
      if (!recorded) throw new Error("Scheduler account deletion failure was not recorded.");
    },
  };
}

export function createRetentionStorage(client: RetentionStorageClient): RetentionStorage {
  return {
    async remove(bucket, path) {
      const { data, error } = await client.from(bucket).remove([path]);
      if (error) throw new Error(`Scheduler retention storage removal failed (${error.name || "UNKNOWN"}).`);
      if (!Array.isArray(data)) throw new Error("Scheduler retention storage removal returned an invalid result.");
    },
  };
}

export async function runRetentionCleanup(
  repository: RetentionRepository,
  storage: RetentionStorage,
  now = new Date(),
) {
  const accountDeletion = await cleanupAccountDeletionJobs(repository, storage, now);
  const staging = await cleanupTerminalStaging(repository, storage, now);
  const media = await cleanupOriginalMedia(repository, storage, now);
  return { accountDeletion, staging, media };
}

export async function createSupabaseRetentionRuntime() {
  const { createSchedulerSupabaseClient } = await import("./supabase");
  const supabase = createSchedulerSupabaseClient();
  const repository = createRetentionRepository({
    async rpc(name, input) {
      const { data, error } = await supabase.rpc(name, input);
      return { data, error: error ? { code: error.code } : null };
    },
  });
  const storage = createRetentionStorage({
    from(bucket) {
      return {
        async remove(paths) {
          const { data, error } = await supabase.storage.from(bucket).remove(paths);
          return { data, error: error ? { name: error.name } : null };
        },
      };
    },
  });
  return { repository, storage };
}

export async function runSupabaseRetentionCleanup(now = new Date()) {
  const { repository, storage } = await createSupabaseRetentionRuntime();
  return runRetentionCleanup(repository, storage, now);
}

export async function cleanupSupabaseTerminalStaging(now = new Date()) {
  const { repository, storage } = await createSupabaseRetentionRuntime();
  return cleanupTerminalStaging(repository, storage, now);
}
