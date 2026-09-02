import test from "node:test";
import assert from "node:assert/strict";
import { whatsappAIAgentAutomationSlug, whatsappAIAgentAutomationTag } from "./aiAutomationBridge";

test("AI Agent automation routing tags are stable and human-readable", () => {
  assert.equal(whatsappAIAgentAutomationSlug("Web Growth — Sales AI"), "web-growth-sales-ai");
  assert.equal(whatsappAIAgentAutomationTag("Web Growth — Sales AI"), "AI_AGENT:web-growth-sales-ai");
});

test("AI Agent automation routing tags discard unsafe punctuation", () => {
  assert.equal(whatsappAIAgentAutomationSlug("  Support / CRM !!!  "), "support-crm");
});
