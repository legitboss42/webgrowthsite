import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchWhatsAppBusinessProfile,
  isWhatsAppProfilePictureUrl,
  normalizeWhatsAppBusinessProfile,
  summarizeWhatsAppBusinessProfile,
} from "./businessProfile";

// The shape Meta actually returned for the connected number, with the signed picture
// URL truncated. `about` and `address` are absent because they have never been set —
// Meta omits unset fields rather than returning them empty.
const liveProfile = {
  messaging_product: "whatsapp",
  description: "Web design, SEO and automation for growing businesses.",
  email: "admin@webgrowth.info",
  profile_picture_url: "https://pps.whatsapp.net/v/t61.24694-24/123456_789.jpg?ccb=11-4&oh=abc&oe=68B0",
  websites: ["https://webgrowth.info/"],
  vertical: "PROF_SERVICES",
};

// Synthetic fixture on purpose — see the note in typing.test.ts.
const configuredEnv = {
  WHATSAPP_ACCESS_TOKEN: "test-token",
  WHATSAPP_PHONE_NUMBER_ID: "1234567890",
  WHATSAPP_API_VERSION: "v26.0",
};

test("the live Meta payload normalizes into the model", () => {
  const profile = normalizeWhatsAppBusinessProfile(liveProfile);

  assert.equal(profile.description, "Web design, SEO and automation for growing businesses.");
  assert.equal(profile.email, "admin@webgrowth.info");
  assert.equal(profile.vertical, "PROF_SERVICES");
  assert.deepEqual(profile.websites, ["https://webgrowth.info/"]);
  assert.ok(profile.profilePictureUrl?.startsWith("https://pps.whatsapp.net/"));
});

test("fields Meta omits are undefined, not empty strings", () => {
  const profile = normalizeWhatsAppBusinessProfile(liveProfile);

  assert.equal(profile.about, undefined);
  assert.equal(profile.address, undefined);
});

test("blank and non-string values degrade to undefined", () => {
  const profile = normalizeWhatsAppBusinessProfile({
    about: "   ",
    email: 42,
    websites: "https://example.com/",
  });

  assert.equal(profile.about, undefined);
  assert.equal(profile.email, undefined);
  assert.deepEqual(profile.websites, []);
});

test("an empty payload normalizes rather than throwing", () => {
  const profile = normalizeWhatsAppBusinessProfile({});

  assert.deepEqual(profile.websites, []);
  assert.equal(profile.profilePictureUrl, undefined);
});

test("the summary reports the live account honestly: picture set, about and address not", () => {
  const summary = summarizeWhatsAppBusinessProfile(normalizeWhatsAppBusinessProfile(liveProfile));

  assert.equal(summary.customerVisiblePicture, true);
  assert.equal(summary.complete, false);
  assert.deepEqual(summary.missing, ["About", "Address"]);
  assert.ok(summary.set.includes("Profile picture"));
  assert.ok(summary.set.includes("Websites"));
});

test("an empty websites array counts as missing, not as set", () => {
  const summary = summarizeWhatsAppBusinessProfile(
    normalizeWhatsAppBusinessProfile({ ...liveProfile, websites: [] }),
  );

  assert.ok(summary.missing.includes("Websites"));
});

test("no picture means no claim of a customer-visible picture", () => {
  const summary = summarizeWhatsAppBusinessProfile(
    normalizeWhatsAppBusinessProfile({ ...liveProfile, profile_picture_url: undefined }),
  );

  assert.equal(summary.customerVisiblePicture, false);
  assert.ok(summary.missing.includes("Profile picture"));
});

test("every field the card needs is requested in one call", async () => {
  let seenUrl = "";
  await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async (url: string) => {
      seenUrl = String(url);
      return new Response(JSON.stringify({ data: [liveProfile] }), { status: 200 });
    }) as unknown as typeof globalThis.fetch,
  });

  assert.ok(seenUrl.includes("/v26.0/1234567890/whatsapp_business_profile"));
  for (const field of [
    "about",
    "address",
    "description",
    "email",
    "profile_picture_url",
    "websites",
    "vertical",
  ]) {
    assert.ok(seenUrl.includes(field), `expected ${field} in the field list`);
  }
});

test("the token travels in the header and never in the URL", async () => {
  let seenUrl = "";
  let seenAuth = "";

  const result = await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async (url: string, init: RequestInit) => {
      seenUrl = String(url);
      seenAuth = String((init.headers as Record<string, string>).Authorization);
      return new Response(JSON.stringify({ data: [liveProfile] }), { status: 200 });
    }) as unknown as typeof globalThis.fetch,
  });

  assert.equal(seenAuth, "Bearer test-token");
  assert.equal(seenUrl.includes("test-token"), false);
  assert.equal(result.ok, true);
});

test("missing credentials report NOT_CONFIGURED without calling Meta", async () => {
  let called = false;
  const result = await fetchWhatsAppBusinessProfile({
    env: { WHATSAPP_ACCESS_TOKEN: "test-token" },
    fetch: (async () => {
      called = true;
      throw new Error("should not be called");
    }) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(result, { ok: false, reason: "NOT_CONFIGURED" });
  assert.equal(called, false);
});

test("auth failures are PERMISSION_DENIED and everything else is API_ERROR", async () => {
  const denied = await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async () => new Response("no", { status: 403 })) as unknown as typeof globalThis.fetch,
  });
  const broken = await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async () => new Response("no", { status: 500 })) as unknown as typeof globalThis.fetch,
  });
  const offline = await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async () => {
      throw new Error("network down");
    }) as unknown as typeof globalThis.fetch,
  });

  assert.deepEqual(denied, { ok: false, reason: "PERMISSION_DENIED" });
  assert.deepEqual(broken, { ok: false, reason: "API_ERROR" });
  assert.deepEqual(offline, { ok: false, reason: "API_ERROR" });
});

test("a malformed payload yields an empty profile rather than throwing", async () => {
  const result = await fetchWhatsAppBusinessProfile({
    env: configuredEnv,
    fetch: (async () => new Response("nope", { status: 200 })) as unknown as typeof globalThis.fetch,
  });

  assert.equal(result.ok, true);
  assert.ok(result.ok && result.profile.websites.length === 0);
});

test("only WhatsApp's own CDN is accepted as a picture source", () => {
  assert.equal(isWhatsAppProfilePictureUrl(liveProfile.profile_picture_url), true);
  assert.equal(isWhatsAppProfilePictureUrl("https://media-lhr8-1.cdn.whatsapp.net/v/x.jpg"), true);
  assert.equal(isWhatsAppProfilePictureUrl("https://evil.example.com/x.jpg"), false);
  assert.equal(isWhatsAppProfilePictureUrl("http://pps.whatsapp.net/x.jpg"), false);
  assert.equal(isWhatsAppProfilePictureUrl("https://notwhatsapp.net.evil.com/x.jpg"), false);
  assert.equal(isWhatsAppProfilePictureUrl("not a url"), false);
  assert.equal(isWhatsAppProfilePictureUrl(""), false);
});
