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
