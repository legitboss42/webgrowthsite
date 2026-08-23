export const PUBLIC_DAILY_SCHEDULE_LIMIT = 3;
export const PUBLIC_ACTIVE_POST_LIMIT = 20;

export type PublicScheduleReservationInput = {
  userId: string;
  postId: string;
  scheduledForIso: string;
  nowIso: string;
};

export type AtomicScheduleReservationStore = {
  reservePublicSchedulerSlot(input: PublicScheduleReservationInput): Promise<boolean>;
};

export type ScheduleReservationUser = {
  status: string | null;
  suspendedAt: string | null;
  deletionRequestedAt: string | null;
  termsVersion: string | null;
  privacyVersion: string | null;
};

function reservationUnavailable() {
  return {
    ok: false as const,
    status: 409,
    error: "This post is no longer ready to schedule, or the public scheduler quota is full.",
  };
}

function sanitizedDatabaseError(cause: unknown): string {
  if (cause instanceof Error && /^Scheduler database operation failed \([A-Za-z0-9_]+\)\.$/.test(cause.message)) {
    return cause.message;
  }
  return "Unable to reserve public schedule.";
}

export async function reservePublicScheduleAtBoundary(
  store: AtomicScheduleReservationStore,
  input: PublicScheduleReservationInput,
) {
  try {
    if (await store.reservePublicSchedulerSlot(input)) {
      return { ok: true as const, status: 200, postId: input.postId, scheduledFor: input.scheduledForIso };
    }
    // The boolean SQL contract deliberately combines a stale/ownership race and
    // fixed-capacity refusal. Do not falsely label either one as a quota error.
    return reservationUnavailable();
  } catch (cause) {
    return { ok: false as const, status: 502, error: sanitizedDatabaseError(cause) };
  }
}

export async function schedulePublicPostAtBoundary(
  store: AtomicScheduleReservationStore,
  input: {
    launch: Pick<SchedulerLaunchState, "newScheduling">;
    user: ScheduleReservationUser;
    reservation: PublicScheduleReservationInput;
  },
) {
  if (!input.launch.newScheduling) {
    return { ok: false as const, status: 503, error: "New scheduling is temporarily unavailable." };
  }
  if (!canMutateSchedulerContent(input.user)) {
    return {
      ok: false as const,
      status: 403,
      error: "Active scheduler access and current legal acceptance are required.",
    };
  }
  return reservePublicScheduleAtBoundary(store, input.reservation);
}
import type { SchedulerLaunchState } from "./launch";
import { canMutateSchedulerContent } from "./media";
