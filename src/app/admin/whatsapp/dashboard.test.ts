import assert from "node:assert/strict";
import test from "node:test";
import { filterWhatsAppLeads } from "./dashboard";

const leads = [
  { id: "hot", wa_id: "1", lead_temperature: "HOT" as const, intent: "PRICING_REQUEST", human_review_required: true, status: "open" },
  { id: "warm", wa_id: "2", lead_temperature: "WARM" as const, human_review_required: false, status: "open" },
];

test("returns only hot WhatsApp leads for the HOT filter", () => {
  assert.deepEqual(filterWhatsAppLeads(leads, "HOT").map((lead) => lead.id), ["hot"]);
});
