import test from "node:test";
import assert from "node:assert/strict";
import {
  createWhatsAppTemplate,
  fetchWhatsAppTemplates,
  sendWhatsAppTemplateMessage,
} from "./templates";

const env = {
  WHATSAPP_ACCESS_TOKEN: "token",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "waba",
  WHATSAPP_PHONE_NUMBER_ID: "phone",
  WHATSAPP_API_VERSION: "v26.0",
};

test("template fetch normalizes rejection and quality metadata", async () => {
  const result = await fetchWhatsAppTemplates({
    env,
    fetch: async () => new Response(JSON.stringify({ data: [{
      id: "1",
      name: "order_update",
      status: "REJECTED",
      category: "UTILITY",
      language: "en_US",
      rejected_reason: "INVALID_FORMAT",
      quality_score: { score: "GREEN" },
      components: [{ type: "BODY", text: "Hello {{1}}" }],
    }] }), { status: 200 }),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.templates[0].rejectedReason, "INVALID_FORMAT");
  assert.equal(result.templates[0].qualityScore, "GREEN");
});

test("create posts the WABA message_templates payload", async () => {
  let body: unknown;
  const result = await createWhatsAppTemplate({
    name: "order_update",
    language: "en_US",
    category: "UTILITY",
    headerText: "Hello {{1}}",
    bodyText: "Order {{1}} is ready",
    footerText: "Thanks",
    variableExamples: { "header:1": "Victor", "body:1": "WG-100" },
    buttons: [],
  }, {
    env,
    fetch: async (_url, init) => {
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ id: "meta-1", status: "PENDING", category: "UTILITY" }), { status: 200 });
    },
  });
  assert.equal(result.ok, true);
  assert.equal((body as { name?: string }).name, "order_update");
  assert.ok(Array.isArray((body as { components?: unknown[] }).components));
});

test("template test send targets the messages endpoint with parameters", async () => {
  let requestUrl = "";
  let body: Record<string, unknown> = {};
  const result = await sendWhatsAppTemplateMessage({
    to: "08066706336",
    name: "order_update",
    language: "en_US",
    headerParameters: ["Victor"],
    bodyParameters: ["WG-100"],
  }, {
    env,
    fetch: async (url, init) => {
      requestUrl = String(url);
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ messages: [{ id: "wamid.test" }] }), { status: 200 });
    },
  });
  assert.equal(result.ok, true);
  assert.match(requestUrl, /\/phone\/messages$/);
  assert.equal(body.type, "template");
  assert.equal(body.to, "2348066706336");
});

test("invalid test recipient is rejected before Meta", async () => {
  let called = false;
  const result = await sendWhatsAppTemplateMessage({
    to: "123",
    name: "hello_world",
    language: "en_US",
  }, { env, fetch: async () => { called = true; return new Response(); } });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});
