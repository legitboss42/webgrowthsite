import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_INBOX_REFRESH_INTERVAL_MS,
  getWhatsAppNotificationStatusText,
  shouldFallbackAlertInPage,
  shouldPauseWhatsAppInboxRefresh,
} from "./AutoRefresh";

test("polls the WhatsApp inbox often enough for new inbound messages to appear without reload", () => {
  assert.equal(WHATSAPP_INBOX_REFRESH_INTERVAL_MS, 10_000);
});

test("pauses automatic inbox refresh while a message field is focused", () => {
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "TEXTAREA" }), true);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "INPUT" }), true);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "BUTTON" }), false);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "hidden", activeTagName: "BUTTON" }), true);
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
