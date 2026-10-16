import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_INBOX_FALLBACK_MS,
  WHATSAPP_PRESENCE_FALLBACK_MS,
  WHATSAPP_COLLABORATION_FALLBACK_MS,
  WHATSAPP_CALLS_FALLBACK_MS,
  isWhatsAppRealtimeEventRelevant,
} from "./realtime";

test("uses slow reconciliation intervals instead of short polling", () => {
  assert.equal(WHATSAPP_INBOX_FALLBACK_MS, 300_000);
  assert.equal(WHATSAPP_PRESENCE_FALLBACK_MS, 300_000);
  assert.equal(WHATSAPP_COLLABORATION_FALLBACK_MS, 60_000);
  assert.equal(WHATSAPP_CALLS_FALLBACK_MS, 30_000);
});

test("classifies workspace invalidations by feature", () => {
  assert.equal(isWhatsAppRealtimeEventRelevant("inbox", { table: "whatsapp_conversations", operation: "UPDATE" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("inbox", { table: "whatsapp_messages", operation: "INSERT" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("presence", { table: "whatsapp_team_members", operation: "UPDATE" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("presence", { table: "whatsapp_note_mentions", operation: "INSERT" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("collaboration", { table: "whatsapp_internal_notes", operation: "INSERT" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("collaboration", { table: "whatsapp_conversation_presence", operation: "UPDATE" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("calls", { table: "whatsapp_calls", operation: "INSERT" }), true);
  assert.equal(isWhatsAppRealtimeEventRelevant("calls", { table: "whatsapp_messages", operation: "INSERT" }), false);
});
