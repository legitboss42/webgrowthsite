import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppContactTimeline } from "./contactTimelineModel";

test("contact timeline merges messages, calls, and useful CRM activity in reverse chronological order", () => {
  const items = buildWhatsAppContactTimeline({
    messages: [
      {
        id: "m1",
        direction: "inbound",
        message_type: "text",
        message_text: "Hello",
        message_timestamp: "2026-09-01T08:00:00.000Z",
      },
    ],
    calls: [
      {
        call_id: "c1",
        direction: "outbound",
        status: "ended",
        duration_seconds: 75,
        started_at: "2026-09-01T09:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "a1",
        event_type: "contact_updated",
        actor_email: "owner@example.com",
        metadata: { fields: ["tags", "lead_stage"] },
        created_at: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "a2",
        event_type: "conversation_reply_sent",
        created_at: "2026-09-01T10:01:00.000Z",
      },
    ],
  });

  assert.deepEqual(items.map((item) => item.kind), ["activity", "call", "message"]);
  assert.equal(items[0]?.title, "Contact updated");
  assert.equal(items[0]?.detail, "Changed: tags, lead_stage");
  assert.equal(items[1]?.detail, "ended · 1m 15s");
  assert.equal(items[2]?.detail, "Hello");
});

test("timeline de-duplicates activity rows and supports media-only messages", () => {
  const activity = {
    id: "same",
    event_type: "internal_note_created",
    actor_email: "agent@example.com",
    created_at: "2026-09-01T08:00:00.000Z",
  };
  const items = buildWhatsAppContactTimeline({
    messages: [
      {
        id: "voice",
        direction: "outbound",
        message_type: "audio",
        media_voice: true,
        message_timestamp: "2026-09-01T07:00:00.000Z",
      },
    ],
    activities: [activity, activity],
  });

  assert.equal(items.length, 2);
  assert.equal(items.find((item) => item.kind === "message")?.detail, "Voice note");
  assert.equal(items.find((item) => item.kind === "activity")?.title, "Internal note added");
});
