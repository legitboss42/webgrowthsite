import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_TYPING_REFRESH_MS,
  shouldSendWhatsAppTypingSignal,
} from "./typing";
import { sendWhatsAppTypingIndicator } from "./typingServer";

// Synthetic fixture on purpose. The real production phone-number id must not be pasted
// into a test: it pins the suite to one account and travels wherever the repo travels.
const configuredEnv = {
  WHATSAPP_ACCESS_TOKEN: "test-token",
  WHATSAPP_PHONE_NUMBER_ID: "1234567890",
  WHATSAPP_API_VERSION: "v26.0",
};

const wamid = "wamid.HBgNMjM0ODA2NjcwNjMzNhUCABIYFjNFQjA=";

function metaError(code: number, status = 400) {
  return new Response(JSON.stringify({ error: { code, message: "…", type: "OAuthException" } }), {
    status,
  });
}

test("the request matches the shape Meta's own schema validation published", async () => {
  let seenUrl = "";
  let seenBody: Record<string, unknown> = {};
  let seenAuth = "";
  let seenMethod = "";

  const result = await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    {
      env: configuredEnv,
      fetch: (async (url: string, init: RequestInit) => {
        seenUrl = String(url);
        seenMethod = String(init.method);
        seenAuth = String((init.headers as Record<string, string>).Authorization);
        seenBody = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }) as unknown as typeof globalThis.fetch,
    },
  );

  assert.deepEqual(result, { sent: true });
  assert.equal(seenMethod, "POST");
  assert.equal(seenUrl, "https://graph.facebook.com/v26.0/1234567890/messages");
  assert.deepEqual(seenBody, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: wamid,
    typing_indicator: { type: "text" },
  });
  assert.equal(seenAuth, "Bearer test-token");
});

test("the token travels in the header and never in the URL or the body", async () => {
  let seenUrl = "";
  let seenBody = "";

  await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    {
      env: configuredEnv,
      fetch: (async (url: string, init: RequestInit) => {
        seenUrl = String(url);
        seenBody = String(init.body);
        return new Response("{}", { status: 200 });
      }) as unknown as typeof globalThis.fetch,
    },
  );

  assert.equal(seenUrl.includes("test-token"), false);
  assert.equal(seenBody.includes("test-token"), false);
});

test("the Graph version falls back the same way the rest of the integration does", async () => {
  const seen: string[] = [];
  const capture = (async (url: string) => {
    seen.push(String(url));
    return new Response("{}", { status: 200 });
  }) as unknown as typeof globalThis.fetch;

  await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    { env: { ...configuredEnv, WHATSAPP_API_VERSION: undefined, WHATSAPP_GRAPH_API_VERSION: "v25.0" }, fetch: capture },
  );
  await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    { env: { ...configuredEnv, WHATSAPP_API_VERSION: undefined }, fetch: capture },
  );

  assert.ok(seen[0].includes("/v25.0/"));
  assert.ok(seen[1].includes("/v26.0/"));
});

test("missing credentials report NOT_CONFIGURED without calling Meta", async () => {
  let called = false;
  const result = await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    {
      env: {},
      fetch: (async () => {
        called = true;
        throw new Error("should not be called");
      }) as unknown as typeof globalThis.fetch,
    },
  );

  assert.deepEqual(result, { sent: false, reason: "NOT_CONFIGURED" });
  assert.equal(called, false);
});

test("an empty message id is rejected before a request is made", async () => {
  let called = false;
  const result = await sendWhatsAppTypingIndicator(
    { messageId: "   " },
    {
      env: configuredEnv,
      fetch: (async () => {
        called = true;
        throw new Error("should not be called");
      }) as unknown as typeof globalThis.fetch,
    },
  );

  assert.deepEqual(result, { sent: false, reason: "INVALID_MESSAGE_ID" });
  assert.equal(called, false);
});

test("Meta's failure codes are classified the way the send path classifies them", async () => {
  const cases: Array<[Response, string]> = [
    [metaError(190, 401), "TOKEN_EXPIRED"],
    [metaError(10, 403), "PERMISSION_DENIED"],
    [metaError(200, 403), "PERMISSION_DENIED"],
    [metaError(131009), "INVALID_MESSAGE_ID"],
    [metaError(100), "INVALID_MESSAGE_ID"],
    [new Response("{}", { status: 503 }), "META_SERVICE_ERROR"],
    [new Response("{}", { status: 400 }), "API_ERROR"],
  ];

  for (const [response, reason] of cases) {
    const result = await sendWhatsAppTypingIndicator(
      { messageId: wamid },
      {
        env: configuredEnv,
        fetch: (async () => response.clone()) as unknown as typeof globalThis.fetch,
      },
    );
    assert.deepEqual(result, { sent: false, reason }, `expected ${reason}`);
  }
});

test("a network failure resolves rather than throwing, so a send is never blocked", async () => {
  const result = await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    {
      env: configuredEnv,
      fetch: (async () => {
        throw new Error("network down");
      }) as unknown as typeof globalThis.fetch,
    },
  );

  assert.deepEqual(result, { sent: false, reason: "API_ERROR" });
});

test("an unparseable error body still classifies by HTTP status", async () => {
  const result = await sendWhatsAppTypingIndicator(
    { messageId: wamid },
    {
      env: configuredEnv,
      fetch: (async () => new Response("<html>gateway</html>", { status: 502 })) as unknown as typeof globalThis.fetch,
    },
  );

  assert.deepEqual(result, { sent: false, reason: "META_SERVICE_ERROR" });
});

test("the throttle fires on the first keystroke and then once per window", () => {
  assert.equal(shouldSendWhatsAppTypingSignal({ hasDraft: true, now: 1_000 }), true);
  assert.equal(
    shouldSendWhatsAppTypingSignal({ hasDraft: true, lastSentAt: 1_000, now: 1_050 }),
    false,
  );
  assert.equal(
    shouldSendWhatsAppTypingSignal({
      hasDraft: true,
      lastSentAt: 1_000,
      now: 1_000 + WHATSAPP_TYPING_REFRESH_MS,
    }),
    true,
  );
});

test("a hundred keystrokes inside one window produce exactly one request", () => {
  let lastSentAt: number | undefined;
  let requests = 0;

  for (let keystroke = 0; keystroke < 100; keystroke += 1) {
    const now = 5_000 + keystroke * 40;
    if (shouldSendWhatsAppTypingSignal({ hasDraft: true, lastSentAt, now })) {
      requests += 1;
      lastSentAt = now;
    }
  }

  assert.equal(requests, 1);
});

test("an emptied draft stops signalling", () => {
  assert.equal(shouldSendWhatsAppTypingSignal({ hasDraft: false, now: 10_000 }), false);
  assert.equal(
    shouldSendWhatsAppTypingSignal({ hasDraft: false, lastSentAt: 1, now: 10_000_000 }),
    false,
  );
});

test("the refresh window stays inside Meta's own dismissal timeout", () => {
  assert.ok(WHATSAPP_TYPING_REFRESH_MS < 25_000);
  assert.ok(WHATSAPP_TYPING_REFRESH_MS >= 5_000);
});
