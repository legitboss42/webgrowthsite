import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeWhatsAppAutomationRow,
  validateWhatsAppAutomationInput,
} from "./automationModel";

function base(overrides: Record<string, unknown> = {}) {
  return {
    name: "Pricing lead follow-up",
    description: "Stage 6A test workflow",
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

test("keyword trigger requires a keyword", () => {
  const result = validateWhatsAppAutomationInput(base({ triggerConfig: {} }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /keyword/i);
});

test("delay action requires amount and unit", () => {
  const result = validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 2, unit: "HOURS" }, { type: "STOP" }] }));
  assert.equal(result.ok, true);

  const invalid = validateWhatsAppAutomationInput(base({ actions: [{ type: "DELAY", amount: 0, unit: "HOURS" }] }));
  assert.equal(invalid.ok, false);
});

test("stop workflow must be final", () => {
  const result = validateWhatsAppAutomationInput(base({ actions: [{ type: "STOP" }, { type: "ADD_TAG", value: "Lead" }] }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /final action/i);
});

test("rejects a direct tag self-loop", () => {
  const result = validateWhatsAppAutomationInput(base({
    triggerType: "TAG_ADDED",
    triggerConfig: { tag: "Qualified" },
    actions: [{ type: "ADD_TAG", value: "qualified" }],
  }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /loop/i);
});

test("rejects a direct CRM-stage self-loop", () => {
  const result = validateWhatsAppAutomationInput(base({
    triggerType: "CRM_STAGE_CHANGED",
    triggerConfig: { stage: "QUALIFIED" },
    actions: [{ type: "UPDATE_CRM_STAGE", value: "QUALIFIED" }],
  }));
  assert.equal(result.ok, false);
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
