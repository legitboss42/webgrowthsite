import assert from "node:assert/strict";
import test from "node:test";
import {
  countWhatsAppAutomationSteps,
  normalizeWhatsAppAutomationRow,
  validateWhatsAppAutomationInput,
} from "./automationModel";

function base(overrides: Record<string, unknown> = {}) {
  return {
    name: "Pricing lead follow-up",
    description: "Stage 6 workflow",
    status: "DRAFT",
    triggerType: "KEYWORD",
    triggerConfig: { keyword: "price" },
    conditionJoin: "AND",
    conditions: [{ field: "contact.lead_stage", operator: "EQUALS", value: "NEW" }],
    actions: [{ type: "SEND_TEXT", value: "Thanks. A team member will help with pricing." }],
    ...overrides,
  };
}

test("validates a normal workflow definition", () => {
  const result = validateWhatsAppAutomationInput(base());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.triggerType, "KEYWORD");
  assert.equal(result.value.conditions.length, 1);
  assert.equal(result.value.actions.length, 1);
});

test("keyword and webhook triggers require useful configuration", () => {
  assert.equal(validateWhatsAppAutomationInput(base({ triggerConfig: {} })).ok, false);
  assert.equal(validateWhatsAppAutomationInput(base({ triggerType: "WEBHOOK", triggerConfig: { key: "tiny" } })).ok, false);
});

test("delay action requires amount and unit", () => {
  assert.equal(validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 2, unit: "HOURS" }, { type: "STOP" }] })).ok, true);
  assert.equal(validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 0, unit: "HOURS" }] })).ok, false);
});

test("stop workflow must be final on a path", () => {
  const result = validateWhatsAppAutomationInput(base({ actions: [{ type: "STOP" }, { type: "ADD_TAG", value: "Lead" }] }));
  assert.equal(result.ok, false);
  if ("error" in result) assert.match(result.error, /final action/i);
});

test("validates visual branch actions and counts branch steps", () => {
  const result = validateWhatsAppAutomationInput(base({
    actions: [{
      type: "BRANCH",
      condition: { field: "contact.custom.budget", operator: "GREATER_THAN", value: "100000" },
      thenActions: [{ type: "ADD_TAG", value: "High value" }, { type: "SEND_TEXT", value: "Thanks {{first_name}}" }],
      elseActions: [{ type: "ADD_TAG", value: "Standard" }],
    }, { type: "STOP" }],
  }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(countWhatsAppAutomationSteps(result.value.actions), 5);
});

test("allows an empty Yes/No branch while building", () => {
  const result = validateWhatsAppAutomationInput(base({
    actions: [{ type: "BRANCH", condition: { field: "answer", operator: "EQUALS", value: "Website" }, thenActions: [], elseActions: [] }],
  }));
  assert.equal(result.ok, true);
});

test("validates reply-button questions and optional answer storage", () => {
  const result = validateWhatsAppAutomationInput(base({
    actions: [{
      type: "ASK_QUESTION",
      value: "Which service do you need?",
      value2: "custom.service_interest",
      questionMode: "BUTTONS",
      choices: [
        { id: "website", title: "Website" },
        { id: "seo", title: "SEO" },
        { id: "automation", title: "Automation" },
      ],
    }, { type: "BRANCH", condition: { field: "answer", operator: "EQUALS", value: "SEO" }, thenActions: [], elseActions: [] }],
  }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.actions[0]?.type, "ASK_QUESTION");
  assert.equal(result.value.actions[0]?.choices?.length, 3);
});

test("question validation enforces WhatsApp button/list limits", () => {
  const oneChoice = validateWhatsAppAutomationInput(base({ actions: [{ type: "ASK_QUESTION", value: "Choose", questionMode: "BUTTONS", choices: [{ id: "one", title: "One" }] }] }));
  assert.equal(oneChoice.ok, false);
  const fourButtons = validateWhatsAppAutomationInput(base({ actions: [{ type: "ASK_QUESTION", value: "Choose", questionMode: "BUTTONS", choices: [1, 2, 3, 4].map((n) => ({ id: `o${n}`, title: `Option ${n}` })) }] }));
  assert.equal(fourButtons.ok, false);
  const list = validateWhatsAppAutomationInput(base({ actions: [{ type: "ASK_QUESTION", value: "Choose", questionMode: "LIST", listButtonText: "Services", choices: [1, 2, 3, 4].map((n) => ({ id: `o${n}`, title: `Option ${n}`, description: `Description ${n}` })) }] }));
  assert.equal(list.ok, true);
});

test("allows up to one hundred total workflow steps", () => {
  const hundred = Array.from({ length: 100 }, (_, index) => ({ type: "ADD_TAG", value: `tag-${index}` }));
  assert.equal(validateWhatsAppAutomationInput(base({ actions: hundred })).ok, true);
  assert.equal(validateWhatsAppAutomationInput(base({ actions: [...hundred, { type: "ADD_TAG", value: "one-too-many" }] })).ok, false);
});

test("rejects direct tag and CRM-stage self loops", () => {
  assert.equal(validateWhatsAppAutomationInput(base({ triggerType: "TAG_ADDED", triggerConfig: { tag: "Qualified" }, actions: [{ type: "ADD_TAG", value: "qualified" }] })).ok, false);
  assert.equal(validateWhatsAppAutomationInput(base({ triggerType: "CRM_STAGE_CHANGED", triggerConfig: { stage: "QUALIFIED" }, actions: [{ type: "UPDATE_CRM_STAGE", value: "QUALIFIED" }] })).ok, false);
});

test("external webhook actions require HTTPS", () => {
  assert.equal(validateWhatsAppAutomationInput(base({ actions: [{ type: "CALL_WEBHOOK", value: "http://example.com/hook" }] })).ok, false);
  assert.equal(validateWhatsAppAutomationInput(base({ actions: [{ type: "CALL_WEBHOOK", value: "https://example.com/hook" }] })).ok, true);
});

test("normalizes a persisted database row", () => {
  const row = normalizeWhatsAppAutomationRow({
    id: "automation-1",
    name: "Welcome lead",
    status: "ACTIVE",
    trigger_type: "NEW_CONTACT",
    trigger_config: {},
    condition_join: "OR",
    conditions: [],
    actions: [{ type: "ADD_TAG", value: "New lead" }],
    version: 4,
    created_at: "2026-09-02T00:00:00.000Z",
  });
  assert.equal(row.id, "automation-1");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.version, 4);
  assert.equal(row.actions[0]?.type, "ADD_TAG");
});
