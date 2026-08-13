import assert from "node:assert/strict";
import test from "node:test";
import { sendWhatsAppText } from "./send";

const input = {
  to: "2348000000000",
  text: "Here is our portfolio: https://webgrowth.info/portfolio/",
  customerMessageTimestamp: 1_800_000_000,
};

test("does not send a free-form reply after the customer service window", async () => {
  const result = await sendWhatsAppText(input, {
    now: 1_800_086_401,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
  });
  assert.deepEqual(result, { sent: false, reason: "SERVICE_WINDOW_CLOSED" });
});

test("sends a text reply with context through Meta's messages endpoint", async () => {
  let request: { url: string; body: Record<string, unknown> } | undefined;
  const result = await sendWhatsAppText({ ...input, replyToMessageId: "wamid.customer" }, {
    now: 1_800_000_001,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone", WHATSAPP_GRAPH_API_VERSION: "v23.0" },
    fetch: async (url, init) => {
      request = { url: String(url), body: JSON.parse(String(init?.body)) };
      return new Response(JSON.stringify({ messages: [{ id: "wamid.sent" }] }), { status: 200 });
    },
  });
  assert.deepEqual(result, { sent: true, messageId: "wamid.sent" });
  assert.match(request?.url || "", /v23\.0\/phone\/messages$/);
  assert.deepEqual(request?.body.context, { message_id: "wamid.customer" });
});

test("does not expose API failures or send without configuration", async () => {
  const result = await sendWhatsAppText(input, { now: 1_800_000_001, env: {} });
  assert.deepEqual(result, { sent: false, reason: "NOT_CONFIGURED" });
});
