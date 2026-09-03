import test from "node:test";
import assert from "node:assert/strict";
import {
  getWhatsAppAIActionPolicy,
  normalizeWhatsAppAIAgent,
  normalizeWhatsAppAISettings,
  parseWhatsAppAIResponse,
  validateWhatsAppAIAgentInput,
} from "./aiModel";

test("AI settings default to Free Only without authorizing a paid budget", () => {
  const settings = normalizeWhatsAppAISettings({ enabled: true, monthly_budget_usd: 0, daily_request_limit: 25, max_agent_turns: 7 });
  assert.equal(settings.enabled, true);
  assert.equal(settings.billingMode, "FREE_ONLY");
  assert.equal(settings.monthlyBudgetUsd, 0);
  assert.equal(settings.freeCreditFloorUsd, 0.1);
  assert.equal(settings.dailyRequestLimit, 25);
  assert.equal(settings.maxAgentTurns, 7);
});

test("legacy allow-listed AI actions migrate to automatic policies", () => {
  const agent = normalizeWhatsAppAIAgent({ id: "a", name: "Sales", role: "Sales", instructions: "Qualify leads", allowed_actions: ["ADD_TAG", "DROP_DATABASE", "REQUEST_HUMAN"], status: "ACTIVE" });
  assert.deepEqual(agent.allowedActions, ["ADD_TAG", "REQUEST_HUMAN"]);
  assert.equal(getWhatsAppAIActionPolicy(agent, "ADD_TAG"), "AUTO");
  assert.equal(getWhatsAppAIActionPolicy(agent, "CLOSE_CONVERSATION"), "NEVER");
  assert.equal(agent.status, "ACTIVE");
});

test("explicit action policies support approval required without exposing disabled actions", () => {
  const agent = normalizeWhatsAppAIAgent({
    id: "a",
    name: "Sales",
    role: "Sales",
    instructions: "Qualify leads",
    action_policies: { ADD_TAG: "AUTO", UPDATE_CRM_STAGE: "APPROVAL", CLOSE_CONVERSATION: "NEVER" },
  });
  assert.deepEqual(agent.allowedActions, ["ADD_TAG", "UPDATE_CRM_STAGE"]);
  assert.equal(getWhatsAppAIActionPolicy(agent, "UPDATE_CRM_STAGE"), "APPROVAL");
  assert.equal(getWhatsAppAIActionPolicy(agent, "CLOSE_CONVERSATION"), "NEVER");
});

test("AI Agent validation requires a useful name role and instructions", () => {
  assert.equal(validateWhatsAppAIAgentInput({}).ok, false);
  const checked = validateWhatsAppAIAgentInput({
    name: "Reception",
    role: "Receptionist",
    objective: "Route enquiries",
    instructions: "Help using approved knowledge",
    uncertaintyMode: "STRICT",
    actionPolicies: { REQUEST_HUMAN: "AUTO" },
    status: "ACTIVE",
  });
  assert.equal(checked.ok, true);
  if (checked.ok) {
    assert.equal(checked.value.objective, "Route enquiries");
    assert.equal(checked.value.uncertaintyMode, "STRICT");
    assert.equal(checked.value.actionPolicies.REQUEST_HUMAN, "AUTO");
  }
});

test("AI response parser strips forbidden actions and captures objective progress", () => {
  const parsed = parseWhatsAppAIResponse(JSON.stringify({
    reply: "Thanks, I have what I need.",
    summary: "Qualified lead",
    handoff: false,
    objectiveComplete: true,
    collectedFields: [{ field: "budget", value: "500000" }],
    actions: [{ type: "ADD_TAG", payload: { tag: "LEAD" } }, { type: "UPDATE_CRM_STAGE", payload: { stage: "QUALIFIED" } }],
  }), ["ADD_TAG"]);
  assert.equal(parsed.reply, "Thanks, I have what I need.");
  assert.equal(parsed.objectiveComplete, true);
  assert.deepEqual(parsed.collectedFields, [{ field: "budget", value: "500000" }]);
  assert.equal(parsed.actions.length, 1);
  assert.equal(parsed.actions[0]?.type, "ADD_TAG");
});

test("plain text provider output remains usable as an assist draft", () => {
  const parsed = parseWhatsAppAIResponse("A concise customer reply", []);
  assert.equal(parsed.reply, "A concise customer reply");
  assert.equal(parsed.objectiveComplete, false);
  assert.deepEqual(parsed.collectedFields, []);
  assert.deepEqual(parsed.actions, []);
});
