import test from "node:test";
import assert from "node:assert/strict";
import {
  createWhatsAppContactCsvTemplate,
  encodeWhatsAppContactsCsv,
  parseCsvRecords,
  parseWhatsAppContactCsv,
} from "./contactCsvModel";
import { normalizeWhatsAppContactRow } from "./contactsModel";

test("CSV parser supports quoted commas, quotes, and multiline custom fields", () => {
  const records = parseCsvRecords('a,b,c\r\n1,"hello, world","line 1\nline 2"\r\n2,"say ""hi""",x\r\n');
  assert.deepEqual(records, [
    ["a", "b", "c"],
    ["1", "hello, world", "line 1\nline 2"],
    ["2", 'say "hi"', "x"],
  ]);
});

test("contact export has stable headers and formula-safe cells", () => {
  const contact = normalizeWhatsAppContactRow({
    id: "1",
    wa_id: "2348012345678",
    display_name: "=SUM(A1:A2)",
    phone: "+2348012345678",
    lead_temperature: "HOT",
    lead_stage: "CUSTOMER",
    tags: ["VIP", "Lagos"],
    custom_fields: { Budget: "500000" },
    opt_in_status: "OPTED_IN",
  });
  const csv = encodeWhatsAppContactsCsv([contact]);
  assert.ok(csv.startsWith("whatsapp_number,display_name,company,email,phone,website,source,lead_temperature,lead_stage,tags,opt_in_status,custom_fields\r\n"));
  assert.ok(csv.includes("'=SUM(A1:A2)"));
  assert.ok(csv.includes("'+2348012345678"));
});

test("contact import normalizes CRM fields and preserves multiline custom fields", () => {
  const csv = [
    "whatsapp_number,display_name,company,email,phone,website,source,lead_temperature,lead_stage,tags,opt_in_status,custom_fields",
    '08012345678,Ada,Acme,ada@example.com,+2348012345678,example.com,Referral,WARM,QUALIFIED,"VIP, Lagos",OPTED_IN,"Budget=500000\nLocation=Lagos"',
  ].join("\r\n");
  const result = parseWhatsAppContactCsv(csv);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0]?.waId, "2348012345678");
  assert.deepEqual(result.rows[0]?.payload.tags, ["VIP", "Lagos"]);
  assert.deepEqual(result.rows[0]?.payload.custom_fields, { Budget: "500000", Location: "Lagos" });
  assert.equal(result.rows[0]?.payload.website, "https://example.com/");
});

test("invalid rows are reported without blocking valid rows", () => {
  const csv = [
    "whatsapp_number,email,lead_stage",
    "bad,not-an-email,NOPE",
    "08012345678,ada@example.com,NEW",
  ].join("\n");
  const result = parseWhatsAppContactCsv(csv);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0]?.row, 2);
  assert.equal(result.rows.length, 1);
});

test("CSV template is parseable by the same importer", () => {
  const result = parseWhatsAppContactCsv(createWhatsAppContactCsvTemplate());
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 1);
});
