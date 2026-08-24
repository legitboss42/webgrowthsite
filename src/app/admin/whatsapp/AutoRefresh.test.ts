import assert from "node:assert/strict";
import test from "node:test";
import { WHATSAPP_INBOX_REFRESH_INTERVAL_MS, shouldPauseWhatsAppInboxRefresh } from "./AutoRefresh";

test("polls the WhatsApp inbox often enough for new inbound messages to appear without reload", () => {
  assert.equal(WHATSAPP_INBOX_REFRESH_INTERVAL_MS, 10_000);
});

test("pauses automatic inbox refresh while a message field is focused", () => {
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "TEXTAREA" }), true);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "INPUT" }), true);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "visible", activeTagName: "BUTTON" }), false);
  assert.equal(shouldPauseWhatsAppInboxRefresh({ visibilityState: "hidden", activeTagName: "BUTTON" }), true);
});
