import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  MAX_PUBLISH_ATTEMPTS,
  assessPublishReadiness,
  buildWorkerFailureState,
  classifyPublishFailure,
  classifyRetryEligibility,
  createRetryRpcStore,
  nextAttemptNumber,
  planCurrentAttempt,
  retryBackoffMs,
  retryPostAtBoundary,
  type RetryAttempt,
} from "./retry";

const migrationPath = new URL(
  "../../../supabase/migrations/202608230001_public_scheduler_beta.sql",
  import.meta.url,
);

function attempt(overrides: Partial<RetryAttempt> = {}): RetryAttempt {
  return {
    id: "attempt-1",
    approvalId: "approval-1",
    requestFingerprint: "fingerprint-1",
    attemptNumber: 1,
    status: "FAILED_RETRYABLE",
    publishId: null,
    errorCode: "PRE_ACCEPTANCE_INFRASTRUCTURE",
    ...overrides,
  };
}

function retryInput(overrides: Record<string, unknown> = {}) {
  return {
    launch: { directPost: true },
    userId: "user-1",
    user: {
      status: "ACTIVE",
      suspendedAt: null,
      deletionRequestedAt: null,
      termsVersion: "2026-08-23",
      privacyVersion: "2026-08-23",
    },
    post: {
      id: "post-1",
      userId: "user-1",
      status: "FAILED_RETRYABLE",
      approvalId: "approval-1",
      retryEligible: true,
      terminalAt: null,
    },
    approval: {
      id: "approval-1",
      postId: "post-1",
      userId: "user-1",
      fingerprint: "fingerprint-1",
      invalidatedAt: null,
    },
    attempt: attempt(),
    ...overrides,
  };
}

// Mutation target: treating a creator-info/network outage like an accepted Direct Post could suppress safe retries.
test("safe pre-acceptance infrastructure failures are automatic retry candidates", () => {
  assert.equal(classifyRetryEligibility(attempt()), "AUTOMATIC");
  assert.deepEqual(classifyPublishFailure(new Error("socket token=secret"), "PRE_ACCEPTANCE"), {
    kind: "SAFE",
    errorCode: "PRE_ACCEPTANCE_INFRASTRUCTURE",
  });
});

// Mutation target: requiring publish_id to be null for every retry would prevent a creator retry after a proven terminal rejection.
test("a proven TikTok terminal media failure requires an explicit creator retry", () => {
  assert.equal(classifyRetryEligibility(attempt({
    status: "NEEDS_ATTENTION",
    publishId: "publish-old",
    errorCode: "FILE_FORMAT_CHECK_FAILED",
  })), "USER");
});

// Mutation target: allowing a processing publish ID or ambiguous init failure to retry could create a duplicate TikTok post.
test("recorded publish IDs and ambiguous post-acceptance failures are not retryable", () => {
  assert.equal(classifyRetryEligibility(attempt({ status: "PROCESSING", publishId: "publish-live", errorCode: null })), "NONE");
  assert.equal(classifyRetryEligibility(attempt({ status: "NEEDS_ATTENTION", errorCode: "POST_ACCEPTANCE_AMBIGUOUS" })), "NONE");
  assert.deepEqual(classifyPublishFailure(new Error("provider detail"), "PROVIDER_MUTATION"), {
    kind: "AMBIGUOUS",
    errorCode: "POST_ACCEPTANCE_AMBIGUOUS",
  });
});

test("bounded exponential retry delay has stable first and maximum boundaries", () => {
  assert.equal(retryBackoffMs(1), 60_000);
  assert.equal(retryBackoffMs(2), 120_000);
  assert.equal(retryBackoffMs(99), 15 * 60_000);
  assert.equal(classifyRetryEligibility(attempt({ attemptNumber: MAX_PUBLISH_ATTEMPTS })), "NONE");
});

// Mutation target: deriving from the last array item rather than max can reuse an attempt number after unordered reads.
test("the next numbered attempt appends after the maximum without changing history", () => {
  const attempts = [
    attempt({ id: "attempt-2", attemptNumber: 2, publishId: "publish-old", status: "NEEDS_ATTENTION", errorCode: "FILE_FORMAT_CHECK_FAILED" }),
    attempt({ id: "attempt-1", attemptNumber: 1 }),
  ];
  const before = structuredClone(attempts);
  assert.equal(nextAttemptNumber(attempts), 3);
  assert.deepEqual(attempts, before);
  assert.equal(attempts[0]?.publishId, "publish-old");
});

test("worker selects the highest numbered matching attempt instead of a fingerprint-only singleton", () => {
  const attempts = [
    attempt({ id: "old", attemptNumber: 1 }),
    attempt({ id: "other-approval", approvalId: "approval-2", attemptNumber: 9 }),
    attempt({ id: "current", attemptNumber: 3, status: "SCHEDULED", errorCode: null }),
    attempt({ id: "middle", attemptNumber: 2 }),
  ];
  assert.deepEqual(planCurrentAttempt(attempts, "approval-1", "fingerprint-1"), {
    action: "USE",
    attempt: attempts[2],
    attemptNumber: 3,
  });
  assert.deepEqual(planCurrentAttempt([], "approval-1", "fingerprint-1"), {
    action: "CREATE",
    attempt: null,
    attemptNumber: 1,
  });
});

test("worker creates a new number after a safe failure but only reconciles a recorded publish ID", () => {
  const failed = attempt({ id: "failed", attemptNumber: 2 });
  assert.deepEqual(planCurrentAttempt([failed], "approval-1", "fingerprint-1"), {
    action: "CREATE",
    attempt: failed,
    attemptNumber: 3,
  });
  const recorded = attempt({ id: "recorded", attemptNumber: 2, status: "PROCESSING", publishId: "publish-2", errorCode: null });
  assert.deepEqual(planCurrentAttempt([recorded], "approval-1", "fingerprint-1"), {
    action: "RECONCILE",
    attempt: recorded,
    attemptNumber: 2,
  });
  const uncertain = attempt({ id: "uncertain", attemptNumber: 2, status: "SUBMITTING", errorCode: null });
  assert.equal(planCurrentAttempt([uncertain], "approval-1", "fingerprint-1").action, "ATTENTION");
});

test("worker rechecks current media evidence and creator settings before provider submission", () => {
  const base = {
    kind: "VIDEO" as const,
    approval: {
      privacyLevel: "PUBLIC_TO_EVERYONE" as const,
      allowComment: true,
      allowDuet: false,
      allowStitch: false,
    },
    media: [{
      validationStatus: "VALID",
      validationVersion: "tiktok-video-beta-v2",
      durationSeconds: 120,
    }],
    creator: {
      privacyLevelOptions: ["SELF_ONLY" as const],
      commentDisabled: false,
      duetDisabled: false,
      stitchDisabled: false,
      maxVideoPostDurationSeconds: 180,
    },
    currentVideoValidationVersion: "tiktok-video-beta-v2",
    publicPostingEnabled: false,
  };
  assert.deepEqual(assessPublishReadiness(base), { ok: true, privacyLevel: "SELF_ONLY" });
  assert.deepEqual(assessPublishReadiness({
    ...base,
    media: [{ ...base.media[0]!, validationVersion: "stale-v1" }],
  }), { ok: false, errorCode: "MEDIA_VALIDATION_STALE" });
  assert.deepEqual(assessPublishReadiness({
    ...base,
    media: [{ ...base.media[0]!, durationSeconds: 181 }],
  }), { ok: false, errorCode: "CREATOR_VIDEO_LIMIT_CHANGED" });
  assert.deepEqual(assessPublishReadiness({
    ...base,
    creator: { ...base.creator, commentDisabled: true },
  }), { ok: false, errorCode: "CREATOR_SETTINGS_CHANGED" });
});

test("safe worker failure state schedules bounded backoff while ambiguity terminates retry", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");
  assert.deepEqual(buildWorkerFailureState(attempt(), new Error("secret network"), now), {
    attempt: { status: "FAILED_RETRYABLE", error_code: "PRE_ACCEPTANCE_INFRASTRUCTURE" },
    post: {
      status: "FAILED_RETRYABLE",
      retry_eligible: true,
      next_retry_at: "2026-08-24T12:01:00.000Z",
      user_failure_code: "PUBLISH_RETRY_SCHEDULED",
      terminal_at: null,
    },
    errorCode: "PRE_ACCEPTANCE_INFRASTRUCTURE",
  });
  const ambiguous = new Error("provider secret");
  const ambiguousState = buildWorkerFailureState(attempt(), ambiguous, now, "PROVIDER_MUTATION");
  assert.equal(ambiguousState.attempt.status, "NEEDS_ATTENTION");
  assert.equal(ambiguousState.post.retry_eligible, false);
  assert.equal(ambiguousState.post.terminal_at, now.toISOString());
  assert.doesNotMatch(JSON.stringify(ambiguousState), /provider secret/);
});

test("a durable publish ID always stays in reconciliation instead of automatic retry", () => {
  const state = buildWorkerFailureState(attempt({
    status: "PROCESSING",
    publishId: "publish-durable",
    errorCode: null,
  }), new Error("status write outage"), new Date("2026-08-24T12:00:00.000Z"));
  assert.equal(state.attempt.status, "NEEDS_ATTENTION");
  assert.equal(state.attempt.error_code, "POST_ACCEPTANCE_AMBIGUOUS");
  assert.equal(state.post.retry_eligible, false);
  assert.equal(state.post.user_failure_code, "PUBLISH_RECONCILIATION_REQUIRED");
  assert.equal("publish_id" in state.attempt, false);
});

// Mutation target: changing RPC names/arguments could bypass the server-owned owner lock.
test("retry RPC store sends only the exact owned post arguments", async () => {
  const calls: Array<{ name: string; input: Record<string, unknown> }> = [];
  const store = createRetryRpcStore({
    async rpc(name, input) {
      calls.push({ name, input });
      return { data: 2, error: null };
    },
  });
  assert.equal(await store.createSafePublishRetry({ postId: "post-1", userId: "user-1" }), 2);
  assert.deepEqual(calls, [{
    name: "create_safe_publish_retry",
    input: { p_post_id: "post-1", p_user_id: "user-1" },
  }]);
});

// Mutation target: accepting stale approval identity/fingerprint could publish content the creator did not approve.
test("changed approval is refused before the retry RPC", async () => {
  let calls = 0;
  const result = await retryPostAtBoundary({
    async createSafePublishRetry() { calls += 1; return 2; },
  }, retryInput({
    approval: {
      id: "approval-1", postId: "post-1", userId: "user-1",
      fingerprint: "changed", invalidatedAt: null,
    },
  }));
  assert.equal(calls, 0);
  assert.deepEqual(result, {
    ok: false,
    status: 409,
    error: "This post is no longer eligible for retry.",
  });
});

test("inactive legal state and the Direct Post emergency gate fail before retry mutation", async () => {
  let calls = 0;
  const store = { async createSafePublishRetry() { calls += 1; return 2; } };
  const disabled = await retryPostAtBoundary(store, retryInput({ launch: { directPost: false } }));
  const suspended = await retryPostAtBoundary(store, retryInput({
    user: {
      status: "ACTIVE", suspendedAt: "2026-08-24T00:00:00.000Z", deletionRequestedAt: null,
      termsVersion: "2026-08-23", privacyVersion: "2026-08-23",
    },
  }));
  assert.equal(calls, 0);
  assert.equal(disabled.status, 503);
  assert.equal(suspended.status, 403);
});

test("concurrent retry clicks yield one new number and one truthful conflict", async () => {
  let allocated = false;
  const store = {
    async createSafePublishRetry() {
      await Promise.resolve();
      if (allocated) return null;
      allocated = true;
      return 2;
    },
  };
  const [first, second] = await Promise.all([
    retryPostAtBoundary(store, retryInput()),
    retryPostAtBoundary(store, retryInput()),
  ]);
  assert.deepEqual([first, second], [
    { ok: true, status: 200, postId: "post-1", attemptNumber: 2 },
    { ok: false, status: 409, error: "This post is no longer eligible for retry." },
  ]);
});

// Mutation target: returning provider/database exception text can expose credentials or internal identifiers.
test("retry infrastructure failures are sanitized", async () => {
  const result = await retryPostAtBoundary({
    async createSafePublishRetry() { throw new Error("service_role=secret database host"); },
  }, retryInput());
  assert.deepEqual(result, {
    ok: false,
    status: 502,
    error: "Unable to schedule retry.",
  });
  assert.doesNotMatch(JSON.stringify(result), /secret|service_role|database host/);
});

// These structural mutation checks are the local substitute for applying the explicitly deferred migration.
test("numbered retry SQL locks current policy and appends without clearing historical publish IDs", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();
  const retryStart = sql.indexOf("create or replace function public.create_safe_publish_retry");
  const retryEnd = sql.indexOf("create or replace function public.create_public_scheduler_post", retryStart);
  const retrySql = sql.slice(retryStart, retryEnd);
  assert.match(retrySql, /from public\.scheduler_users user_record[\s\S]*user_record\.status = 'active'[\s\S]*user_record\.suspended_at is null[\s\S]*user_record\.deletion_requested_at is null[\s\S]*user_record\.terms_version = '2026-08-23'[\s\S]*user_record\.privacy_version = '2026-08-23'[\s\S]*for update/);
  assert.match(retrySql, /approval\.fingerprint = attempt\.request_fingerprint/);
  assert.match(retrySql, /max\(attempt\.attempt_number\)/);
  assert.match(retrySql, /v_last_attempt_number >= 5/);
  assert.match(retrySql, /attempt\.status in \('scheduled', 'submitting', 'processing'\)/);
  assert.match(retrySql, /v_current_error_code in \([\s\S]*'file_format_check_failed'/);
  assert.doesNotMatch(retrySql, /set[\s\S]*publish_id\s*=\s*null/);
  assert.match(retrySql, /claim_token = null/);
  assert.match(retrySql, /claimed_at = null/);
  assert.match(sql, /grant execute on function public\.create_safe_publish_retry\(uuid, uuid\) to service_role/);
});

test("beta claim SQL admits only current active users and due automatic retries", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();
  const claimStart = sql.indexOf("create or replace function public.claim_due_tiktok_posts");
  const claimEnd = sql.indexOf("create or replace function public.reserve_public_scheduler_slot", claimStart);
  const claimSql = sql.slice(claimStart, claimEnd);
  assert.notEqual(claimStart, -1);
  assert.match(claimSql, /join public\.scheduler_users user_record/);
  assert.match(claimSql, /user_record\.status = 'active'/);
  assert.match(claimSql, /user_record\.suspended_at is null/);
  assert.match(claimSql, /user_record\.deletion_requested_at is null/);
  assert.match(claimSql, /user_record\.terms_version = '2026-08-23'/);
  assert.match(claimSql, /user_record\.privacy_version = '2026-08-23'/);
  assert.match(claimSql, /post\.status = 'failed_retryable'[\s\S]*post\.next_retry_at is not null[\s\S]*post\.next_retry_at <= p_now/);
  assert.match(claimSql, /post\.terminal_at is null/);
});
