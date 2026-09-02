import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppAIAgent, normalizeWhatsAppAISettings, parseWhatsAppAIResponse, validateWhatsAppAIAgentInput } from "./aiModel";

test("AI settings fail closed and preserve the zero-dollar lock", () => {
  const settings = normalizeWhatsAppAISettings({ enabled: true, monthly_budget_usd: 0, daily_request_limit: 25, max_agent_turns: 7 });
  assert.equal(settings.enabled, true);
  assert.equal(settings.monthlyBudgetUsd, 0);
  assert.equal(settings.dailyRequestLimit, 25);
  assert.equal(settings.maxAgentTurns, 7);
});

test("AI Agent normalization keeps only allow-listed actions", () => {
  const agent = normalizeWhatsAppAIAgent({ id: "a", name: "Sales", role: "Sales", instructions: "Qualify leads", allowed_actions: ["ADD_TAG", "DROP_DATABASE", "REQUEST_HUMAN"], status: "ACTIVE" });
  assert.deepEqual(agent.allowedActions, ["ADD_TAG", "REQUEST_HUMAN"]);
  assert.equal(agent.status, "ACTIVE");
});

test("AI Agent validation requires a useful name role and instructions", () => {
  assert.equal(validateWhatsAppAIAgentInput({}).ok, false);
  assert.equal(validateWhatsAppAIAgentInput({ name: "Reception", role: "Receptionist", instructions: "Help using approved knowledge", status: "ACTIVE" }).ok, true);
});

test("AI response parser strips forbidden actions even when the model proposes them", () => {
  const parsed = parseWhatsAppAIResponse(JSON.stringify({ reply: "Hello", summary: "Lead", handoff: false, actions: [{ type: "ADD_TAG", payload: { tag: "LEAD" } }, { type: "UPDATE_CRM_STAGE", payload: { stage: "QUALIFIED" } }] }), ["ADD_TAG"]);
  assert.equal(parsed.reply, "Hello");
  assert.equal(parsed.actions.length, 1);
  assert.equal(parsed.actions[0]?.type, "ADD_TAG");
});

test("plain text provider output remains usable as an assist draft", () => {
  const parsed = parseWhatsAppAIResponse("A concise customer reply", []);
  assert.equal(parsed.reply, "A concise customer reply");
  assert.deepEqual(parsed.actions, []);
});
