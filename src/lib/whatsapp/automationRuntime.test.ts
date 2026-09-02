import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateWhatsAppAutomationCondition,
  hashWhatsAppAutomationPayload,
  resolveWhatsAppAutomationText,
  secureAutomationSecretEqual,
} from "./automationRuntime";

const context = {
  trigger: { type: "NEW_MESSAGE", value: "price", payload: { source: "website" } },
  contact: {
    id: "contact-1",
    waId: "2348000000000",
    phone: "+2348000000000",
    displayName: "Ada Lovelace",
    company: "Analytical Engines",
    email: "ada@example.com",
    leadStage: "QUALIFIED",
    tags: ["Pricing", "VIP"],
    customFields: { budget: "500000", City: "Lagos" },
    optInStatus: "OPTED_IN",
  },
  conversation: { id: "conversation-1", status: "open", assignedMemberId: "member-1", lastMessageAt: "" },
  message: { id: "wamid.1", text: "Please send the price", type: "text", timestamp: 1800000000 },
  latestInbound: { id: "wamid.1", timestamp: 1800000000 },
  latestOutbound: null,
  businessHours: "OPEN",
  ancestry: [],
  depth: 0,
} as any;

test("evaluates arrays, custom fields, numeric comparisons and business hours", () => {
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.tags", operator: "EQUALS", value: "vip" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.custom.budget", operator: "GREATER_THAN", value: "400000" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.custom.city", operator: "EQUALS", value: "lagos" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "business_hours", operator: "EQUALS", value: "OPEN" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "message.text", operator: "CONTAINS", value: "PRICE" }, context), true);
});

test("resolves workflow context variables without erasing unresolved tokens", () => {
  const value = resolveWhatsAppAutomationText(
    "Hi {{first_name}} from {{company}}. Budget={{custom.budget}} Missing={{custom.unknown}}",
    context,
  );
  assert.equal(value, "Hi Ada from Analytical Engines. Budget=500000 Missing={{custom.unknown}}");
});

test("payload hashes are deterministic and processor-secret compare is exact", () => {
  assert.equal(hashWhatsAppAutomationPayload({ a: 1 }), hashWhatsAppAutomationPayload({ a: 1 }));
  assert.notEqual(hashWhatsAppAutomationPayload({ a: 1 }), hashWhatsAppAutomationPayload({ a: 2 }));
  assert.equal(secureAutomationSecretEqual("abc", "abc"), true);
  assert.equal(secureAutomationSecretEqual("abc", "abcd"), false);
  assert.equal(secureAutomationSecretEqual("abc", "abd"), false);
});
