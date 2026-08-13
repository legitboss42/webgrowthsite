import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryWhatsAppStore, createSupabaseWhatsAppStore } from "./store";

const inbound = {
  messageId: "wamid.test-1",
  waId: "2348000000000",
  displayName: "Test Lead",
  text: "Can I see your portfolio?",
  timestamp: 1_800_000_000,
};

test("does not duplicate a retried Meta message", async () => {
  const store = createMemoryWhatsAppStore();
  await store.recordInbound(inbound);
  await store.recordInbound(inbound);

  assert.equal(store.events.length, 1);
  assert.equal(store.contacts.length, 1);
  assert.equal(store.conversations.length, 1);
  assert.equal(store.messages.length, 1);
});

test("updates an existing outbound message delivery status", async () => {
  const store = createMemoryWhatsAppStore();
  await store.recordOutbound({
    messageId: "wamid.outbound-1",
    waId: inbound.waId,
    text: "Hello",
    timestamp: inbound.timestamp,
  });
  await store.updateMessageStatus("wamid.outbound-1", "delivered");
  assert.equal(store.messages[0]?.deliveryStatus, "delivered");
});

test("records the webhook event before writing CRM records to Supabase", async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];
  const store = createSupabaseWhatsAppStore({
    url: "https://example.supabase.co",
    serviceRoleKey: "test-key",
    fetch: async (url, init) => {
      requests.push({ url: String(url), method: init?.method || "GET", body: String(init?.body || "") });
      if (String(url).includes("whatsapp_events")) return new Response(JSON.stringify([{ id: "event-1" }]), { status: 201 });
      if (String(url).includes("whatsapp_contacts")) return new Response(JSON.stringify([{ id: "contact-1" }]), { status: 201 });
      if (String(url).includes("whatsapp_conversations")) return new Response(JSON.stringify([{ id: "conversation-1" }]), { status: 201 });
      return new Response(JSON.stringify([{ id: "message-1" }]), { status: 201 });
    },
  });
  await store.recordInbound(inbound);
  assert.match(requests[0]?.url || "", /whatsapp_events/);
  assert.match(requests[0]?.body || "", /wamid\.test-1/);
  assert.match(requests[3]?.url || "", /whatsapp_messages/);
});
