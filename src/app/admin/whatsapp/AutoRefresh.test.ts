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

test("uses a slow reconciliation fallback because Realtime is the primary inbox path", () => {
  assert.equal(WHATSAPP_INBOX_REFRESH_INTERVAL_MS, 300_000);
});

test("a configured fallback interval is clamped to a safe reconciliation range", () => {
  assert.equal(resolveWhatsAppInboxRefreshMs(20), 60_000);
  assert.equal(resolveWhatsAppInboxRefreshMs(undefined), WHATSAPP_INBOX_REFRESH_INTERVAL_MS);
  assert.equal(resolveWhatsAppInboxRefreshMs(Number.NaN), WHATSAPP_INBOX_REFRESH_INTERVAL_MS);
  // A hand-edited settings document must not be able to recreate rapid polling.
  assert.equal(resolveWhatsAppInboxRefreshMs(0), 60_000);
  assert.equal(resolveWhatsAppInboxRefreshMs(10_000), 300_000);
});

test("only a hidden tab pauses the inbox, never a focused message field", () => {
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible" }), false);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "hidden" }), true);
});

test("refreshes on a real change, and stays quiet when nothing moved", () => {
  const now = 1_000_000;

  assert.equal(shouldRefreshWhatsAppInbox({ fingerprint: "a:inbound:", now }), true);

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

  assert.equal(
    shouldRefreshWhatsAppInbox({
      previousFingerprint: "b:outbound:read",
      fingerprint: "b:outbound:read",
      lastRefreshAt: now - 1_000,
      now,
    }),
    false,
  );

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
