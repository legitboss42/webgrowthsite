import assert from "node:assert/strict";
import test from "node:test";
import { createStatusPollingController, type StatusPollingSnapshot } from "./statusPolling";

class FakePollingEnvironment {
  nowValue = 0;
  visible = true;
  nextTimerId = 1;
  timers = new Map<number, { at: number; callback: () => void }>();
  listeners = new Set<() => void>();
  requests: Array<{ signal: AbortSignal; resolve: (value: StatusPollingSnapshot) => void; reject: (reason: unknown) => void }> = [];

  now = () => this.nowValue;
  isVisible = () => this.visible;
  setTimeout = (callback: () => void, delay: number) => {
    const id = this.nextTimerId++;
    this.timers.set(id, { at: this.nowValue + delay, callback });
    return id;
  };
  clearTimeout = (id: number) => { this.timers.delete(id); };
  onVisibilityChange = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  fetchStatus = (signal: AbortSignal) => new Promise<StatusPollingSnapshot>((resolve, reject) => {
    this.requests.push({ signal, resolve, reject });
    signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true });
  });
  runNextTimer() {
    const next = [...this.timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    assert.ok(next, "expected a scheduled timer");
    this.timers.delete(next[0]);
    this.nowValue = Math.max(this.nowValue, next[1].at);
    next[1].callback();
  }
  setVisible(visible: boolean) { this.visible = visible; for (const listener of this.listeners) listener(); }
}

const processing: StatusPollingSnapshot = {
  status: "PROCESSING", publishedAt: null, failureCode: null, retryEligible: false, nextRetryAt: null, nextPollAfterMs: 5_000,
};

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

test("polling pauses and aborts while hidden, then resumes without overlap", async () => {
  const env = new FakePollingEnvironment();
  const controller = createStatusPollingController(env, { initial: processing, onSnapshot() {}, onChangedStatus() {} });
  controller.start();
  env.runNextTimer();
  assert.equal(env.requests.length, 1);
  env.setVisible(false);
  assert.equal(env.requests[0]?.signal.aborted, true);
  assert.equal(env.timers.size, 0);
  env.setVisible(true);
  await settle();
  env.runNextTimer();
  assert.equal(env.requests.length, 2);
  assert.equal(env.timers.size, 0, "a pending request cannot overlap another poll");
  env.requests[1]?.resolve(processing);
  await settle();
  assert.equal(env.timers.size, 1);
  controller.stop();
});

test("polling backs off, keeps one absolute deadline across active transitions, and refreshes only changed status", async () => {
  const env = new FakePollingEnvironment();
  let refreshes = 0;
  const controller = createStatusPollingController(env, { initial: processing, onSnapshot() {}, onChangedStatus() { refreshes += 1; } });
  controller.start();
  env.runNextTimer();
  env.requests[0]?.reject(new Error("network"));
  await settle();
  assert.equal([...env.timers.values()][0]?.at, 10_000);
  env.runNextTimer();
  env.requests[1]?.resolve({ ...processing, status: "SUBMITTING" });
  await settle();
  assert.equal(refreshes, 1);
  env.nowValue = 15 * 60_000;
  env.runNextTimer();
  assert.equal(env.requests.length, 2, "the original deadline is not reset by an active status transition");
  controller.stop();
});

test("terminal status stops polling after one changed-status notification", async () => {
  const env = new FakePollingEnvironment();
  let changes = 0;
  const controller = createStatusPollingController(env, { initial: processing, onSnapshot() {}, onChangedStatus() { changes += 1; } });
  controller.start();
  env.runNextTimer();
  env.requests[0]?.resolve({ ...processing, status: "PUBLISHED", publishedAt: "2026-08-24T12:00:00.000Z", nextPollAfterMs: null });
  await settle();
  assert.equal(changes, 1);
  assert.equal(env.timers.size, 0);
  controller.stop();
});
