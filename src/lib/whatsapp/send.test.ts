import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWhatsAppRecipient, sendWhatsAppAudio, sendWhatsAppMedia, sendWhatsAppText } from "./send";

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

test("uploads and sends an audio reply through Meta's official media and messages endpoints", async () => {
  const requests: Array<{ url: string; method: string; bodyType: string; json?: Record<string, unknown> }> = [];
  const audio = new Blob(["voice-data"], { type: "audio/ogg; codecs=opus" });

  const result = await sendWhatsAppAudio({
    to: "08012345678",
    audio,
    filename: "reply.ogg",
    mimeType: "audio/ogg; codecs=opus",
    customerMessageTimestamp: 1_800_000_000,
    replyToMessageId: "wamid.customer",
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone", WHATSAPP_API_VERSION: "v26.0" },
    fetch: async (url, init) => {
      const bodyType = init?.body instanceof FormData ? "form-data" : "json";
      const request = { url: String(url), method: init?.method || "GET", bodyType } as { url: string; method: string; bodyType: string; json?: Record<string, unknown> };
      if (bodyType === "json") request.json = JSON.parse(String(init?.body));
      requests.push(request);
      if (String(url).endsWith("/media")) return new Response(JSON.stringify({ id: "media-upload-1" }), { status: 200 });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.audio-sent" }] }), { status: 200 });
    },
  });

  assert.deepEqual(result, { sent: true, messageId: "wamid.audio-sent", mediaId: "media-upload-1" });
  assert.match(requests[0]?.url || "", /v26\.0\/phone\/media$/);
  assert.equal(requests[0]?.bodyType, "form-data");
  assert.match(requests[1]?.url || "", /v26\.0\/phone\/messages$/);
  assert.deepEqual(requests[1]?.json, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "2348012345678",
    type: "audio",
    audio: { id: "media-upload-1" },
    context: { message_id: "wamid.customer" },
  });
});

test("rejects unsupported audio formats before uploading to Meta", async () => {
  let called = false;
  const result = await sendWhatsAppAudio({
    to: "08012345678",
    audio: new Blob(["voice-data"], { type: "audio/webm" }),
    filename: "reply.webm",
    mimeType: "audio/webm",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async () => {
      called = true;
      return new Response();
    },
  });

  assert.deepEqual(result, { sent: false, reason: "UNSUPPORTED_MEDIA_TYPE" });
  assert.equal(called, false);
});

test("uploads an image and sends it with the caption Meta allows", async () => {
  const requests: Array<{ url: string; bodyType: string; json?: Record<string, unknown> }> = [];

  const result = await sendWhatsAppMedia({
    to: "08012345678",
    kind: "image",
    file: new Blob(["png-bytes"], { type: "image/png" }),
    filename: "mockup.png",
    mimeType: "image/png",
    caption: "  Here is the mockup  ",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone", WHATSAPP_API_VERSION: "v26.0" },
    fetch: async (url, init) => {
      const bodyType = init?.body instanceof FormData ? "form-data" : "json";
      const request = { url: String(url), bodyType } as { url: string; bodyType: string; json?: Record<string, unknown> };
      if (bodyType === "json") request.json = JSON.parse(String(init?.body));
      requests.push(request);
      if (String(url).endsWith("/media")) return new Response(JSON.stringify({ id: "media-image-1" }), { status: 200 });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.image-sent" }] }), { status: 200 });
    },
  });

  assert.deepEqual(result, { sent: true, messageId: "wamid.image-sent", mediaId: "media-image-1" });
  assert.equal(requests[0]?.bodyType, "form-data");
  assert.deepEqual(requests[1]?.json, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "2348012345678",
    type: "image",
    image: { id: "media-image-1", caption: "Here is the mockup" },
  });
});

test("sends a document with its filename, which Meta shows on the bubble", async () => {
  let sendBody: Record<string, unknown> | undefined;

  const result = await sendWhatsAppMedia({
    to: "08012345678",
    kind: "document",
    file: new Blob(["pdf-bytes"], { type: "application/pdf" }),
    filename: "Proposal.pdf",
    mimeType: "application/pdf",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async (url, init) => {
      if (String(url).endsWith("/media")) return new Response(JSON.stringify({ id: "media-doc-1" }), { status: 200 });
      sendBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ messages: [{ id: "wamid.doc-sent" }] }), { status: 200 });
    },
  });

  assert.deepEqual(result, { sent: true, messageId: "wamid.doc-sent", mediaId: "media-doc-1" });
  assert.deepEqual(sendBody?.document, { id: "media-doc-1", filename: "Proposal.pdf" });
});

test("never attaches a caption to an audio message, because Meta rejects one", async () => {
  let sendBody: Record<string, unknown> | undefined;

  await sendWhatsAppMedia({
    to: "08012345678",
    kind: "audio",
    file: new Blob(["voice-data"], { type: "audio/ogg; codecs=opus" }),
    filename: "note.ogg",
    mimeType: "audio/ogg; codecs=opus",
    caption: "Should not be sent",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async (url, init) => {
      if (String(url).endsWith("/media")) return new Response(JSON.stringify({ id: "media-audio-1" }), { status: 200 });
      sendBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ messages: [{ id: "wamid.audio-sent" }] }), { status: 200 });
    },
  });

  assert.deepEqual(sendBody?.audio, { id: "media-audio-1" });
});

test("rejects a file that does not match the kind it was sent as, before uploading", async () => {
  let called = false;
  const result = await sendWhatsAppMedia({
    to: "08012345678",
    kind: "image",
    file: new Blob(["webp-bytes"], { type: "image/webp" }),
    filename: "shot.webp",
    mimeType: "image/webp",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_000_100,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async () => {
      called = true;
      return new Response();
    },
  });

  assert.deepEqual(result, { sent: false, reason: "UNSUPPORTED_MEDIA_TYPE" });
  assert.equal(called, false);
});

test("will not upload media at all once the customer service window has closed", async () => {
  let called = false;
  const result = await sendWhatsAppMedia({
    to: "08012345678",
    kind: "image",
    file: new Blob(["png-bytes"], { type: "image/png" }),
    filename: "shot.png",
    mimeType: "image/png",
    customerMessageTimestamp: 1_800_000_000,
  }, {
    now: 1_800_086_401,
    env: { WHATSAPP_ACCESS_TOKEN: "token", WHATSAPP_PHONE_NUMBER_ID: "phone" },
    fetch: async () => {
      called = true;
      return new Response();
    },
  });

  assert.deepEqual(result, { sent: false, reason: "SERVICE_WINDOW_CLOSED" });
  assert.equal(called, false);
});
