import test from "node:test";
import assert from "node:assert/strict";
import {
  countWhatsAppTemplatesByStatus,
  fetchWhatsAppTemplates,
  getWhatsAppTemplateBodyText,
  listWhatsAppTemplateVariables,
  normalizeWhatsAppTemplate,
  sortWhatsAppTemplates,
} from "./templates";

// The exact shape Meta returned for the connected account's hello_world template.
const helloWorld = {
  id: "1368798785343290",
  name: "hello_world",
  status: "APPROVED",
  category: "UTILITY",
  language: "en_US",
  components: [
    { type: "HEADER", format: "TEXT", text: "Hello World" },
    { type: "BODY", text: "Welcome and congratulations!!" },
    { type: "FOOTER", text: "WhatsApp Business Platform sample message" },
  ],
};

const configuredEnv = {
  WHATSAPP_ACCESS_TOKEN: "test-token",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "123456789012345",
  WHATSAPP_API_VERSION: "v26.0",
};

test("a real Meta template normalizes into the model", () => {
  const template = normalizeWhatsAppTemplate(helloWorld);

  assert.equal(template.id, "1368798785343290");
  assert.equal(template.name, "hello_world");
  assert.equal(template.status, "APPROVED");
  assert.equal(template.category, "UTILITY");
  assert.equal(template.language, "en_US");
  assert.equal(template.components.length, 3);
  assert.equal(getWhatsAppTemplateBodyText(template), "Welcome and congratulations!!");
});

test("unknown statuses and component types degrade instead of throwing", () => {
  const template = normalizeWhatsAppTemplate({
    id: "1",
    name: "odd",
    status: "SOMETHING_NEW",
    components: [{ type: "CAROUSEL" }, "not-an-object"],
  });

  assert.equal(template.status, "UNKNOWN");
  assert.equal(template.components[0].type, "UNKNOWN");
});

test("missing components produce an empty list, not a crash", () => {
  assert.deepEqual(normalizeWhatsAppTemplate({ id: "1", name: "x" }).components, []);
  assert.equal(getWhatsAppTemplateBodyText(normalizeWhatsAppTemplate({ id: "1", name: "x" })), undefined);
});

test("buttons are normalized and omitted when absent", () => {
  const withButtons = normalizeWhatsAppTemplate({
    id: "1",
    name: "x",
    components: [
      { type: "BUTTONS", buttons: [{ type: "url", text: "Visit", url: "https://example.test" }] },
      { type: "BODY", text: "hi" },
    ],
  });

  assert.equal(withButtons.components[0].buttons?.length, 1);
  assert.equal(withButtons.components[0].buttons?.[0].type, "URL");
  assert.equal(withButtons.components[0].buttons?.[0].text, "Visit");
  assert.equal(withButtons.components[1].buttons, undefined);
});

test("template variables are listed in order without duplicates", () => {
  assert.deepEqual(listWhatsAppTemplateVariables("Hi {{1}}, your {{2}} is ready. Thanks {{1}}!"), [
    "1",
    "2",
  ]);
  assert.deepEqual(listWhatsAppTemplateVariables("Hello {{ name }}"), ["name"]);
  assert.deepEqual(listWhatsAppTemplateVariables("No variables here"), []);
  assert.deepEqual(listWhatsAppTemplateVariables(undefined), []);
});

test("status counts include every known bucket", () => {
  const counts = countWhatsAppTemplatesByStatus([
    normalizeWhatsAppTemplate(helloWorld),
    normalizeWhatsAppTemplate({ id: "2", name: "b", status: "PENDING" }),
  ]);

  assert.equal(counts.ALL, 2);
  assert.equal(counts.APPROVED, 1);
  assert.equal(counts.PENDING, 1);
  assert.equal(counts.REJECTED, 0);
});

test("approved templates sort ahead of the rest, then alphabetically", () => {
  const sorted = sortWhatsAppTemplates([
    normalizeWhatsAppTemplate({ id: "1", name: "zeta", status: "APPROVED" }),
    normalizeWhatsAppTemplate({ id: "2", name: "alpha", status: "PENDING" }),
    normalizeWhatsAppTemplate({ id: "3", name: "beta", status: "APPROVED" }),
  ]);

  assert.deepEqual(sorted.map((template) => template.name), ["beta", "zeta", "alpha"]);
});

test("missing credentials report NOT_CONFIGURED without calling Meta", async () => {
  let called = false;
  const result = await fetchWhatsAppTemplates({
    env: {},
    fetch: (async () => {
      called = true;
      throw new Error("should not be called");
    }) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(result, { ok: false, reason: "NOT_CONFIGURED" });
  assert.equal(called, false);
});

test("a configured account requests templates with the token in the header only", async () => {
  let seenUrl = "";
  let seenAuth = "";

  const result = await fetchWhatsAppTemplates({
    env: configuredEnv,
    fetch: (async (url: string, init: RequestInit) => {
      seenUrl = String(url);
      seenAuth = String((init.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify({ data: [helloWorld] }), { status: 200 });
    }) as unknown as typeof globalThis.fetch,
  });

  assert.ok(seenUrl.includes("/v26.0/123456789012345/message_templates"));
  assert.equal(seenAuth, "Bearer test-token");
  // The credential must never be placed in the query string.
  assert.equal(seenUrl.includes("test-token"), false);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.templates[0].name, "hello_world");
});

test("auth failures are reported as PERMISSION_DENIED and other errors as API_ERROR", async () => {
  const denied = await fetchWhatsAppTemplates({
    env: configuredEnv,
    fetch: (async () => new Response("nope", { status: 403 })) as unknown as typeof globalThis.fetch,
  });
  const broken = await fetchWhatsAppTemplates({
    env: configuredEnv,
    fetch: (async () => new Response("boom", { status: 500 })) as unknown as typeof globalThis.fetch,
  });
  const offline = await fetchWhatsAppTemplates({
    env: configuredEnv,
    fetch: (async () => {
      throw new Error("network down");
    }) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(denied, { ok: false, reason: "PERMISSION_DENIED" });
  assert.deepEqual(broken, { ok: false, reason: "API_ERROR" });
  assert.deepEqual(offline, { ok: false, reason: "API_ERROR" });
});

test("a malformed payload yields an empty list rather than throwing", async () => {
  const result = await fetchWhatsAppTemplates({
    env: configuredEnv,
    fetch: (async () => new Response("not json", { status: 200 })) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(result, { ok: true, templates: [] });
});
