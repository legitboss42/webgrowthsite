import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryWhatsAppStore } from "./store";
import { sendInboxWhatsAppAudioReply, sendInboxWhatsAppReply } from "./inboxReply";

const baseInput = {
  conversationId: "conversation-1",
  waId: "2348000000000",
  text: "Thanks for reaching out. Could you share your website URL so I can review it properly?",
  customerMessageTimestamp: 1_800_000_000,
  replyToMessageId: "wamid.inbound-1",
};

test("stores an outbound inbox reply after Meta accepts the message", async () => {
  const store = createMemoryWhatsAppStore();
  const sentPayloads: Array<Record<string, unknown>> = [];

  const result = await sendInboxWhatsAppReply(baseInput, {
    store,
    now: baseInput.customerMessageTimestamp + 60,
    send: async (input) => {
      sentPayloads.push(input as unknown as Record<string, unknown>);
      return { sent: true, messageId: "wamid.outbound-1" };
    },
  });

  assert.deepEqual(result, { ok: true, messageId: "wamid.outbound-1" });
  assert.equal(sentPayloads.length, 1);
  assert.equal(sentPayloads[0]?.to, baseInput.waId);
  assert.equal(store.messages.length, 1);
  assert.equal(store.messages[0]?.messageId, "wamid.outbound-1");
  assert.equal(store.messages[0]?.direction, "outbound");
});

test("does not store an outbound inbox reply when Meta sender credentials are not configured", async () => {
  const store = createMemoryWhatsAppStore();

  const result = await sendInboxWhatsAppReply(baseInput, {
    store,
    send: async () => ({ sent: false, reason: "NOT_CONFIGURED" }),
  });

  assert.deepEqual(result, { ok: false, reason: "NOT_CONFIGURED" });
  assert.equal(store.messages.length, 0);
});

test("trims reply text before sending the message", async () => {
  const store = createMemoryWhatsAppStore();
  let sentText = "";

  const result = await sendInboxWhatsAppReply(
    { ...baseInput, text: "  Hello there  " },
    {
      store,
      now: baseInput.customerMessageTimestamp + 60,
      send: async (input) => {
        sentText = input.text;
        return { sent: true, messageId: "wamid.outbound-2" };
      },
    },
  );

  assert.deepEqual(result, { ok: true, messageId: "wamid.outbound-2" });
  assert.equal(sentText, "Hello there");
});

test("stores an outbound inbox audio reply after Meta accepts the message", async () => {
  const store = createMemoryWhatsAppStore();
  const audio = new Blob(["voice-data"], { type: "audio/ogg; codecs=opus" });

  const result = await sendInboxWhatsAppAudioReply(
    {
      conversationId: baseInput.conversationId,
      waId: baseInput.waId,
      audio,
      filename: "reply.ogg",
      mimeType: "audio/ogg; codecs=opus",
      customerMessageTimestamp: baseInput.customerMessageTimestamp,
      replyToMessageId: baseInput.replyToMessageId,
    },
    {
      store,
      now: baseInput.customerMessageTimestamp + 60,
      send: async () => ({ sent: true, messageId: "wamid.audio-1", mediaId: "media-audio-1" }),
    },
  );

  assert.deepEqual(result, { ok: true, messageId: "wamid.audio-1", mediaId: "media-audio-1" });
  assert.equal(store.messages[0]?.messageId, "wamid.audio-1");
  assert.equal(store.messages[0]?.messageType, "audio");
  assert.equal(store.messages[0]?.mediaId, "media-audio-1");
  assert.equal(store.messages[0]?.mediaVoice, true);
});
