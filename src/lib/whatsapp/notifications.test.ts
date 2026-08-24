import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWhatsAppInboxNotification,
  shouldShowWhatsAppInboxNotification,
} from "./notifications";

test("builds a safe latest-message notification from a Supabase row", () => {
  assert.deepEqual(
    buildWhatsAppInboxNotification({
      whatsapp_message_id: "wamid.new-1",
      message_text: "Hello, I need a website redesign and tracking setup for my business this month.",
      message_timestamp: "2026-08-24T10:30:00.000Z",
      whatsapp_conversations: {
        whatsapp_contacts: {
          display_name: "Ada Client",
          wa_id: "2348012345678",
        },
      },
    }),
    {
      id: "wamid.new-1",
      title: "New WhatsApp message from Ada Client",
      body: "Hello, I need a website redesign and tracking setup for my business this month.",
      receivedAt: "2026-08-24T10:30:00.000Z",
    },
  );
});

test("falls back to WhatsApp ID and trims long notification previews", () => {
  const notification = buildWhatsAppInboxNotification({
    whatsapp_message_id: "wamid.new-2",
    message_text: "A".repeat(180),
    message_timestamp: "2026-08-24T10:30:00.000Z",
    whatsapp_conversations: {
      whatsapp_contacts: {
        wa_id: "2348012345678",
      },
    },
  });

  assert.equal(notification?.title, "New WhatsApp message from 2348012345678");
  assert.equal(notification?.body.length, 140);
  assert.match(notification?.body || "", /...$/);
});

test("only notifies after the latest inbound message changes", () => {
  const latest = {
    id: "wamid.new-3",
    title: "New WhatsApp message from Test",
    body: "Hello",
    receivedAt: "2026-08-24T10:30:00.000Z",
  };

  assert.equal(shouldShowWhatsAppInboxNotification(undefined, latest), false);
  assert.equal(shouldShowWhatsAppInboxNotification("wamid.new-3", latest), false);
  assert.equal(shouldShowWhatsAppInboxNotification("wamid.old", latest), true);
  assert.equal(shouldShowWhatsAppInboxNotification("wamid.old", null), false);
});
