import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_ACTIVE_POST_LIMIT,
  PUBLIC_DAILY_SCHEDULE_LIMIT,
  schedulePublicPostAtBoundary,
  reservePublicScheduleAtBoundary,
  type AtomicScheduleReservationStore,
} from "./quotas";

const NOW = "2026-08-24T12:00:00.000Z";
const SCHEDULED_FOR = "2026-08-24T13:00:00.000Z";

type ScheduleEvent = { scheduledAt: string };

// This is a controlled local stand-in for the PostgreSQL RPC contract. The
// production migration is separately checked for its transaction lock; real
// PostgreSQL concurrency execution is intentionally deferred to Task 12.
function quotaControlledStore(input: {
  events?: ScheduleEvent[];
  active?: number;
  waitForFirstCall?: boolean;
} = {}) {
  const events = [...(input.events ?? [])];
  let active = input.active ?? 0;
  let firstCallStarted: (() => void) | null = null;
  let releaseFirstCall: (() => void) | null = null;
  const firstCall = new Promise<void>((resolve) => { firstCallStarted = resolve; });
  const release = new Promise<void>((resolve) => { releaseFirstCall = resolve; });
  let calls = 0;
  let locked = Promise.resolve();

  const store: AtomicScheduleReservationStore = {
    async reservePublicSchedulerSlot(reservation) {
      const previous = locked;
      let unlock!: () => void;
      locked = new Promise<void>((resolve) => { unlock = resolve; });
      await previous;
      calls += 1;
      if (input.waitForFirstCall && calls === 1) {
        firstCallStarted?.();
        await release;
      }
      const now = Date.parse(reservation.nowIso);
      const dailyUsed = events.filter(({ scheduledAt }) => Date.parse(scheduledAt) >= now - 24 * 60 * 60 * 1000).length;
      if (dailyUsed >= PUBLIC_DAILY_SCHEDULE_LIMIT || active >= PUBLIC_ACTIVE_POST_LIMIT) {
        unlock();
        return false;
      }
      events.push({ scheduledAt: reservation.nowIso });
      active += 1;
      unlock();
      return true;
    },
  };

  return {
    store,
    get events() { return events; },
    get active() { return active; },
    firstCall,
    releaseFirstCall: () => releaseFirstCall?.(),
  };
}

function reserve(store: AtomicScheduleReservationStore, postId = "post-1") {
  return reservePublicScheduleAtBoundary(store, {
    userId: "creator-1",
    postId,
    scheduledForIso: SCHEDULED_FOR,
    nowIso: NOW,
  });
}

// Mutation target: moving the rolling boundary forward by one millisecond lets a
// fourth schedule bypass the fixed public daily limit.
test("the rolling 24-hour quota includes an event exactly at its boundary", async () => {
  const { store } = quotaControlledStore({
    events: [
      { scheduledAt: "2026-08-23T12:00:00.000Z" },
      { scheduledAt: "2026-08-23T12:00:00.001Z" },
      { scheduledAt: "2026-08-24T11:59:59.999Z" },
    ],
  });

  assert.deepEqual(await reserve(store), {
    ok: false,
    status: 409,
    error: "This post is no longer ready to schedule, or the public scheduler quota is full.",
  });
});

// Mutation target: raising the active queue cap or excluding a current active
// post allows a twenty-first public schedule.
test("the active future queue rejects a twenty-first post", async () => {
  const { store } = quotaControlledStore({ active: 20 });

  assert.deepEqual(await reserve(store), {
    ok: false,
    status: 409,
    error: "This post is no longer ready to schedule, or the public scheduler quota is full.",
  });
});

// Mutation target: adding an owner exception or accepting caller-provided limits
// lets a privileged account bypass the same public quota used by every creator.
test("an owner-shaped user ID has no quota bypass or caller-configured limit", async () => {
  const { store } = quotaControlledStore({ active: 20 });
  const result = await reservePublicScheduleAtBoundary(store, {
    userId: "owner-user",
    postId: "post-owner",
    scheduledForIso: SCHEDULED_FOR,
    nowIso: NOW,
  });

  assert.deepEqual(result, {
    ok: false,
    status: 409,
    error: "This post is no longer ready to schedule, or the public scheduler quota is full.",
  });
  assert.equal(PUBLIC_DAILY_SCHEDULE_LIMIT, 3);
  assert.equal(PUBLIC_ACTIVE_POST_LIMIT, 20);
});

// Mutation target: bypassing the independent emergency gate invokes the RPC
// while new scheduling has explicitly been stopped.
test("a disabled new-scheduling gate refuses before the reservation RPC", async () => {
  let calls = 0;
  const store: AtomicScheduleReservationStore = {
    async reservePublicSchedulerSlot() { calls += 1; return true; },
  };

  assert.deepEqual(await schedulePublicPostAtBoundary(store, {
    launch: { newScheduling: false },
    user: {
      status: "ACTIVE",
      suspendedAt: null,
      deletionRequestedAt: null,
      termsVersion: "2026-08-23",
      privacyVersion: "2026-08-23",
    },
    reservation: { userId: "creator-1", postId: "post-1", scheduledForIso: SCHEDULED_FOR, nowIso: NOW },
  }), { ok: false, status: 503, error: "New scheduling is temporarily unavailable." });
  assert.equal(calls, 0);
});

// Mutation target: trusting the signed session alone lets a suspended or stale
// legal account create a new public scheduling event.
test("suspended or stale-legal accounts cannot reserve a public schedule", async () => {
  let calls = 0;
  const store: AtomicScheduleReservationStore = {
    async reservePublicSchedulerSlot() { calls += 1; return true; },
  };
  const base = {
    launch: { newScheduling: true },
    reservation: { userId: "creator-1", postId: "post-1", scheduledForIso: SCHEDULED_FOR, nowIso: NOW },
  };

  for (const user of [
    { status: "SUSPENDED", suspendedAt: "2026-08-24T10:00:00.000Z", deletionRequestedAt: null, termsVersion: "2026-08-23", privacyVersion: "2026-08-23" },
    { status: "ACTIVE", suspendedAt: null, deletionRequestedAt: null, termsVersion: "2026-08-22", privacyVersion: "2026-08-23" },
  ]) {
    assert.deepEqual(await schedulePublicPostAtBoundary(store, { ...base, user }), {
      ok: false,
      status: 403,
      error: "Active scheduler access and current legal acceptance are required.",
    });
  }
  assert.equal(calls, 0);
});

// Mutation target: replacing the single reservation RPC with independent count
// and update operations permits both final concurrent requests to succeed.
test("one final available slot admits only one concurrent RPC reservation locally", async () => {
  const controlled = quotaControlledStore({ active: 19, waitForFirstCall: true });
  const first = reserve(controlled.store, "post-1");
  await controlled.firstCall;
  const second = reserve(controlled.store, "post-2");
  controlled.releaseFirstCall();

  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual([firstResult.ok, secondResult.ok], [true, false]);
  assert.equal(controlled.active, 20);
});
