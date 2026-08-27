import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryWhatsAppStore } from "./store";
import { sendInboxWhatsAppAudioReply, sendInboxWhatsAppMediaReply, sendInboxWhatsAppReply } from "./inboxReply";

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

test("stores an outbound image reply with its caption as the message text", async () => {
  const store = createMemoryWhatsAppStore();
  let sent: { kind?: string; caption?: string } = {};

  const result = await sendInboxWhatsAppMediaReply(
    {
      conversationId: baseInput.conversationId,
      waId: baseInput.waId,
      kind: "image",
      file: new Blob(["png-bytes"], { type: "image/png" }),
      filename: "mockup.png",
      mimeType: "image/png",
      caption: "  Here is the mockup  ",
      customerMessageTimestamp: baseInput.customerMessageTimestamp,
      replyToMessageId: baseInput.replyToMessageId,
    },
    {
      store,
      now: baseInput.customerMessageTimestamp + 60,
      send: async (input) => {
        sent = { kind: input.kind, caption: input.caption };
        return { sent: true, messageId: "wamid.image-1", mediaId: "media-image-1" };
      },
    },
  );

  assert.deepEqual(result, { ok: true, messageId: "wamid.image-1", mediaId: "media-image-1" });
  assert.equal(sent.kind, "image");
  assert.equal(sent.caption, "Here is the mockup");
  assert.equal(store.messages.length, 1);
  assert.equal(store.messages[0]?.messageType, "image");
  assert.equal(store.messages[0]?.text, "Here is the mockup");
  assert.equal(store.messages[0]?.mediaId, "media-image-1");
  assert.equal(store.messages[0]?.mediaFilename, "mockup.png");
  // An uploaded file is not a voice note, whatever its type.
  assert.equal(store.messages[0]?.mediaVoice, false);
});

test("stores a document reply even though it carries no caption", async () => {
  const store = createMemoryWhatsAppStore();

  const result = await sendInboxWhatsAppMediaReply(
    {
      conversationId: baseInput.conversationId,
      waId: baseInput.waId,
      kind: "document",
      file: new Blob(["pdf-bytes"], { type: "application/pdf" }),
      filename: "Proposal.pdf",
      mimeType: "application/pdf",
      customerMessageTimestamp: baseInput.customerMessageTimestamp,
    },
    {
      store,
      now: baseInput.customerMessageTimestamp + 60,
      send: async () => ({ sent: true, messageId: "wamid.doc-1", mediaId: "media-doc-1" }),
    },
  );

  assert.deepEqual(result, { ok: true, messageId: "wamid.doc-1", mediaId: "media-doc-1" });
  assert.equal(store.messages[0]?.messageType, "document");
  assert.equal(store.messages[0]?.mediaFilename, "Proposal.pdf");
});

test("does not store a media reply that Meta refused", async () => {
  const store = createMemoryWhatsAppStore();

  const result = await sendInboxWhatsAppMediaReply(
    {
      conversationId: baseInput.conversationId,
      waId: baseInput.waId,
      kind: "image",
      file: new Blob(["png-bytes"], { type: "image/png" }),
      filename: "mockup.png",
      mimeType: "image/png",
      customerMessageTimestamp: baseInput.customerMessageTimestamp,
    },
    {
      store,
      send: async () => ({ sent: false, reason: "SERVICE_WINDOW_CLOSED" }),
    },
  );

  assert.deepEqual(result, { ok: false, reason: "SERVICE_WINDOW_CLOSED" });
  assert.equal(store.messages.length, 0);
});
