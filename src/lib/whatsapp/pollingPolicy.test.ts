import assert from "node:assert/strict";
import test from "node:test";
import {
  getWhatsAppInboxFallbackMs,
  matchesWhatsAppRealtimeScope,
  WHATSAPP_COLLABORATION_FALLBACK_MS,
  WHATSAPP_COLLABORATION_HEARTBEAT_MS,
  WHATSAPP_PRESENCE_FALLBACK_MS,
} from "./pollingPolicy";

test("Realtime inbox reconciliation never falls back faster than once a minute", () => {
  assert.equal(getWhatsAppInboxFallbackMs(5), 60_000);
  assert.equal(getWhatsAppInboxFallbackMs(10), 60_000);
  assert.equal(getWhatsAppInboxFallbackMs(120), 120_000);
  assert.equal(getWhatsAppInboxFallbackMs(999), 300_000);
});

test("matches only relevant realtime invalidation scopes", () => {
  assert.equal(matchesWhatsAppRealtimeScope({ scope: "whatsapp_messages" }, ["whatsapp_messages", "whatsapp_conversations"]), true);
  assert.equal(matchesWhatsAppRealtimeScope({ scope: "whatsapp_team_members" }, ["whatsapp_messages", "whatsapp_conversations"]), false);
  assert.equal(matchesWhatsAppRealtimeScope(null, ["whatsapp_messages"]), false);
});

test("presence and collaboration fallbacks are substantially slower than the old polling", () => {
  assert.equal(WHATSAPP_PRESENCE_FALLBACK_MS, 120_000);
  assert.equal(WHATSAPP_COLLABORATION_FALLBACK_MS, 60_000);
  assert.equal(WHATSAPP_COLLABORATION_HEARTBEAT_MS, 30_000);
});
