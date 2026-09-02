import assert from "node:assert/strict";
import test from "node:test";
import {
  countWhatsAppAutomationSteps,
  validateWhatsAppAutomationInput,
  type WhatsAppAutomationAction,
} from "./automationModel";

const choices = [
  "website",
  "redesign",
  "landing",
  "ecommerce",
  "seo",
  "maintenance",
  "automation",
  "pricing",
  "support",
  "other",
];

function routeBranch(index: number): WhatsAppAutomationAction {
  const current = choices[index];
  const last = index === choices.length - 2;
  return {
    type: "BRANCH",
    condition: { field: "trigger.payload.answerId", operator: "EQUALS", value: current },
    thenActions: [{ type: "ADD_TAG", value: `WG_ROUTE_${current.toUpperCase()}` }],
    elseActions: last
      ? [{ type: "ADD_TAG", value: `WG_ROUTE_${choices[index + 1].toUpperCase()}` }]
      : [routeBranch(index + 1)],
  };
}

test("supports a 10-choice list router with stable answer IDs", () => {
  const actions: WhatsAppAutomationAction[] = [
    { type: "SEND_TEXT", value: "Welcome" },
    {
      type: "ASK_QUESTION",
      value: "What would you like help with?",
      questionMode: "LIST",
      listButtonText: "Choose",
      choices: choices.map((id) => ({ id, title: id.slice(0, 1).toUpperCase() + id.slice(1) })),
    },
    routeBranch(0),
  ];

  const result = validateWhatsAppAutomationInput({
    name: "WG — MASTER INTAKE ROUTER",
    description: "Routes all ten intake choices.",
    status: "DRAFT",
    triggerType: "CONVERSATION_OPENED",
    triggerConfig: {},
    conditionJoin: "AND",
    conditions: [],
    actions,
  });

  assert.equal(result.ok, true);
  assert.equal(countWhatsAppAutomationSteps(actions), 21);
});
