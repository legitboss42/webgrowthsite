import test from "node:test";
import assert from "node:assert/strict";
import {
  describeWhatsAppMessagingTier,
  describeWhatsAppQuality,
  fetchWhatsAppPhoneNumbers,
  findConfiguredWhatsAppSender,
  humanizeWhatsAppEnum,
  normalizeWhatsAppPhoneNumber,
} from "./phoneNumbers";

// The exact payload Meta returned for the connected account, with the number masked.
const liveNumber = {
  id: "1192139290658384",
  display_phone_number: "+234 806 670 6336",
  verified_name: "Web Growth Digital Services",
  quality_rating: "GREEN",
  code_verification_status: "VERIFIED",
  name_status: "AVAILABLE_WITHOUT_REVIEW",
  platform_type: "CLOUD_API",
  throughput: { level: "STANDARD" },
  messaging_limit_tier: "TIER_250",
  is_official_business_account: false,
  account_mode: "LIVE",
  webhook_configuration: { application: "https://webgrowth.info/api/whatsapp/webhook/" },
};

const configuredEnv = {
  WHATSAPP_ACCESS_TOKEN: "test-token",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "123456789012345",
  WHATSAPP_PHONE_NUMBER_ID: "1192139290658384",
  WHATSAPP_API_VERSION: "v26.0",
};

test("the live Meta payload normalizes into the model", () => {
  const number = normalizeWhatsAppPhoneNumber(liveNumber);

  assert.equal(number.id, "1192139290658384");
  assert.equal(number.displayPhoneNumber, "+234 806 670 6336");
  assert.equal(number.verifiedName, "Web Growth Digital Services");
  assert.equal(number.qualityRating, "GREEN");
  assert.equal(number.codeVerificationStatus, "VERIFIED");
  assert.equal(number.throughputLevel, "STANDARD");
  assert.equal(number.messagingLimitTier, "TIER_250");
  assert.equal(number.isOfficialBusinessAccount, false);
  assert.equal(number.accountMode, "LIVE");
  assert.equal(number.webhookUrl, "https://webgrowth.info/api/whatsapp/webhook/");
});

test("missing nested objects and unknown ratings degrade safely", () => {
  const number = normalizeWhatsAppPhoneNumber({ id: "1", quality_rating: "PLAID" });

  assert.equal(number.qualityRating, "UNKNOWN");
  assert.equal(number.throughputLevel, undefined);
  assert.equal(number.webhookUrl, undefined);
  assert.equal(number.isOfficialBusinessAccount, undefined);
});

test("quality ratings map to Meta's own wording", () => {
  assert.equal(describeWhatsAppQuality("GREEN"), "High");
  assert.equal(describeWhatsAppQuality("YELLOW"), "Medium");
  assert.equal(describeWhatsAppQuality("RED"), "Low");
  assert.equal(describeWhatsAppQuality("UNKNOWN"), "Not rated yet");
});

test("messaging tiers are described, and an unknown tier shows its raw value", () => {
  assert.equal(
    describeWhatsAppMessagingTier("TIER_250"),
    "250 business-initiated conversations / 24h",
  );
  assert.equal(
    describeWhatsAppMessagingTier("tier_1k"),
    "1,000 business-initiated conversations / 24h",
  );
  assert.equal(describeWhatsAppMessagingTier("TIER_5M"), "TIER_5M");
  assert.equal(describeWhatsAppMessagingTier(undefined), undefined);
});

test("enum values are humanized", () => {
  assert.equal(humanizeWhatsAppEnum("AVAILABLE_WITHOUT_REVIEW"), "Available without review");
  assert.equal(humanizeWhatsAppEnum("CLOUD_API"), "Cloud api");
  assert.equal(humanizeWhatsAppEnum(undefined), undefined);
});

test("missing credentials report NOT_CONFIGURED without calling Meta", async () => {
  let called = false;
  const result = await fetchWhatsAppPhoneNumbers({
    env: {},
    fetch: (async () => {
      called = true;
      throw new Error("should not be called");
    }) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(result, { ok: false, reason: "NOT_CONFIGURED" });
  assert.equal(called, false);
});

test("the token travels in the header and never in the URL", async () => {
  let seenUrl = "";
  let seenAuth = "";

  const result = await fetchWhatsAppPhoneNumbers({
    env: configuredEnv,
    fetch: (async (url: string, init: RequestInit) => {
      seenUrl = String(url);
      seenAuth = String((init.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify({ data: [liveNumber] }), { status: 200 });
    }) as unknown as typeof globalThis.fetch,
  });

  assert.ok(seenUrl.includes("/v26.0/123456789012345/phone_numbers"));
  assert.equal(seenAuth, "Bearer test-token");
  assert.equal(seenUrl.includes("test-token"), false);
  assert.equal(result.ok, true);
});

test("every field the page needs is requested in one call", async () => {
  let seenUrl = "";
  await fetchWhatsAppPhoneNumbers({
    env: configuredEnv,
    fetch: (async (url: string) => {
      seenUrl = String(url);
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as unknown as typeof globalThis.fetch,
  });

  for (const field of [
    "quality_rating",
    "messaging_limit_tier",
    "code_verification_status",
    "throughput",
    "webhook_configuration",
    "account_mode",
  ]) {
    assert.ok(seenUrl.includes(field), `expected ${field} in the field list`);
  }
});

test("auth failures are PERMISSION_DENIED and everything else is API_ERROR", async () => {
  const denied = await fetchWhatsAppPhoneNumbers({
    env: configuredEnv,
    fetch: (async () => new Response("no", { status: 401 })) as unknown as typeof globalThis.fetch,
  });
  const broken = await fetchWhatsAppPhoneNumbers({
    env: configuredEnv,
    fetch: (async () => new Response("no", { status: 500 })) as unknown as typeof globalThis.fetch,
  });
  const offline = await fetchWhatsAppPhoneNumbers({
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
  const result = await fetchWhatsAppPhoneNumbers({
    env: configuredEnv,
    fetch: (async () => new Response("nope", { status: 200 })) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(result, { ok: true, phoneNumbers: [] });
});

test("the configured sender is matched by phone number id", () => {
  const numbers = [
    normalizeWhatsAppPhoneNumber(liveNumber),
    normalizeWhatsAppPhoneNumber({ id: "other", display_phone_number: "+1 555 000 0000" }),
  ];

  assert.equal(findConfiguredWhatsAppSender(numbers, configuredEnv)?.id, "1192139290658384");
  assert.equal(findConfiguredWhatsAppSender(numbers, { WHATSAPP_PHONE_NUMBER_ID: "missing" }), null);
  assert.equal(findConfiguredWhatsAppSender(numbers, {}), null);
});
