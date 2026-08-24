import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  cleanupAccountDeletionJobs,
  cleanupOriginalMedia,
  cleanupTerminalStaging,
  createRetentionRepository,
  createRetentionStorage,
  getDeletionEligibility,
  readAccountDeletionConfirmation,
  requestAccountDeletionAtBoundary,
  runRetentionCleanup,
  type AccountDeletionJob,
  type RetentionAsset,
  type RetentionRepository,
  type RetentionStorage,
  type TerminalStagingObject,
} from "./retention";
import { createSchedulerStore, type SchedulerDatabaseClient } from "./store";

const NOW = new Date("2026-08-24T12:00:00.000Z");

function asset(overrides: Partial<RetentionAsset> = {}): RetentionAsset {
  return {
    id: "asset-1",
    userId: "user-1",
    storagePath: "user-1/asset-1/video.mp4",
    createdAt: "2026-08-23T12:00:00.000Z",
    terminalAt: null,
    terminalStatus: null,
    attachedToPost: false,
    approvedForPost: false,
    hasActiveReference: false,
    ...overrides,
  };
}

// Mutation target: using a strict comparison delays deletion at the documented 24-hour boundary.
test("unattached and unapproved uploads become abandoned at exactly 24 hours", () => {
  assert.equal(getDeletionEligibility(asset({ createdAt: "2026-08-23T12:00:00.001Z" }), NOW), null);
  assert.equal(getDeletionEligibility(asset(), NOW), "ABANDONED");
  assert.equal(getDeletionEligibility(asset({ attachedToPost: true }), NOW), null);
  assert.equal(getDeletionEligibility(asset({ approvedForPost: true }), NOW), null);
});

// Mutation target: using created_at or a strict comparison breaks the seven-day terminal boundary.
test("published, cancelled, and terminal-failure originals become eligible at exactly seven days", () => {
  for (const terminalStatus of ["PUBLISHED", "CANCELLED", "NEEDS_ATTENTION"] as const) {
    assert.equal(getDeletionEligibility(asset({
      createdAt: "2026-01-01T00:00:00.000Z",
      terminalAt: "2026-08-17T12:00:00.001Z",
      terminalStatus,
      attachedToPost: true,
      approvedForPost: true,
    }), NOW), null);
    assert.equal(getDeletionEligibility(asset({
      createdAt: "2026-01-01T00:00:00.000Z",
      terminalAt: "2026-08-17T12:00:00.000Z",
      terminalStatus,
      attachedToPost: true,
      approvedForPost: true,
    }), NOW), "TERMINAL");
  }
});

test("active post or attempt references always protect original media", () => {
  assert.equal(getDeletionEligibility(asset({
    terminalAt: "2026-08-01T00:00:00.000Z",
    terminalStatus: "PUBLISHED",
    attachedToPost: true,
    approvedForPost: true,
    hasActiveReference: true,
  }), NOW), null);
});

type RepositoryState = {
  media: RetentionAsset[];
  staging: TerminalStagingObject[];
  jobs: AccountDeletionJob[];
  completedMedia: Array<{ assetId: string; userId: string }>;
  completedStaging: Array<{ objectId: string; userId: string }>;
  completedJobs: Array<{ requestId: string; userId: string }>;
  failures: Array<{ target: string; errorCode: string }>;
};

function repository(overrides: Partial<RetentionRepository> = {}) {
  const state: RepositoryState = {
    media: [],
    staging: [],
    jobs: [],
    completedMedia: [],
    completedStaging: [],
    completedJobs: [],
    failures: [],
  };
  const value: RetentionRepository = {
    async claimMediaCandidates() {
      const claimed = [...state.media];
      state.media = [];
      return claimed;
    },
    async completeMediaDeletion(input) {
      state.completedMedia.push({ assetId: input.assetId, userId: input.userId });
      return true;
    },
    async recordMediaFailure(input) {
      state.failures.push({ target: input.assetId, errorCode: input.errorCode });
    },
    async claimTerminalStaging() {
      const claimed = [...state.staging];
      state.staging = [];
      return claimed;
    },
    async completeStagingDeletion(input) {
      state.completedStaging.push({ objectId: input.objectId, userId: input.userId });
      return true;
    },
    async recordStagingFailure(input) {
      state.failures.push({ target: input.objectId, errorCode: input.errorCode });
    },
    async claimAccountDeletionJobs() {
      const claimed = [...state.jobs];
      state.jobs = [];
      return claimed;
    },
    async loadAccountDeletionManifest(job) {
      return {
        ready: true,
        userId: job.userId,
        originalPaths: [`${job.userId}/original.mp4`],
        stagingPaths: [`${job.requestId}/staged.mp4`],
        recordedPublishIds: ["existing-tiktok-publish-id"],
      };
    },
    async completeAccountDeletion(input) {
      state.completedJobs.push(input);
      return true;
    },
    async markAccountDeletionAttention(input) {
      state.failures.push({ target: input.requestId, errorCode: input.errorCode });
    },
    ...overrides,
  };
  return { state, value };
}

function storage(failPath: string | null = null) {
  const removals: Array<{ bucket: string; path: string }> = [];
  const value: RetentionStorage = {
    async remove(bucket, path) {
      removals.push({ bucket, path });
      if (path === failPath) throw new Error("storage unavailable");
    },
  };
  return { removals, value };
}

test("original cleanup is idempotent and completes only the exact claimed user asset", async () => {
  const repo = repository();
  const mediaStorage = storage();
  repo.state.media.push(asset({ id: "asset-a", userId: "user-a", storagePath: "user-a/a.mp4" }));

  assert.deepEqual(await cleanupOriginalMedia(repo.value, mediaStorage.value, NOW), { checked: 1, removed: 1, failed: 0 });
  assert.deepEqual(repo.state.completedMedia, [{ assetId: "asset-a", userId: "user-a" }]);
  assert.deepEqual(await cleanupOriginalMedia(repo.value, mediaStorage.value, NOW), { checked: 0, removed: 0, failed: 0 });
  assert.deepEqual(mediaStorage.removals, [{ bucket: "tiktok-scheduler-media", path: "user-a/a.mp4" }]);
});

test("storage and database partial failures stay retryable and never claim media deletion", async () => {
  const storageFailureRepo = repository();
  storageFailureRepo.state.media.push(asset({ id: "asset-storage", storagePath: "user-1/fail.mp4" }));
  const failedStorage = storage("user-1/fail.mp4");
  assert.deepEqual(await cleanupOriginalMedia(storageFailureRepo.value, failedStorage.value, NOW), { checked: 1, removed: 0, failed: 1 });
  assert.deepEqual(storageFailureRepo.state.completedMedia, []);
  assert.deepEqual(storageFailureRepo.state.failures, [{ target: "asset-storage", errorCode: "STORAGE_REMOVE_FAILED" }]);

  const databaseFailureRepo = repository({ async completeMediaDeletion() { return false; } });
  databaseFailureRepo.state.media.push(asset({ id: "asset-db" }));
  assert.deepEqual(await cleanupOriginalMedia(databaseFailureRepo.value, storage().value, NOW), { checked: 1, removed: 0, failed: 1 });
  assert.deepEqual(databaseFailureRepo.state.failures, [{ target: "asset-db", errorCode: "DATABASE_CONFIRMATION_FAILED" }]);
});

test("terminal staging is removed immediately only after terminal reconciliation", async () => {
  const repo = repository();
  const mediaStorage = storage();
  repo.state.staging.push(
    { id: "staging-terminal", userId: "user-1", storagePath: "attempt-1/video.mp4", terminalReconciled: true },
    { id: "staging-active", userId: "user-1", storagePath: "attempt-2/video.mp4", terminalReconciled: false },
  );

  assert.deepEqual(await cleanupTerminalStaging(repo.value, mediaStorage.value, NOW), { checked: 2, removed: 1, failed: 1 });
  assert.deepEqual(mediaStorage.removals, [{ bucket: "tiktok-publishing-staging", path: "attempt-1/video.mp4" }]);
  assert.deepEqual(repo.state.completedStaging, [{ objectId: "staging-terminal", userId: "user-1" }]);
  assert.deepEqual(repo.state.failures, [{ target: "staging-active", errorCode: "TERMINAL_RECONCILIATION_REQUIRED" }]);
});

test("account deletion requires a session, same origin, and the exact confirmation body", async () => {
  const requested: string[] = [];
  const requester = { async requestAccountDeletion(userId: string) { requested.push(userId); return { requestId: "request-1", state: "REQUESTED" as const }; } };
  assert.deepEqual(await requestAccountDeletionAtBoundary({ userId: null, sameOrigin: true, confirmation: "DELETE MY SCHEDULER ACCOUNT" }, requester), { ok: false, status: 401, error: "Authentication required." });
  assert.deepEqual(await requestAccountDeletionAtBoundary({ userId: "user-1", sameOrigin: false, confirmation: "DELETE MY SCHEDULER ACCOUNT" }, requester), { ok: false, status: 403, error: "Invalid request origin." });
  assert.deepEqual(await requestAccountDeletionAtBoundary({ userId: "user-1", sameOrigin: true, confirmation: "delete my scheduler account" }, requester), { ok: false, status: 400, error: "Type the exact account deletion confirmation." });
  assert.deepEqual(await requestAccountDeletionAtBoundary({ userId: "user-1", sameOrigin: true, confirmation: "DELETE MY SCHEDULER ACCOUNT" }, requester), { ok: true, status: 202, requestId: "request-1", state: "REQUESTED" });
  assert.deepEqual(requested, ["user-1"]);
});

test("account deletion reads only the explicit form confirmation field", async () => {
  const exact = new FormData();
  exact.set("confirmation", "DELETE MY SCHEDULER ACCOUNT");
  exact.set("unrelated", "DELETE MY SCHEDULER ACCOUNT");
  assert.equal(await readAccountDeletionConfirmation(new Request("https://webgrowth.info/api/scheduler/account/delete/", {
    method: "POST",
    body: exact,
  })), "DELETE MY SCHEDULER ACCOUNT");

  const missing = new FormData();
  missing.set("unrelated", "DELETE MY SCHEDULER ACCOUNT");
  assert.equal(await readAccountDeletionConfirmation(new Request("https://webgrowth.info/api/scheduler/account/delete/", {
    method: "POST",
    body: missing,
  })), "");
});

test("account cleanup is idempotent, user-scoped, and never deletes a recorded post from TikTok", async () => {
  const repo = repository();
  const mediaStorage = storage();
  repo.state.jobs.push({ requestId: "request-a", userId: "user-a", state: "RUNNING" });

  assert.deepEqual(await cleanupAccountDeletionJobs(repo.value, mediaStorage.value, NOW), { checked: 1, completed: 1, needsAttention: 0 });
  assert.deepEqual(repo.state.completedJobs, [{ requestId: "request-a", userId: "user-a" }]);
  assert.deepEqual(mediaStorage.removals, [
    { bucket: "tiktok-scheduler-media", path: "user-a/original.mp4" },
    { bucket: "tiktok-publishing-staging", path: "request-a/staged.mp4" },
  ]);
  assert.deepEqual(await cleanupAccountDeletionJobs(repo.value, mediaStorage.value, NOW), { checked: 0, completed: 0, needsAttention: 0 });
});

test("active references and partial deletion failures move account requests to retryable attention", async () => {
  const activeRepo = repository({
    async loadAccountDeletionManifest(job) {
      return { ready: false, userId: job.userId, originalPaths: [], stagingPaths: [], recordedPublishIds: ["publish-active"] };
    },
  });
  activeRepo.state.jobs.push({ requestId: "request-active", userId: "user-1", state: "RUNNING" });
  assert.deepEqual(await cleanupAccountDeletionJobs(activeRepo.value, storage().value, NOW), { checked: 1, completed: 0, needsAttention: 1 });
  assert.deepEqual(activeRepo.state.completedJobs, []);
  assert.deepEqual(activeRepo.state.failures, [{ target: "request-active", errorCode: "ACTIVE_PUBLICATION_REFERENCE" }]);

  const databaseRepo = repository({ async completeAccountDeletion() { return false; } });
  databaseRepo.state.jobs.push({ requestId: "request-db", userId: "user-1", state: "RUNNING" });
  assert.deepEqual(await cleanupAccountDeletionJobs(databaseRepo.value, storage().value, NOW), { checked: 1, completed: 0, needsAttention: 1 });
  assert.deepEqual(databaseRepo.state.failures, [{ target: "request-db", errorCode: "DATABASE_CONFIRMATION_FAILED" }]);
});

test("the retention repository maps checked RPC results and preserves exact user scope", async () => {
  const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
  const rpcData: Record<string, unknown> = {
    claim_scheduler_media_cleanup: [{
      id: "asset-1", user_id: "user-1", storage_path: "user-1/video.mp4",
      created_at: "2026-08-23T12:00:00.000Z", terminal_at: null, terminal_status: null,
      attached_to_post: false, approved_for_post: false, has_active_reference: false,
    }],
    complete_scheduler_media_cleanup: true,
    record_scheduler_media_cleanup_failure: true,
    claim_terminal_staging_cleanup: [{
      id: "staging-1", user_id: "user-1", storage_path: "attempt-1/video.mp4", terminal_reconciled: true,
    }],
    complete_terminal_staging_cleanup: true,
    record_terminal_staging_cleanup_failure: true,
    claim_scheduler_account_deletions: [{ request_id: "request-1", user_id: "user-1", state: "RUNNING" }],
    get_scheduler_account_deletion_manifest: {
      ready: true, userId: "user-1", originalPaths: ["user-1/video.mp4"],
      stagingPaths: ["attempt-1/video.mp4"], recordedPublishIds: ["publish-1"],
    },
    complete_scheduler_account_deletion: true,
    mark_scheduler_account_deletion_attention: true,
  };
  const repository = createRetentionRepository({
    async rpc(name: string, input: Record<string, unknown>) {
      calls.push({ name, input });
      return { data: rpcData[name], error: null };
    },
  });

  assert.deepEqual(await repository.claimMediaCandidates(NOW.toISOString(), 50), [asset({ storagePath: "user-1/video.mp4" })]);
  assert.equal(await repository.completeMediaDeletion({ assetId: "asset-1", userId: "user-1", deletedAt: NOW.toISOString() }), true);
  await repository.recordMediaFailure({ assetId: "asset-1", userId: "user-1", errorCode: "STORAGE_REMOVE_FAILED" });
  assert.deepEqual(await repository.claimTerminalStaging(NOW.toISOString(), 50), [{ id: "staging-1", userId: "user-1", storagePath: "attempt-1/video.mp4", terminalReconciled: true }]);
  assert.equal(await repository.completeStagingDeletion({ objectId: "staging-1", userId: "user-1", removedAt: NOW.toISOString() }), true);
  await repository.recordStagingFailure({ objectId: "staging-1", userId: "user-1", errorCode: "STORAGE_REMOVE_FAILED" });
  const jobs = await repository.claimAccountDeletionJobs(NOW.toISOString(), 5);
  assert.deepEqual(jobs, [{ requestId: "request-1", userId: "user-1", state: "RUNNING" }]);
  assert.deepEqual(await repository.loadAccountDeletionManifest(jobs[0]!), rpcData.get_scheduler_account_deletion_manifest);
  assert.equal(await repository.completeAccountDeletion({ requestId: "request-1", userId: "user-1" }), true);
  await repository.markAccountDeletionAttention({ requestId: "request-1", userId: "user-1", errorCode: "STORAGE_REMOVE_FAILED" });

  assert.deepEqual(calls.map((call) => call.name), Object.keys(rpcData));
  assert.deepEqual(calls.at(-1)?.input, {
    p_request_id: "request-1",
    p_user_id: "user-1",
    p_error_code: "STORAGE_REMOVE_FAILED",
  });
});

test("the retention storage adapter checks both storage errors and response shape", async () => {
  const removals: Array<{ bucket: string; paths: string[] }> = [];
  const checked = createRetentionStorage({
    from(bucket: string) {
      return {
        async remove(paths: string[]) {
          removals.push({ bucket, paths });
          return { data: [], error: null };
        },
      };
    },
  });
  await checked.remove("tiktok-scheduler-media", "user-1/video.mp4");
  assert.deepEqual(removals, [{ bucket: "tiktok-scheduler-media", paths: ["user-1/video.mp4"] }]);

  const failed = createRetentionStorage({
    from() { return { async remove() { return { data: null, error: { name: "StorageApiError" } }; } }; },
  });
  await assert.rejects(failed.remove("tiktok-scheduler-media", "user-1/video.mp4"), /storage removal failed/i);

  const malformed = createRetentionStorage({
    from() { return { async remove() { return { data: null, error: null }; } }; },
  });
  await assert.rejects(malformed.remove("tiktok-scheduler-media", "user-1/video.mp4"), /invalid result/i);
});

test("one cleanup run processes deletion jobs, terminal staging, and eligible originals", async () => {
  const repo = repository();
  const mediaStorage = storage();
  repo.state.jobs.push({ requestId: "request-1", userId: "user-delete", state: "RUNNING" });
  repo.state.staging.push({ id: "staging-1", userId: "user-1", storagePath: "attempt-1/video.mp4", terminalReconciled: true });
  repo.state.media.push(asset());

  assert.deepEqual(await runRetentionCleanup(repo.value, mediaStorage.value, NOW), {
    accountDeletion: { checked: 1, completed: 1, needsAttention: 0 },
    staging: { checked: 1, removed: 1, failed: 0 },
    media: { checked: 1, removed: 1, failed: 0 },
  });
});

test("settings distinguishes disconnect from destructive deletion with an accessible exact confirmation", () => {
  const source = readFileSync(new URL("../../app/scheduler/settings/page.tsx", import.meta.url), "utf8");
  assert.match(source, /Disconnect TikTok publishing/);
  assert.match(source, /keeps your scheduler account and history/i);
  assert.match(source, /Delete scheduler account/);
  assert.match(source, /DELETE MY SCHEDULER ACCOUNT/);
  assert.match(source, /name="confirmation"/);
  assert.match(source, /aria-describedby="account-deletion-help"/);
  assert.match(source, /action="\/api\/scheduler\/account\/delete\/"/);
  assert.match(source, /required/);
});

test("disconnect uses one atomic user-scoped RPC and never targets submitted work directly", async () => {
  const calls: Array<{ kind: string; name: string; input: unknown }> = [];
  const client: SchedulerDatabaseClient = {
    async insert() { throw new Error("unexpected insert"); },
    async find() { return null; },
    async update() { throw new Error("unexpected update"); },
    async remove() { throw new Error("disconnect must not use a split delete"); },
    async rpc(name, input) {
      calls.push({ kind: "rpc", name, input });
      return name === "disconnect_tiktok_scheduler_user" ? { ok: true, cancelledJobs: 2 } : null;
    },
  };

  assert.deepEqual(await createSchedulerStore(client).disconnectUser("user-1"), { ok: true, cancelledJobs: 2 });
  assert.deepEqual(calls, [{ kind: "rpc", name: "disconnect_tiktok_scheduler_user", input: { p_user_id: "user-1" } }]);
});

test("repeated account deletion requests use one idempotent user-scoped RPC result", async () => {
  const calls: Array<{ name: string; input: unknown }> = [];
  const client: SchedulerDatabaseClient = {
    async insert() { throw new Error("unexpected insert"); },
    async find() { return null; },
    async update() { throw new Error("unexpected update"); },
    async remove() { throw new Error("unexpected remove"); },
    async rpc(name, input) {
      calls.push({ name, input });
      return name === "request_scheduler_account_deletion"
        ? { requestId: "request-1", state: "REQUESTED" }
        : null;
    },
  };
  const store = createSchedulerStore(client);

  assert.deepEqual(await store.requestAccountDeletion("user-1"), { requestId: "request-1", state: "REQUESTED" });
  assert.deepEqual(await store.requestAccountDeletion("user-1"), { requestId: "request-1", state: "REQUESTED" });
  assert.deepEqual(calls, [
    { name: "request_scheduler_account_deletion", input: { p_user_id: "user-1" } },
    { name: "request_scheduler_account_deletion", input: { p_user_id: "user-1" } },
  ]);
});

test("retention and deletion RPCs are pinned, revoked, service-role only, and cancel only safe pre-submission jobs", () => {
  const sql = readFileSync(new URL("../../../supabase/migrations/202608230001_public_scheduler_beta.sql", import.meta.url), "utf8").toLowerCase();
  for (const name of [
    "disconnect_tiktok_scheduler_user",
    "request_scheduler_account_deletion",
    "claim_scheduler_media_cleanup",
    "complete_scheduler_media_cleanup",
    "claim_terminal_staging_cleanup",
    "complete_terminal_staging_cleanup",
    "claim_scheduler_account_deletions",
    "get_scheduler_account_deletion_manifest",
    "complete_scheduler_account_deletion",
    "mark_scheduler_account_deletion_attention",
  ]) {
    const start = sql.indexOf(`create or replace function public.${name}`);
    assert.notEqual(start, -1, `${name} must exist`);
    const end = sql.indexOf("$$;", start);
    const fn = sql.slice(start, end);
    assert.match(fn, /security definer/);
    assert.match(fn, /set search_path = public/);
    assert.match(sql, new RegExp(`revoke execute on function public\\.${name}`));
  }
  const disconnectStart = sql.indexOf("create or replace function public.disconnect_tiktok_scheduler_user");
  const disconnectEnd = sql.indexOf("$$;", disconnectStart);
  const disconnect = sql.slice(disconnectStart, disconnectEnd);
  assert.match(disconnect, /status in \('scheduled', 'failed_retryable'\)/);
  assert.match(disconnect, /publish_id is null/);
  assert.match(disconnect, /not exists[\s\S]*attempt\.status in \('submitting', 'processing'\)/);
  assert.match(disconnect, /update public\.publish_attempts attempt[\s\S]*status = 'cancelled'[\s\S]*attempt\.status = 'scheduled'[\s\S]*attempt\.publish_id is null/);
  const requestStart = sql.indexOf("create or replace function public.request_scheduler_account_deletion");
  const requestEnd = sql.indexOf("$$;", requestStart);
  const deletionRequest = sql.slice(requestStart, requestEnd);
  assert.match(deletionRequest, /update public\.publish_attempts attempt[\s\S]*status = 'cancelled'[\s\S]*attempt\.status = 'scheduled'[\s\S]*attempt\.publish_id is null/);
  assert.match(deletionRequest, /v_created boolean := false/);
  assert.match(deletionRequest, /if v_created then[\s\S]*account_deletion_requested/);
  assert.match(sql, /grant execute on function public\.claim_scheduler_account_deletions[^;]*to service_role/);
  assert.match(sql, /'requested'[\s\S]*'running'[\s\S]*'complete'[\s\S]*'needs_attention'/);
});
