import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_INBOX_RECONCILE_INTERVAL_MS,
  WHATSAPP_INBOX_REFRESH_INTERVAL_MS,
  getWhatsAppNotificationStatusText,
  resolveWhatsAppInboxRefreshMs,
  shouldFallbackAlertInPage,
  shouldPauseWhatsAppInboxRefresh,
  shouldRefreshWhatsAppInbox,
} from "./AutoRefresh";

test("polls the WhatsApp inbox often enough for new inbound messages to appear without reload", () => {
  assert.equal(WHATSAPP_INBOX_REFRESH_INTERVAL_MS, 10_000);
});

test("a configured refresh interval is used, clamped, and falls back when unusable", () => {
  assert.equal(resolveWhatsAppInboxRefreshMs(20), 20_000);
  assert.equal(resolveWhatsAppInboxRefreshMs(undefined), WHATSAPP_INBOX_REFRESH_INTERVAL_MS);
  assert.equal(resolveWhatsAppInboxRefreshMs(Number.NaN), WHATSAPP_INBOX_REFRESH_INTERVAL_MS);
  // A hand-edited settings document must not be able to hammer the endpoint.
  assert.equal(resolveWhatsAppInboxRefreshMs(0), 5_000);
  assert.equal(resolveWhatsAppInboxRefreshMs(10_000), 300_000);
});

test("only a hidden tab pauses the inbox, never a focused message field", () => {
  // A focused textarea used to pause polling. It must not: an incoming message has to
  // land while the agent is mid-reply, and a soft refresh keeps the draft anyway.
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible" }), false);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "hidden" }), true);
});

test("refreshes on a real change, and stays quiet when nothing moved", () => {
  const now = 1_000_000;

  // No baseline yet: reconcile once so the first poll cannot miss a message that
  // arrived between the server render and this check.
  assert.equal(shouldRefreshWhatsAppInbox({ fingerprint: "a:inbound:", now }), true);

  // A new message, and a delivery receipt landing on an existing one, both move the
  // fingerprint — so both refresh the screen.
  assert.equal(
    shouldRefreshWhatsAppInbox({
      previousFingerprint: "a:inbound:",
      fingerprint: "b:outbound:accepted|a:inbound:",
      lastRefreshAt: now - 1_000,
      now,
    }),
    true,
  );
  assert.equal(
    shouldRefreshWhatsAppInbox({
      previousFingerprint: "b:outbound:sent",
      fingerprint: "b:outbound:read",
      lastRefreshAt: now - 1_000,
      now,
    }),
    true,
  );

  // Unchanged and recently reconciled: no refresh at all, which is the point.
  assert.equal(
    shouldRefreshWhatsAppInbox({
      previousFingerprint: "b:outbound:read",
      fingerprint: "b:outbound:read",
      lastRefreshAt: now - 1_000,
      now,
    }),
    false,
  );

  // Unchanged but stale: reconcile anyway, because a webhook or a poll response can be
  // delayed and the screen must not drift from the database indefinitely.
  assert.equal(
    shouldRefreshWhatsAppInbox({
      previousFingerprint: "b:outbound:read",
      fingerprint: "b:outbound:read",
      lastRefreshAt: now - WHATSAPP_INBOX_RECONCILE_INTERVAL_MS,
      now,
    }),
    true,
  );
});

test("uses an in-page mobile alert fallback when native notifications are unavailable", () => {
  assert.equal(shouldFallbackAlertInPage("unsupported"), true);
  assert.equal(shouldFallbackAlertInPage("denied"), true);
  assert.equal(shouldFallbackAlertInPage("default"), true);
  assert.equal(shouldFallbackAlertInPage("granted"), false);
});

test("explains notification limits instead of silently hiding mobile failures", () => {
  assert.match(getWhatsAppNotificationStatusText("unsupported"), /not supported/);
  assert.match(getWhatsAppNotificationStatusText("denied"), /blocked/);
  assert.match(getWhatsAppNotificationStatusText("default"), /Enable/);
  assert.match(getWhatsAppNotificationStatusText("granted"), /on/);
});
