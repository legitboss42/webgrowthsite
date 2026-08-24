import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryWhatsAppStore, createSupabaseWhatsAppStore, getSupabaseWhatsAppReplyContext } from "./store";

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
  assert.match(requests[1]?.body || "", /lead_temperature/);
  assert.match(requests[2]?.body || "", /PORTFOLIO_REQUEST/);
});

test("stores inbound WhatsApp audio metadata in Supabase", async () => {
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

  await store.recordInbound({
    messageId: "wamid.voice-1",
    waId: "2348000000000",
    timestamp: 1_800_000_000,
    type: "audio",
    mediaId: "media-1",
    mediaMimeType: "audio/ogg; codecs=opus",
    mediaSha256: "sha-1",
    mediaVoice: true,
  });

  const messageRequest = requests.find((request) => request.url.includes("whatsapp_messages"));
  assert.match(messageRequest?.body || "", /"message_type":"audio"/);
  assert.match(messageRequest?.body || "", /"media_id":"media-1"/);
  assert.match(messageRequest?.body || "", new RegExp('"media_mime_type":"audio/ogg; codecs=opus"'));
  assert.match(messageRequest?.body || "", /"media_sha256":"sha-1"/);
  assert.match(messageRequest?.body || "", /"media_voice":true/);
});

test("loads an active conversation's latest inbound Meta message before inbox replies", async () => {
  const context = await getSupabaseWhatsAppReplyContext(
    {
      url: "https://example.supabase.co",
      serviceRoleKey: "test-key",
      fetch: async (url) => {
        const target = String(url);
        if (target.includes("whatsapp_conversations")) {
          return new Response(JSON.stringify([{ id: "conversation-1", status: "open", whatsapp_contacts: { wa_id: "2348012345678" } }]));
        }
        return new Response(JSON.stringify([{ whatsapp_message_id: "wamid.inbound-1", message_timestamp: "2026-08-24T07:00:00.000Z" }]));
      },
    },
    "conversation-1",
    "08012345678",
  );

  assert.deepEqual(context, {
    conversationId: "conversation-1",
    waId: "2348012345678",
    replyToMessageId: "wamid.inbound-1",
    customerMessageTimestamp: Date.parse("2026-08-24T07:00:00.000Z") / 1000,
  });
});

test("records an inbox outbound reply on the selected conversation without reclassifying the lead", async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];
  const store = createSupabaseWhatsAppStore({
    url: "https://example.supabase.co",
    serviceRoleKey: "test-key",
    fetch: async (url, init) => {
      requests.push({ url: String(url), method: init?.method || "GET", body: String(init?.body || "") });
      return new Response(JSON.stringify([{ id: "message-1" }]), { status: 201 });
    },
  });

  await store.recordOutbound({
    conversationId: "conversation-1",
    messageId: "wamid.outbound-1",
    waId: "2348012345678",
    text: "Test reply from Web Growth. WhatsApp integration is working.",
    timestamp: 1_800_000_000,
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0]?.url || "", /whatsapp_conversations\?id=eq\.conversation-1/);
  assert.equal(requests[0]?.method, "PATCH");
  assert.doesNotMatch(requests[0]?.body || "", /intent|human_review_required|lead_temperature/);
  assert.match(requests[1]?.url || "", /whatsapp_messages\?on_conflict=whatsapp_message_id/);
  assert.match(requests[1]?.body || "", /"conversation_id":"conversation-1"/);
});

test("records outbound audio on the selected conversation", async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];
  const store = createSupabaseWhatsAppStore({
    url: "https://example.supabase.co",
    serviceRoleKey: "test-key",
    fetch: async (url, init) => {
      requests.push({ url: String(url), method: init?.method || "GET", body: String(init?.body || "") });
      return new Response(JSON.stringify([{ id: "message-1" }]), { status: 201 });
    },
  });

  await store.recordOutbound({
    conversationId: "conversation-1",
    messageId: "wamid.audio-outbound-1",
    waId: "2348012345678",
    timestamp: 1_800_000_000,
    type: "audio",
    mediaId: "media-outbound-1",
    mediaMimeType: "audio/ogg; codecs=opus",
    mediaVoice: true,
  });

  const messageRequest = requests.find((request) => request.url.includes("whatsapp_messages"));
  assert.match(messageRequest?.body || "", /"message_type":"audio"/);
  assert.match(messageRequest?.body || "", /"media_id":"media-outbound-1"/);
  assert.match(messageRequest?.body || "", /"media_voice":true/);
});

test("fails closed when the requested reply conversation is inactive or belongs to another contact", async () => {
  const context = await getSupabaseWhatsAppReplyContext(
    {
      url: "https://example.supabase.co",
      serviceRoleKey: "test-key",
      fetch: async () => new Response(JSON.stringify([{ id: "conversation-1", status: "closed", whatsapp_contacts: { wa_id: "2348012345678" } }])),
    },
    "conversation-1",
    "2348099999999",
  );
  assert.equal(context, null);
});
