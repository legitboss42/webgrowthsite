import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_INBOX_ACTIVITY_LIMIT,
  buildWhatsAppInboxActivity,
  buildWhatsAppInboxFingerprint,
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

test("the activity fingerprint changes for a new message in either direction", () => {
  const inboundOnly = buildWhatsAppInboxFingerprint([
    { whatsapp_message_id: "wamid.2", direction: "inbound" },
  ]);
  const withReply = buildWhatsAppInboxFingerprint([
    { whatsapp_message_id: "wamid.3", direction: "outbound", delivery_status: "accepted" },
    { whatsapp_message_id: "wamid.2", direction: "inbound" },
  ]);

  assert.notEqual(inboundOnly, withReply);
  // Same rows, same digest: an idle inbox must produce no change at all.
  assert.equal(
    withReply,
    buildWhatsAppInboxFingerprint([
      { whatsapp_message_id: "wamid.3", direction: "outbound", delivery_status: "accepted" },
      { whatsapp_message_id: "wamid.2", direction: "inbound" },
    ]),
  );
});

test("the activity fingerprint changes when a delivery status moves", () => {
  const sent = buildWhatsAppInboxFingerprint([
    { whatsapp_message_id: "wamid.3", direction: "outbound", delivery_status: "sent" },
  ]);
  const read = buildWhatsAppInboxFingerprint([
    { whatsapp_message_id: "wamid.3", direction: "outbound", delivery_status: "read" },
  ]);
  const failed = buildWhatsAppInboxFingerprint([
    { whatsapp_message_id: "wamid.3", direction: "outbound", delivery_status: "failed" },
  ]);

  assert.notEqual(sent, read);
  assert.notEqual(read, failed);
});

test("activity picks the newest inbound message out of a two-way window", () => {
  const activity = buildWhatsAppInboxActivity([
    { whatsapp_message_id: "wamid.out", direction: "outbound", delivery_status: "sent", message_timestamp: "2026-08-24T10:32:00.000Z" },
    {
      whatsapp_message_id: "wamid.in",
      direction: "inbound",
      message_text: "Hello",
      message_timestamp: "2026-08-24T10:30:00.000Z",
      whatsapp_conversations: { whatsapp_contacts: { display_name: "Ada Client" } },
    },
  ]);

  assert.equal(activity.latest?.id, "wamid.in");
  assert.equal(activity.latest?.title, "New WhatsApp message from Ada Client");
  assert.match(activity.fingerprint, /wamid\.out:outbound:sent/);
});

test("an all-outbound window reports no inbound alert rather than a wrong one", () => {
  const activity = buildWhatsAppInboxActivity([
    { whatsapp_message_id: "wamid.out", direction: "outbound", delivery_status: "sent" },
  ]);

  assert.equal(activity.latest, null);
  assert.equal(activity.fingerprint, "wamid.out:outbound:sent");
});

test("the activity window stays small enough to poll frequently", () => {
  assert.equal(WHATSAPP_INBOX_ACTIVITY_LIMIT, 12);
});
