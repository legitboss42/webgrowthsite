import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_CONTACT_FILTERS,
  buildWhatsAppContactSearchFilter,
  countWhatsAppContactsByTemperature,
  getWhatsAppContactName,
  isWhatsAppContactFilter,
  normalizeWhatsAppContactRow,
  sanitizeWhatsAppSearchTerm,
} from "./contactsModel";

test("search terms keep useful characters and drop PostgREST metacharacters", () => {
  assert.equal(sanitizeWhatsAppSearchTerm("Ada Okafor"), "Ada Okafor");
  assert.equal(sanitizeWhatsAppSearchTerm("ada@webgrowth.info"), "ada@webgrowth.info");
  assert.equal(sanitizeWhatsAppSearchTerm("+234 806 670 6336"), "+234 806 670 6336");
  assert.equal(sanitizeWhatsAppSearchTerm("  padded   name  "), "padded name");
  assert.equal(sanitizeWhatsAppSearchTerm(undefined), "");
  assert.equal(sanitizeWhatsAppSearchTerm(""), "");
});

test("search terms cannot break out of the or() expression", () => {
  const hostile = `x),lead_status.eq.open,(y`;
  const cleaned = sanitizeWhatsAppSearchTerm(hostile);

  for (const character of [",", "(", ")", "*", "%", '"', "'", "\\"]) {
    assert.equal(cleaned.includes(character), false, `expected ${character} to be stripped`);
  }
});

test("search terms are length capped", () => {
  assert.equal(sanitizeWhatsAppSearchTerm("a".repeat(200)).length, 64);
});

test("the search filter covers every searchable column and is URL encoded", () => {
  const filter = buildWhatsAppContactSearchFilter("Ada");
  assert.ok(filter);
  assert.ok(filter.startsWith("or=("));
  assert.ok(filter.endsWith(")"));

  const decoded = decodeURIComponent(filter.slice("or=(".length, -1));
  assert.deepEqual(decoded.split(","), [
    "display_name.ilike.*Ada*",
    "business_name.ilike.*Ada*",
    "email.ilike.*Ada*",
    "wa_id.ilike.*Ada*",
    "phone.ilike.*Ada*",
  ]);
});

test("an empty or fully stripped search produces no filter", () => {
  assert.equal(buildWhatsAppContactSearchFilter(""), null);
  assert.equal(buildWhatsAppContactSearchFilter("   "), null);
  assert.equal(buildWhatsAppContactSearchFilter("(),*"), null);
});

test("contact rows normalize real columns and blank strings become undefined", () => {
  const contact = normalizeWhatsAppContactRow({
    id: "c1",
    wa_id: "2348030000000",
    phone: "+234 803 000 0000",
    display_name: "Ada Okafor",
    business_name: "",
    email: null,
    website: "https://example.test",
    source: "WhatsApp",
    lead_status: "open",
    lead_temperature: "HOT",
    created_at: "2026-08-01T10:00:00.000Z",
  });

  assert.equal(contact.display_name, "Ada Okafor");
  assert.equal(contact.business_name, undefined);
  assert.equal(contact.email, undefined);
  assert.equal(contact.lead_temperature, "HOT");
  assert.equal(contact.conversation, undefined);
});

test("an unrecognised temperature falls back to COLD", () => {
  assert.equal(normalizeWhatsAppContactRow({ id: "c", wa_id: "1" }).lead_temperature, "COLD");
  assert.equal(
    normalizeWhatsAppContactRow({ id: "c", wa_id: "1", lead_temperature: "SCORCHING" })
      .lead_temperature,
    "COLD",
  );
});

test("an embedded conversation is read whether PostgREST returns an object or an array", () => {
  const asObject = normalizeWhatsAppContactRow({
    id: "c1",
    wa_id: "1",
    whatsapp_conversations: { id: "conv-1", status: "open", human_review_required: true },
  });
  const asArray = normalizeWhatsAppContactRow({
    id: "c2",
    wa_id: "2",
    whatsapp_conversations: [{ id: "conv-2", status: "closed", intent: "PRICING_REQUEST" }],
  });

  assert.equal(asObject.conversation?.id, "conv-1");
  assert.equal(asObject.conversation?.human_review_required, true);
  assert.equal(asArray.conversation?.id, "conv-2");
  assert.equal(asArray.conversation?.intent, "PRICING_REQUEST");
  assert.equal(asArray.conversation?.human_review_required, false);
});

test("an empty embedded array means no conversation", () => {
  const contact = normalizeWhatsAppContactRow({ id: "c", wa_id: "1", whatsapp_conversations: [] });
  assert.equal(contact.conversation, undefined);
});

test("contact names fall back through display name, business name, then wa_id", () => {
  const base = { id: "c", wa_id: "2348030000000", lead_status: "open" } as const;

  assert.equal(
    getWhatsAppContactName({ ...base, lead_temperature: "COLD", display_name: "Ada" }),
    "Ada",
  );
  assert.equal(
    getWhatsAppContactName({ ...base, lead_temperature: "COLD", business_name: "Acme" }),
    "Acme",
  );
  assert.equal(getWhatsAppContactName({ ...base, lead_temperature: "COLD" }), "2348030000000");
});

test("temperature filters are validated against the known set", () => {
  assert.equal(isWhatsAppContactFilter("HOT"), true);
  assert.equal(isWhatsAppContactFilter("ALL"), true);
  assert.equal(isWhatsAppContactFilter("lead_status.eq.open"), false);
  assert.equal(isWhatsAppContactFilter(undefined), false);
  assert.deepEqual([...WHATSAPP_CONTACT_FILTERS], ["ALL", "HOT", "WARM", "COLD"]);
});

test("temperature counts cover every bucket", () => {
  const contacts = [
    normalizeWhatsAppContactRow({ id: "1", wa_id: "1", lead_temperature: "HOT" }),
    normalizeWhatsAppContactRow({ id: "2", wa_id: "2", lead_temperature: "WARM" }),
    normalizeWhatsAppContactRow({ id: "3", wa_id: "3", lead_temperature: "WARM" }),
    normalizeWhatsAppContactRow({ id: "4", wa_id: "4" }),
  ];

  assert.deepEqual(countWhatsAppContactsByTemperature(contacts), {
    ALL: 4,
    HOT: 1,
    WARM: 2,
    COLD: 1,
  });
});
