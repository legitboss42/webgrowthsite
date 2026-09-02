import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateWhatsAppAutomationCondition,
  hashWhatsAppAutomationPayload,
  resolveWhatsAppAutomationText,
  secureAutomationSecretEqual,
} from "./automationRuntime";
import { buildWhatsAppInteractiveQuestionPayload } from "./interactiveQuestion";

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
  answer: "SEO",
  answerId: "seo",
} as any;

test("evaluates arrays, custom fields, numeric comparisons, answer and business hours", () => {
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.tags", operator: "EQUALS", value: "vip" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.custom.budget", operator: "GREATER_THAN", value: "400000" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "contact.custom.city", operator: "EQUALS", value: "lagos" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "business_hours", operator: "EQUALS", value: "OPEN" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "message.text", operator: "CONTAINS", value: "PRICE" }, context), true);
  assert.equal(evaluateWhatsAppAutomationCondition({ field: "answer", operator: "EQUALS", value: "seo" }, context), true);
});

test("resolves workflow context variables including interactive answer", () => {
  const value = resolveWhatsAppAutomationText(
    "Hi {{first_name}} from {{company}}. Budget={{custom.budget}} Answer={{answer}}/{{answer_id}} Missing={{custom.unknown}}",
    context,
  );
  assert.equal(value, "Hi Ada from Analytical Engines. Budget=500000 Answer=SEO/seo Missing={{custom.unknown}}");
});

test("builds Meta reply-button and list question payloads", () => {
  const button = buildWhatsAppInteractiveQuestionPayload({
    to: "2348000000000",
    question: "Which service?",
    mode: "BUTTONS",
    choices: [{ id: "web", title: "Website" }, { id: "seo", title: "SEO" }],
    customerMessageTimestamp: 1800000000,
  }) as any;
  assert.equal(button.type, "interactive");
  assert.equal(button.interactive.type, "button");
  assert.equal(button.interactive.action.buttons[1].reply.id, "seo");

  const list = buildWhatsAppInteractiveQuestionPayload({
    to: "2348000000000",
    question: "Which service?",
    mode: "LIST",
    listButtonText: "Services",
    choices: [{ id: "web", title: "Website", description: "New website" }, { id: "seo", title: "SEO" }],
    customerMessageTimestamp: 1800000000,
  }) as any;
  assert.equal(list.interactive.type, "list");
  assert.equal(list.interactive.action.button, "Services");
  assert.equal(list.interactive.action.sections[0].rows[0].description, "New website");
});

test("payload hashes are deterministic and processor-secret compare is exact", () => {
  assert.equal(hashWhatsAppAutomationPayload({ a: 1 }), hashWhatsAppAutomationPayload({ a: 1 }));
  assert.notEqual(hashWhatsAppAutomationPayload({ a: 1 }), hashWhatsAppAutomationPayload({ a: 2 }));
  assert.equal(secureAutomationSecretEqual("abc", "abc"), true);
  assert.equal(secureAutomationSecretEqual("abc", "abcd"), false);
  assert.equal(secureAutomationSecretEqual("abc", "abd"), false);
});
