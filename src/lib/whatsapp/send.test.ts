import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWhatsAppRecipient, sendWhatsAppText } from "./send";

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
  let request: { url: string; body: Record<string, unknown>; headers: Headers } | undefined;
  const result = await sendWhatsAppText({ ...input, replyToMessageId: "wamid.customer" }, {
    now: 1_800_000_001,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone", WHATSAPP_API_VERSION: "v26.0" },
    fetch: async (url, init) => {
      request = { url: String(url), body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) };
      return new Response(JSON.stringify({ messages: [{ id: "wamid.sent" }] }), { status: 200 });
    },
  });
  assert.deepEqual(result, { sent: true, messageId: "wamid.sent" });
  assert.match(request?.url || "", /v26\.0\/phone\/messages$/);
  assert.deepEqual(request?.body.context, { message_id: "wamid.customer" });
  assert.equal(request?.body.recipient_type, "individual");
  assert.deepEqual(request?.body.text, { preview_url: false, body: input.text });
  assert.equal(request?.headers.get("authorization"), "Bearer token");
});

test("does not expose API failures or send without configuration", async () => {
  const result = await sendWhatsAppText(input, { now: 1_800_000_001, env: {} });
  assert.deepEqual(result, { sent: false, reason: "NOT_CONFIGURED" });
});

test("normalizes Nigerian WhatsApp recipients and rejects unsupported formats", () => {
  assert.equal(normalizeWhatsAppRecipient("08012345678"), "2348012345678");
  assert.equal(normalizeWhatsAppRecipient("+2348012345678"), "2348012345678");
  assert.equal(normalizeWhatsAppRecipient("2348012345678"), "2348012345678");
  assert.equal(normalizeWhatsAppRecipient("+1 415 555 2671"), null);
  assert.equal(normalizeWhatsAppRecipient("0801234"), null);
  assert.equal(normalizeWhatsAppRecipient("not-a-number"), null);
});

test("rejects malformed recipients before calling Meta", async () => {
  let called = false;
  const result = await sendWhatsAppText({ ...input, to: "not-a-number" }, {
    now: 1_800_000_001,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async () => {
      called = true;
      return new Response();
    },
  });
  assert.deepEqual(result, { sent: false, reason: "INVALID_RECIPIENT" });
  assert.equal(called, false);
});

test("classifies Meta authorization and service errors without leaking credentials", async () => {
  const result = await sendWhatsAppText(input, {
    now: 1_800_000_001,
    env: { WHATSAPP_ACCESS_TOKEN: "very-secret-token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async () =>
      new Response(JSON.stringify({ error: { message: "Invalid OAuth access token.", code: 190, fbtrace_id: "trace-123" } }), {
        status: 401,
      }),
  });
  assert.deepEqual(result, { sent: false, reason: "TOKEN_EXPIRED", diagnostic: { status: 401, code: 190, traceId: "trace-123" } });
});
