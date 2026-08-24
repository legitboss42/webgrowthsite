import { shouldPollPostStatus } from "./statusPresentation";
import type { PublicStatusSnapshot } from "./statusSnapshot";

export type StatusPollingSnapshot = PublicStatusSnapshot;

export type StatusPollingEnvironment = {
  now(): number;
  isVisible(): boolean;
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
  onVisibilityChange(listener: () => void): () => void;
  fetchStatus(signal: AbortSignal): Promise<StatusPollingSnapshot>;
};

type StatusPollingOptions = {
  initial: StatusPollingSnapshot;
  onSnapshot(snapshot: StatusPollingSnapshot): void;
  onChangedStatus(snapshot: StatusPollingSnapshot): void;
};

const POLL_INTERVAL_MS = 5_000;
const MAX_BACKOFF_MS = 60_000;
const MAX_LIFETIME_MS = 15 * 60_000;

export function createStatusPollingController(environment: StatusPollingEnvironment, options: StatusPollingOptions) {
  let snapshot = options.initial;
  let deadline = 0;
  let timer: number | null = null;
  let request: AbortController | null = null;
  let inFlight = false;
  let stopped = true;
  let failures = 0;
  let unsubscribe: (() => void) | null = null;
  let resumeRequested = false;

  const clearTimer = () => {
    if (timer !== null) environment.clearTimeout(timer);
    timer = null;
  };
  const finish = () => {
    if (stopped && !unsubscribe && timer === null && !request) return;
    stopped = true;
    resumeRequested = false;
    clearTimer();
    request?.abort();
    request = null;
    inFlight = false;
    const removeVisibilityListener = unsubscribe;
    unsubscribe = null;
    removeVisibilityListener?.();
  };
  const canPoll = () => !stopped && shouldPollPostStatus(snapshot.status) && environment.now() < deadline;
  const schedule = (delay: number) => {
    clearTimer();
    if (!canPoll() || !environment.isVisible() || inFlight) return;
    timer = environment.setTimeout(tick, Math.min(delay, Math.max(0, deadline - environment.now())));
  };
  const tick = () => {
    clearTimer();
    if (!canPoll() || !environment.isVisible() || inFlight) return;
    request = new AbortController();
    inFlight = true;
    let nextDelay: number | null = null;
    environment.fetchStatus(request.signal)
      .then((next) => {
        if (stopped || request?.signal.aborted) return;
        failures = 0;
        const changed = next.status !== snapshot.status;
        snapshot = next;
        options.onSnapshot(next);
        if (changed) options.onChangedStatus(next);
        if (shouldPollPostStatus(next.status)) nextDelay = POLL_INTERVAL_MS;
        else finish();
      })
      .catch((error: unknown) => {
        if (stopped || request?.signal.aborted || (error instanceof Error && error.name === "AbortError")) return;
        const delay = Math.min(POLL_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS);
        failures += 1;
        nextDelay = delay;
      })
      .finally(() => {
        inFlight = false;
        request = null;
        if (nextDelay !== null) schedule(nextDelay);
        else if (resumeRequested && environment.isVisible() && canPoll()) schedule(0);
        resumeRequested = false;
      });
  };
  const onVisibilityChange = () => {
    if (!environment.isVisible()) {
      clearTimer();
      request?.abort();
      return;
    }
    if (canPoll() && inFlight) resumeRequested = true;
    else if (canPoll()) schedule(0);
  };

  return {
    start() {
      if (!stopped) return;
      if (!shouldPollPostStatus(snapshot.status)) return;
      stopped = false;
      deadline = environment.now() + MAX_LIFETIME_MS;
      unsubscribe = environment.onVisibilityChange(onVisibilityChange);
      schedule(POLL_INTERVAL_MS);
    },
    update(next: StatusPollingSnapshot) {
      snapshot = next;
      if (!shouldPollPostStatus(next.status)) {
        finish();
      } else if (!inFlight) {
        schedule(POLL_INTERVAL_MS);
      }
    },
    stop() {
      finish();
    },
  };
}
