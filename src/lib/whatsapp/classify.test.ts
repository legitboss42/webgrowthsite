import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyWhatsAppIntent,
  isFreeformReplyAllowed,
} from "./classify";

test("classifies proposal as a hot lead requiring human review", () => {
  assert.deepEqual(
    classifyWhatsAppIntent("Please send a proposal for our new Shopify store."),
    {
      intent: "PROPOSAL_REQUEST",
      temperature: "HOT",
      humanReviewRequired: true,
      safeReplyKind: "ACKNOWLEDGEMENT",
    }
  );
});

test("classifies low-risk requests into safe response categories", () => {
  assert.equal(
    classifyWhatsAppIntent("Can I see your portfolio?").safeReplyKind,
    "PORTFOLIO"
  );
  assert.equal(
    classifyWhatsAppIntent("Can you audit my website?").safeReplyKind,
    "AUDIT"
  );
  assert.equal(
    classifyWhatsAppIntent("Do you offer SEO services?").safeReplyKind,
    "SERVICE"
  );
});

test("treats pricing, timelines, and meeting requests as hot review items", () => {
  for (const text of [
    "How much will this cost?",
    "Can we have a call tomorrow?",
    "We need the project started next week.",
  ]) {
    const result = classifyWhatsAppIntent(text);
    assert.equal(result.temperature, "HOT");
    assert.equal(result.humanReviewRequired, true);
  }
});

test("allows free-form responses only inside the 24 hour service window", () => {
  const now = 1_800_000_000;
  assert.equal(isFreeformReplyAllowed(now - 86_400, now), true);
  assert.equal(isFreeformReplyAllowed(now - 86_401, now), false);
});

test("classifies identically whether keyword rules are absent or empty", () => {
  const empty = { hot: [], warm: [], spam: [] };
  for (const text of ["How much will this cost?", "Do you offer SEO services?", "asdf"]) {
    assert.deepEqual(classifyWhatsAppIntent(text), classifyWhatsAppIntent(text, empty));
  }
});

test("an operator hot keyword promotes a message the built-in rules call cold", () => {
  const text = "Do you sell boekies?";
  assert.equal(classifyWhatsAppIntent(text).temperature, "COLD");

  const result = classifyWhatsAppIntent(text, { hot: ["boekie", "boekies"], warm: [], spam: [] });
  assert.equal(result.temperature, "HOT");
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.safeReplyKind, "ACKNOWLEDGEMENT");
});

test("an operator spam keyword silences a message the built-in rules call hot", () => {
  const text = "Get a cheap loan, best price today";
  assert.equal(classifyWhatsAppIntent(text).temperature, "HOT");

  const result = classifyWhatsAppIntent(text, { hot: [], warm: [], spam: ["loan"] });
  assert.equal(result.temperature, "COLD");
  assert.equal(result.humanReviewRequired, false);
  assert.equal(result.safeReplyKind, "NONE");
});
