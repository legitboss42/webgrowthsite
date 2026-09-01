import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_CONTACT_FILTERS,
  buildWhatsAppContactSearchFilter,
  canAgentAccessWhatsAppContact,
  countWhatsAppContactsByTemperature,
  getWhatsAppContactName,
  isValidWhatsAppContactEmail,
  isWhatsAppContactFilter,
  isWhatsAppContactTemperature,
  normalizeWhatsAppContactNumber,
  normalizeWhatsAppContactRow,
  normalizeWhatsAppContactWebsite,
  sanitizeWhatsAppSearchTerm,
} from "./contactsModel";

test("search terms keep useful characters and drop PostgREST metacharacters", () => {
  assert.equal(sanitizeWhatsAppSearchTerm("Ada Okafor"), "Ada Okafor");
  assert.equal(sanitizeWhatsAppSearchTerm("ada@webgrowth.info"), "ada@webgrowth.info");
  assert.equal(sanitizeWhatsAppSearchTerm("+234 806 670 6336"), "+234 806 670 6336");
  assert.equal(sanitizeWhatsAppSearchTerm("  padded   name  "), "padded name");
  assert.equal(sanitizeWhatsAppSearchTerm(undefined), "");
});

test("search terms cannot break out of the or() expression", () => {
  const cleaned = sanitizeWhatsAppSearchTerm(`x),lead_status.eq.open,(y`);
  for (const character of [",", "(", ")", "*", "%", '"', "'", "\\"]) {
    assert.equal(cleaned.includes(character), false, `expected ${character} to be stripped`);
  }
});

test("the search filter covers every searchable column and is URL encoded", () => {
  const filter = buildWhatsAppContactSearchFilter("Ada");
  assert.ok(filter?.startsWith("or=("));
  const decoded = decodeURIComponent(filter!.slice("or=(".length, -1));
  assert.deepEqual(decoded.split(","), [
    "display_name.ilike.*Ada*",
    "business_name.ilike.*Ada*",
    "email.ilike.*Ada*",
    "wa_id.ilike.*Ada*",
    "phone.ilike.*Ada*",
  ]);
});

test("manual WhatsApp numbers normalize to digits-only wa_id values", () => {
  assert.equal(normalizeWhatsAppContactNumber("08066706336"), "2348066706336");
  assert.equal(normalizeWhatsAppContactNumber("+234 806 670 6336"), "2348066706336");
  assert.equal(normalizeWhatsAppContactNumber("00234 806 670 6336"), "2348066706336");
  assert.equal(normalizeWhatsAppContactNumber("+1 (415) 555-2671"), "14155552671");
  assert.equal(normalizeWhatsAppContactNumber("123"), null);
  assert.equal(normalizeWhatsAppContactNumber("not-a-number"), null);
});

test("CRM email and website helpers reject malformed values", () => {
  assert.equal(isValidWhatsAppContactEmail("ada@example.com"), true);
  assert.equal(isValidWhatsAppContactEmail(""), true);
  assert.equal(isValidWhatsAppContactEmail("ada@"), false);
  assert.equal(normalizeWhatsAppContactWebsite("example.com"), "https://example.com/");
  assert.equal(normalizeWhatsAppContactWebsite("https://example.com/path"), "https://example.com/path");
  assert.equal(normalizeWhatsAppContactWebsite("javascript:alert(1)"), null);
  assert.equal(normalizeWhatsAppContactWebsite(""), "");
});

test("contact rows normalize real columns and embedded assignment", () => {
  const contact = normalizeWhatsAppContactRow({
    id: "c1",
    wa_id: "2348030000000",
    display_name: "Ada Okafor",
    business_name: "",
    email: null,
    website: "https://example.test",
    source: "WhatsApp",
    lead_status: "open",
    lead_temperature: "HOT",
    created_at: "2026-08-01T10:00:00.000Z",
    whatsapp_conversations: {
      id: "conv-1",
      status: "open",
      human_review_required: true,
      assigned_member_id: "agent-1",
    },
  });

  assert.equal(contact.display_name, "Ada Okafor");
  assert.equal(contact.business_name, undefined);
  assert.equal(contact.email, undefined);
  assert.equal(contact.lead_temperature, "HOT");
  assert.equal(contact.conversation?.assigned_member_id, "agent-1");
});

test("agent CRM visibility follows Mine and Unassigned conversation access", () => {
  const mine = normalizeWhatsAppContactRow({
    id: "1",
    wa_id: "1",
    whatsapp_conversations: { id: "conv-1", assigned_member_id: "agent-1" },
  });
  const unassigned = normalizeWhatsAppContactRow({
    id: "2",
    wa_id: "2",
    whatsapp_conversations: { id: "conv-2" },
  });
  const other = normalizeWhatsAppContactRow({
    id: "3",
    wa_id: "3",
    whatsapp_conversations: { id: "conv-3", assigned_member_id: "agent-2" },
  });
  const manual = normalizeWhatsAppContactRow({ id: "4", wa_id: "4" });

  assert.equal(canAgentAccessWhatsAppContact(mine, "agent-1"), true);
  assert.equal(canAgentAccessWhatsAppContact(unassigned, "agent-1"), true);
  assert.equal(canAgentAccessWhatsAppContact(other, "agent-1"), false);
  assert.equal(canAgentAccessWhatsAppContact(manual, "agent-1"), false);
});

test("temperature filters and values are validated", () => {
  assert.equal(isWhatsAppContactFilter("HOT"), true);
  assert.equal(isWhatsAppContactFilter("ALL"), true);
  assert.equal(isWhatsAppContactFilter("lead_status.eq.open"), false);
  assert.equal(isWhatsAppContactTemperature("WARM"), true);
  assert.equal(isWhatsAppContactTemperature("ALL"), false);
  assert.deepEqual([...WHATSAPP_CONTACT_FILTERS], ["ALL", "HOT", "WARM", "COLD"]);
});

test("contact names fall back and temperature counts cover every bucket", () => {
  const contacts = [
    normalizeWhatsAppContactRow({ id: "1", wa_id: "1", display_name: "Ada", lead_temperature: "HOT" }),
    normalizeWhatsAppContactRow({ id: "2", wa_id: "2", business_name: "Acme", lead_temperature: "WARM" }),
    normalizeWhatsAppContactRow({ id: "3", wa_id: "3", lead_temperature: "WARM" }),
    normalizeWhatsAppContactRow({ id: "4", wa_id: "4" }),
  ];
  assert.equal(getWhatsAppContactName(contacts[0]!), "Ada");
  assert.equal(getWhatsAppContactName(contacts[1]!), "Acme");
  assert.equal(getWhatsAppContactName(contacts[2]!), "3");
  assert.deepEqual(countWhatsAppContactsByTemperature(contacts), { ALL: 4, HOT: 1, WARM: 2, COLD: 1 });
});
