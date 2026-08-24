import assert from "node:assert/strict";
import test from "node:test";
import { createManualStatusRetryRunner } from "./statusRetry";

test("manual retry success updates, announces, focuses, and refreshes exactly once", async () => {
  const events: string[] = [];
  const runner = createManualStatusRetryRunner({
    async requestRetry() { return true; },
    onPending(value) { events.push(`pending:${value}`); },
    onSuccess() { events.push("success"); },
    onAnnounce(message) { events.push(message); },
    focusStatus() { events.push("focus"); },
    refresh() { events.push("refresh"); },
    onFailure() { events.push("failure"); },
  });
  assert.deepEqual(await runner.run(), { ok: true });
  assert.deepEqual(events, ["pending:true", "success", "Retry requested. This post has returned to the publishing queue.", "focus", "refresh", "pending:false"]);
});

test("manual retry failure stays truthful and never focuses or announces success", async () => {
  const events: string[] = [];
  const runner = createManualStatusRetryRunner({
    async requestRetry() { return false; },
    onPending() {}, onSuccess() { events.push("success"); }, onAnnounce() { events.push("announce"); }, focusStatus() { events.push("focus"); }, refresh() { events.push("refresh"); },
    onFailure(message) { events.push(message); },
  });
  assert.deepEqual(await runner.run(), { ok: false });
  assert.deepEqual(events, ["This post is no longer eligible for retry. Refresh the page to see its latest status."]);
});

test("manual retry coalesces concurrent clicks into one request", async () => {
  let resolveRequest!: (value: boolean) => void;
  let requests = 0;
  const runner = createManualStatusRetryRunner({
    requestRetry() { requests += 1; return new Promise<boolean>((resolve) => { resolveRequest = resolve; }); },
    onPending() {}, onSuccess() {}, onAnnounce() {}, focusStatus() {}, refresh() {}, onFailure() {},
  });
  const first = runner.run();
  const second = runner.run();
  assert.equal(requests, 1);
  assert.deepEqual(await second, { ok: false, reason: "busy" });
  resolveRequest(true);
  assert.deepEqual(await first, { ok: true });
});
