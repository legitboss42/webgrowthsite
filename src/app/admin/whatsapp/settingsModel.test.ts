import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_EXPECTED_TABLES,
  WHATSAPP_GRAPH_API_DEFAULT_VERSION,
  buildWhatsAppCapabilities,
  buildWhatsAppSettingRows,
  buildWhatsAppWebhookUrl,
  countMissingRequiredWhatsAppSettings,
  describeWhatsAppSettingStatus,
  isWhatsAppEnvSet,
  resolveWhatsAppGraphApiVersion,
  resolveWhatsAppVerifyTokenSource,
  summarizeWhatsAppCapabilities,
  type WhatsAppEnvRecord,
} from "./settingsModel";

/** A deliberately obvious marker so a leak is unmistakable in an assertion failure. */
const SECRET = "LEAKED-SECRET-VALUE";

const fullEnv: WhatsAppEnvRecord = {
  WHATSAPP_ACCESS_TOKEN: `${SECRET}-token`,
  WHATSAPP_PHONE_NUMBER_ID: "1234567890",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "9876543210",
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: `${SECRET}-verify`,
  META_APP_SECRET: `${SECRET}-app-secret`,
  WHATSAPP_API_VERSION: "v27.0",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: `${SECRET}-service-role`,
};

test("whitespace-only values count as absent, matching production trimming", () => {
  assert.equal(isWhatsAppEnvSet({ A: "x" }, "A"), true);
  assert.equal(isWhatsAppEnvSet({ A: "   " }, "A"), false);
  assert.equal(isWhatsAppEnvSet({ A: "" }, "A"), false);
  assert.equal(isWhatsAppEnvSet({}, "A"), false);
});

test("no secret value ever reaches a settings row", () => {
  const rows = buildWhatsAppSettingRows(fullEnv);
  assert.ok(
    !JSON.stringify(rows).includes(SECRET),
    "a credential reached the rows that render to the page",
  );
  for (const row of rows) {
    if (row.kind === "secret") {
      assert.equal(row.value, null, `${row.name} must carry presence only`);
    }
  }
});

test("no secret value reaches the capability list either", () => {
  const capabilities = buildWhatsAppCapabilities(fullEnv);
  assert.ok(!JSON.stringify(capabilities).includes(SECRET));
});

test("identifiers are shown in full because they are configuration, not credentials", () => {
  const rows = buildWhatsAppSettingRows(fullEnv);
  const phone = rows.find((row) => row.name === "WHATSAPP_PHONE_NUMBER_ID");
  assert.equal(phone?.kind, "identifier");
  assert.equal(phone?.value, "1234567890");
  assert.equal(rows.find((row) => row.name === "SUPABASE_URL")?.value, "https://project.supabase.co");
});

test("every secret in the checklist is marked required", () => {
  for (const row of buildWhatsAppSettingRows({})) {
    if (row.kind === "secret") assert.equal(row.required, true, `${row.name} should be required`);
  }
});

test("a fully configured environment reports nothing missing", () => {
  const rows = buildWhatsAppSettingRows(fullEnv);
  assert.equal(countMissingRequiredWhatsAppSettings(rows), 0);
  assert.ok(rows.every((row) => row.status !== "missing"));
});

test("an empty environment reports every required variable missing", () => {
  const rows = buildWhatsAppSettingRows({});
  // Seven required variables; the Graph API version is optional and falls back.
  assert.equal(countMissingRequiredWhatsAppSettings(rows), 7);
  const version = rows.find((row) => row.name === "WHATSAPP_API_VERSION");
  assert.equal(version?.required, false);
  assert.equal(version?.status, "default");
  assert.equal(version?.value, WHATSAPP_GRAPH_API_DEFAULT_VERSION);
});

test("the Graph API version resolves in the same order as send.ts", () => {
  assert.deepEqual(resolveWhatsAppGraphApiVersion({ WHATSAPP_API_VERSION: "v27.0" }), {
    version: "v27.0",
    source: "WHATSAPP_API_VERSION",
  });
  assert.deepEqual(resolveWhatsAppGraphApiVersion({ WHATSAPP_GRAPH_API_VERSION: "v25.0" }), {
    version: "v25.0",
    source: "WHATSAPP_GRAPH_API_VERSION",
  });
  // The canonical name wins when both are present.
  assert.equal(
    resolveWhatsAppGraphApiVersion({
      WHATSAPP_API_VERSION: "v27.0",
      WHATSAPP_GRAPH_API_VERSION: "v25.0",
    }).version,
    "v27.0",
  );
  assert.deepEqual(resolveWhatsAppGraphApiVersion({}), {
    version: WHATSAPP_GRAPH_API_DEFAULT_VERSION,
    source: "default",
  });
});

test("a Graph API version supplied by the deprecated name is flagged as legacy", () => {
  const row = buildWhatsAppSettingRows({ WHATSAPP_GRAPH_API_VERSION: "v25.0" }).find(
    (candidate) => candidate.name === "WHATSAPP_API_VERSION",
  );
  assert.equal(row?.status, "legacy");
  assert.equal(row?.suppliedBy, "WHATSAPP_GRAPH_API_VERSION");
  assert.equal(row?.value, "v25.0");
});

test("the verify token resolves in the same order as the webhook route", () => {
  assert.equal(
    resolveWhatsAppVerifyTokenSource({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: "a" }),
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  );
  assert.equal(
    resolveWhatsAppVerifyTokenSource({ WHATSAPP_VERIFY_TOKEN: "b" }),
    "WHATSAPP_VERIFY_TOKEN",
  );
  assert.equal(
    resolveWhatsAppVerifyTokenSource({
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: "a",
      WHATSAPP_VERIFY_TOKEN: "b",
    }),
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  );
  assert.equal(resolveWhatsAppVerifyTokenSource({}), null);
});

test("a verify token from the legacy name still counts as configured, and says so", () => {
  const row = buildWhatsAppSettingRows({ WHATSAPP_VERIFY_TOKEN: SECRET }).find(
    (candidate) => candidate.name === "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  );
  assert.equal(row?.status, "legacy");
  assert.equal(row?.suppliedBy, "WHATSAPP_VERIFY_TOKEN");
  assert.equal(row?.value, null);
  assert.equal(countMissingRequiredWhatsAppSettings(buildWhatsAppSettingRows({ WHATSAPP_VERIFY_TOKEN: SECRET })), 6);
});

test("status labels never read as an error for an optional default", () => {
  assert.equal(describeWhatsAppSettingStatus("set"), "Set");
  assert.equal(describeWhatsAppSettingStatus("missing"), "Missing");
  assert.equal(describeWhatsAppSettingStatus("default"), "Using default");
  assert.equal(describeWhatsAppSettingStatus("legacy"), "Legacy name");
});

test("a fully configured environment has every capability available", () => {
  const capabilities = buildWhatsAppCapabilities(fullEnv);
  const summary = summarizeWhatsAppCapabilities(capabilities);
  assert.equal(summary.total, 6);
  assert.equal(summary.available, 6);
  assert.deepEqual(summary.blocked, []);
  assert.ok(capabilities.every((capability) => capability.missing.length === 0));
});

test("an empty environment blocks every capability and names what is absent", () => {
  const capabilities = buildWhatsAppCapabilities({});
  const summary = summarizeWhatsAppCapabilities(capabilities);
  assert.equal(summary.available, 0);
  assert.equal(summary.blocked.length, 6);

  const byKey = new Map(capabilities.map((capability) => [capability.key, capability]));
  assert.deepEqual(byKey.get("send")?.missing, [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
  ]);
  assert.deepEqual(byKey.get("signature")?.missing, ["META_APP_SECRET"]);
  assert.deepEqual(byKey.get("storage")?.missing, ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
});

test("a missing business account id blocks templates and phone numbers but not sending", () => {
  const env = { ...fullEnv };
  delete env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const byKey = new Map(buildWhatsAppCapabilities(env).map((item) => [item.key, item]));

  assert.equal(byKey.get("send")?.available, true);
  assert.equal(byKey.get("templates")?.available, false);
  assert.equal(byKey.get("phoneNumbers")?.available, false);
  assert.deepEqual(byKey.get("templates")?.missing, ["WHATSAPP_BUSINESS_ACCOUNT_ID"]);
});

test("a missing app secret blocks receiving without touching sending", () => {
  const env = { ...fullEnv };
  delete env.META_APP_SECRET;
  const byKey = new Map(buildWhatsAppCapabilities(env).map((item) => [item.key, item]));

  assert.equal(byKey.get("signature")?.available, false);
  assert.equal(byKey.get("send")?.available, true);
  assert.equal(byKey.get("handshake")?.available, true);
});

test("the handshake accepts either verify token name", () => {
  const legacy = buildWhatsAppCapabilities({ WHATSAPP_VERIFY_TOKEN: "x" }).find(
    (capability) => capability.key === "handshake",
  );
  assert.equal(legacy?.available, true);
  assert.deepEqual(legacy?.missing, []);

  const neither = buildWhatsAppCapabilities({}).find(
    (capability) => capability.key === "handshake",
  );
  // The canonical name is the one to add, not the deprecated one.
  assert.deepEqual(neither?.missing, ["WHATSAPP_WEBHOOK_VERIFY_TOKEN"]);
});

test("every capability explains a consequence rather than restating the variable", () => {
  for (const capability of buildWhatsAppCapabilities({})) {
    assert.ok(capability.consequence.length > 20, `${capability.key} needs a real consequence`);
    assert.ok(
      !capability.consequence.includes("WHATSAPP_"),
      `${capability.key} should describe the symptom, not the variable name`,
    );
  }
});

test("the webhook URL is the slashed form this deployment serves", () => {
  assert.equal(
    buildWhatsAppWebhookUrl("https://webgrowth.info"),
    "https://webgrowth.info/api/whatsapp/webhook/",
  );
  // A trailing slash on the origin must not double up.
  assert.equal(
    buildWhatsAppWebhookUrl("https://webgrowth.info/"),
    "https://webgrowth.info/api/whatsapp/webhook/",
  );
});

test("the expected table list matches the applied migrations", () => {
  assert.deepEqual([...WHATSAPP_EXPECTED_TABLES], [
    "whatsapp_contacts",
    "whatsapp_conversations",
    "whatsapp_messages",
    "whatsapp_events",
    "whatsapp_quick_replies",
  ]);
});
