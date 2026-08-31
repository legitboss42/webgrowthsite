import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import {
  isValidMetaSignature,
  parseWhatsAppWebhook,
  processWhatsAppWebhook,
  verifyWebhook,
} from "./webhook";

test("returns the Meta challenge only for the configured verify token", async () => {
  const response = verifyWebhook(new URL("https://webgrowth.info/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=expected&hub.challenge=abc"), "expected");
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "abc");
});

test("rejects invalid webhook verification and signatures", () => {
  assert.equal(verifyWebhook(new URL("https://x/?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc"), "expected").status, 403);
  assert.equal(isValidMetaSignature("{}", "sha256=bad", "secret"), false);
});

test("normalizes an inbound text message and a delivery status", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: {
      contacts: [{ wa_id: "2348000000000", profile: { name: "Ada" } }],
      messages: [{ id: "wamid.inbound", from: "2348000000000", timestamp: "1800000000", type: "text", text: { body: "Please show me your portfolio" } }],
      statuses: [{ id: "wamid.outbound", status: "delivered", timestamp: "1800000001", recipient_id: "2348000000000" }],
    } }] }],
  };
  const parsed = parseWhatsAppWebhook(payload);
  assert.equal(parsed.messages[0]?.messageId, "wamid.inbound");
  assert.equal(parsed.messages[0]?.displayName, "Ada");
  assert.equal(parsed.statuses[0]?.status, "delivered");
});

test("normalizes an inbound WhatsApp voice note with its media id", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: {
      contacts: [{ wa_id: "2348000000000", profile: { name: "Ada" } }],
      messages: [{
        id: "wamid.voice",
        from: "2348000000000",
        timestamp: "1800000000",
        type: "audio",
        audio: { id: "media-voice-1", mime_type: "audio/ogg; codecs=opus", sha256: "hash", voice: true },
      }],
    } }] }],
  };

  const parsed = parseWhatsAppWebhook(payload);

  assert.deepEqual(parsed.messages[0], {
    messageId: "wamid.voice",
    waId: "2348000000000",
    displayName: "Ada",
    text: undefined,
    timestamp: 1_800_000_000,
    type: "audio",
    mediaId: "media-voice-1",
    mediaMimeType: "audio/ogg; codecs=opus",
    mediaSha256: "hash",
    mediaVoice: true,
    mediaFilename: undefined,
  });
});

test("normalizes inbound image, video and document metadata", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: {
      contacts: [{ wa_id: "2348000000000", profile: { name: "Ada" } }],
      messages: [
        {
          id: "wamid.image",
          from: "2348000000000",
          timestamp: "1800000000",
          type: "image",
          image: { id: "media-image-1", mime_type: "image/jpeg", sha256: "image-hash", caption: "Photo caption" },
        },
        {
          id: "wamid.video",
          from: "2348000000000",
          timestamp: "1800000001",
          type: "video",
          video: { id: "media-video-1", mime_type: "video/mp4", sha256: "video-hash", caption: "Video caption" },
        },
        {
          id: "wamid.document",
          from: "2348000000000",
          timestamp: "1800000002",
          type: "document",
          document: {
            id: "media-document-1",
            mime_type: "application/pdf",
            sha256: "document-hash",
            filename: "Proposal.pdf",
            caption: "Proposal attached",
          },
        },
      ],
    } }] }],
  };

  const parsed = parseWhatsAppWebhook(payload);
  assert.equal(parsed.messages[0]?.mediaId, "media-image-1");
  assert.equal(parsed.messages[0]?.mediaMimeType, "image/jpeg");
  assert.equal(parsed.messages[0]?.mediaSha256, "image-hash");
  assert.equal(parsed.messages[0]?.text, "Photo caption");

  assert.equal(parsed.messages[1]?.mediaId, "media-video-1");
  assert.equal(parsed.messages[1]?.mediaMimeType, "video/mp4");
  assert.equal(parsed.messages[1]?.mediaSha256, "video-hash");
  assert.equal(parsed.messages[1]?.text, "Video caption");

  assert.equal(parsed.messages[2]?.mediaId, "media-document-1");
  assert.equal(parsed.messages[2]?.mediaMimeType, "application/pdf");
  assert.equal(parsed.messages[2]?.mediaSha256, "document-hash");
  assert.equal(parsed.messages[2]?.mediaFilename, "Proposal.pdf");
  assert.equal(parsed.messages[2]?.text, "Proposal attached");
});

test("accepts a correct Meta signature", () => {
  const raw = '{"object":"whatsapp_business_account"}';
  const signature = `sha256=${createHmac("sha256", "secret").update(raw).digest("hex")}`;
  assert.equal(isValidMetaSignature(raw, signature, "secret"), true);
});

test("processes an inbound message only once and updates delivery status", async () => {
  const recorded: string[] = [];
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: {
      contacts: [{ wa_id: "2348000000000", profile: { name: "Ada" } }],
      messages: [{ id: "wamid.inbound", from: "2348000000000", timestamp: "1800000000", type: "text", text: { body: "Portfolio please" } }],
      statuses: [{ id: "wamid.outbound", status: "delivered", timestamp: "1800000001" }],
    } }] }],
  };
  await processWhatsAppWebhook(payload, {
    async recordInbound(message) { recorded.push(`in:${message.messageId}`); return { duplicate: false }; },
    async updateMessageStatus(messageId, status) { recorded.push(`status:${messageId}:${status}`); },
  });
  assert.deepEqual(recorded, ["in:wamid.inbound", "status:wamid.outbound:delivered"]);
});

test("sends one safe portfolio reply and never replies to a duplicate event", async () => {
  const replies: string[] = [];
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [{ id: "wamid.portfolio", from: "2348000000000", timestamp: "1800000000", type: "text", text: { body: "Can I see your portfolio?" } }] } }] }],
  };
  const store = {
    async recordInbound() { return { duplicate: replies.length > 0 }; },
    async updateMessageStatus() {},
    async recordOutbound() {},
  };
  const send = async ({ text }: { text: string }) => { replies.push(text); return { sent: true as const, messageId: "wamid.reply" }; };
  await processWhatsAppWebhook(payload, store, send);
  await processWhatsAppWebhook(payload, store, send);
  assert.equal(replies.length, 1);
  assert.match(replies[0] || "", /webgrowth\.info\/portfolio/);
});

test("a message matching an operator spam keyword is stored but never auto-replied to", async () => {
  const replies: string[] = [];
  const stored: string[] = [];
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [{ id: "wamid.spam", from: "2348000000000", timestamp: "1800000000", type: "text", text: { body: "Cheap loan, what is your price?" } }] } }] }],
  };
  const store = {
    async recordInbound(message: { messageId: string }) { stored.push(message.messageId); return { duplicate: false }; },
    async updateMessageStatus() {},
    async recordOutbound() {},
  };
  const send = async ({ text }: { text: string }) => { replies.push(text); return { sent: true as const, messageId: "wamid.reply" }; };

  await processWhatsAppWebhook(payload, store, send);
  assert.equal(replies.length, 1);

  await processWhatsAppWebhook(payload, store, send, { leadKeywords: { hot: [], warm: [], spam: ["loan"] } });
  assert.equal(replies.length, 1, "the spam keyword must suppress the auto-reply");
  assert.deepEqual(stored, ["wamid.spam", "wamid.spam"], "the message is still recorded either way");
});
