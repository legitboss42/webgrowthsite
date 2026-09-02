import assert from "node:assert/strict";
import test from "node:test";
import {
  getWhatsAppCampaignEligibility,
  matchesWhatsAppSegment,
  normalizeWhatsAppCampaignContact,
  validateWhatsAppSegmentInput,
} from "./campaignModel";

test("campaign audience supports CRM, lifecycle, tags, and custom fields", () => {
  const contact = normalizeWhatsAppCampaignContact({
    id: "contact-1",
    wa_id: "2348000000000",
    display_name: "Ada Example",
    lead_stage: "FOLLOW_UP",
    lead_temperature: "HOT",
    tags: ["Interest: Website Design", "WG_LEAD"],
    custom_fields: { service_interest: "Website" },
    opt_in_status: "OPTED_IN",
    whatsapp_conversations: { status: "closed", last_message_at: "2026-09-01T10:00:00Z" },
  });
  assert.equal(matchesWhatsAppSegment(contact, [
    { field: "tags", operator: "CONTAINS", value: "Website Design" },
    { field: "lead_stage", operator: "EQUALS", value: "FOLLOW_UP" },
    { field: "custom.service_interest", operator: "EQUALS", value: "Website" },
    { field: "lifecycle", operator: "EQUALS", value: "closed" },
  ], "AND"), true);
});

test("campaign eligibility requires explicit opt-in and a valid WhatsApp number", () => {
  const optedIn = normalizeWhatsAppCampaignContact({ id: "1", wa_id: "2348000000000", opt_in_status: "OPTED_IN" });
  const unknown = normalizeWhatsAppCampaignContact({ id: "2", wa_id: "2348000000001", opt_in_status: "UNKNOWN" });
  const optedOut = normalizeWhatsAppCampaignContact({ id: "3", wa_id: "2348000000002", opt_in_status: "OPTED_OUT" });
  const invalid = normalizeWhatsAppCampaignContact({ id: "4", wa_id: "12", opt_in_status: "OPTED_IN" });
  assert.deepEqual(getWhatsAppCampaignEligibility(optedIn), { eligible: true, reason: null });
  assert.equal(getWhatsAppCampaignEligibility(unknown).reason, "CONSENT_REQUIRED");
  assert.equal(getWhatsAppCampaignEligibility(optedOut).reason, "OPTED_OUT");
  assert.equal(getWhatsAppCampaignEligibility(invalid).reason, "INVALID_NUMBER");
});

test("segment validation caps conditions and accepts empty conditions for all eligible contacts", () => {
  const all = validateWhatsAppSegmentInput({ name: "All eligible", conditionJoin: "AND", conditions: [] });
  assert.equal(all.ok, true);
  const tooMany = validateWhatsAppSegmentInput({
    name: "Too many",
    conditionJoin: "AND",
    conditions: Array.from({ length: 21 }, () => ({ field: "tags", operator: "CONTAINS", value: "x" })),
  });
  assert.equal(tooMany.ok, false);
});
