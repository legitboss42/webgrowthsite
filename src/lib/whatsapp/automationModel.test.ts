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
  const keyword = validateWhatsAppAutomationInput(base({ triggerConfig: {} }));
  assert.equal(keyword.ok, false);
  const webhook = validateWhatsAppAutomationInput(base({ triggerType: "WEBHOOK", triggerConfig: { key: "tiny" } }));
  assert.equal(webhook.ok, false);
});

test("delay action requires amount and unit", () => {
  const result = validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 2, unit: "HOURS" }, { type: "STOP" }] }));
  assert.equal(result.ok, true);
  const invalid = validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 0, unit: "HOURS" }] }));
  assert.equal(invalid.ok, false);
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

test("rejects an empty branch", () => {
  const result = validateWhatsAppAutomationInput(base({
    actions: [{ type: "BRANCH", condition: { field: "message.text", operator: "CONTAINS", value: "hi" }, thenActions: [], elseActions: [] }],
  }));
  assert.equal(result.ok, false);
});

test("allows up to one hundred total workflow steps", () => {
  const hundred = Array.from({ length: 100 }, (_, index) => ({ type: "ADD_TAG", value: `tag-${index}` }));
  assert.equal(validateWhatsAppAutomationInput(base({ actions: hundred })).ok, true);
  const hundredOne = [...hundred, { type: "ADD_TAG", value: "one-too-many" }];
  assert.equal(validateWhatsAppAutomationInput(base({ actions: hundredOne })).ok, false);
});

test("rejects direct tag and CRM-stage self loops", () => {
  const tag = validateWhatsAppAutomationInput(base({
    triggerType: "TAG_ADDED",
    triggerConfig: { tag: "Qualified" },
    actions: [{ type: "ADD_TAG", value: "qualified" }],
  }));
  assert.equal(tag.ok, false);
  const stage = validateWhatsAppAutomationInput(base({
    triggerType: "CRM_STAGE_CHANGED",
    triggerConfig: { stage: "QUALIFIED" },
    actions: [{ type: "UPDATE_CRM_STAGE", value: "QUALIFIED" }],
  }));
  assert.equal(stage.ok, false);
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
