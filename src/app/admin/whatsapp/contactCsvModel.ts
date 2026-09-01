import {
  isValidWhatsAppContactEmail,
  isWhatsAppContactLeadStage,
  isWhatsAppContactOptInStatus,
  isWhatsAppContactTemperature,
  normalizeWhatsAppContactCustomFields,
  normalizeWhatsAppContactNumber,
  normalizeWhatsAppContactTags,
  normalizeWhatsAppContactWebsite,
  type WhatsAppContactRow,
} from "./contactsModel";

export const WHATSAPP_CONTACT_CSV_HEADERS = [
  "whatsapp_number",
  "display_name",
  "company",
  "email",
  "phone",
  "website",
  "source",
  "lead_temperature",
  "lead_stage",
  "tags",
  "opt_in_status",
  "custom_fields",
] as const;

export const WHATSAPP_CONTACT_CSV_MAX_ROWS = 250;
export const WHATSAPP_CONTACT_CSV_MAX_BYTES = 512 * 1024;

type CsvHeader = (typeof WHATSAPP_CONTACT_CSV_HEADERS)[number];

export type WhatsAppContactCsvImportRow = {
  rowNumber: number;
  waId: string;
  payload: Record<string, unknown>;
};

export type WhatsAppContactCsvParseResult = {
  rows: WhatsAppContactCsvImportRow[];
  errors: Array<{ row: number; message: string }>;
};

function utf8Size(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function protectSpreadsheetCell(value: string) {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

function unprotectSpreadsheetCell(value: string) {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function csvCell(value: unknown) {
  const text = protectSpreadsheetCell(value == null ? "" : String(value));
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function customFieldsToText(fields: Record<string, string>) {
  return Object.entries(fields).map(([key, value]) => `${key}=${value}`).join("\n");
}

export function encodeWhatsAppContactsCsv(contacts: WhatsAppContactRow[]) {
  const lines = [WHATSAPP_CONTACT_CSV_HEADERS.join(",")];
  for (const contact of contacts) {
    const values: Record<CsvHeader, string> = {
      whatsapp_number: contact.wa_id,
      display_name: contact.display_name || "",
      company: contact.business_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      website: contact.website || "",
      source: contact.source || "WhatsApp",
      lead_temperature: contact.lead_temperature,
      lead_stage: contact.lead_stage,
      tags: contact.tags.join(", "),
      opt_in_status: contact.opt_in_status,
      custom_fields: customFieldsToText(contact.custom_fields),
    };
    lines.push(WHATSAPP_CONTACT_CSV_HEADERS.map((header) => csvCell(values[header])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function createWhatsAppContactCsvTemplate() {
  const example: WhatsAppContactRow = {
    id: "template",
    wa_id: "2348012345678",
    display_name: "Example Customer",
    business_name: "Example Company",
    email: "customer@example.com",
    phone: "+2348012345678",
    website: "https://example.com/",
    source: "CSV Import",
    lead_status: "open",
    lead_temperature: "WARM",
    lead_stage: "QUALIFIED",
    tags: ["VIP", "Lagos"],
    custom_fields: { Budget: "500000", Service: "Website Design" },
    opt_in_status: "OPTED_IN",
    crm_ready: true,
  };
  return encodeWhatsAppContactsCsv([example]);
}

export function parseCsvRecords(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]!;
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      if (cell.length) throw new Error("Unexpected quote inside an unquoted CSV field.");
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length)) rows.push(row);
  }
  return rows;
}

function clean(value: string | undefined, max: number) {
  return unprotectSpreadsheetCell(value || "").trim().slice(0, max);
}

export function parseWhatsAppContactCsv(input: string): WhatsAppContactCsvParseResult {
  if (utf8Size(input) > WHATSAPP_CONTACT_CSV_MAX_BYTES) {
    throw new Error("CSV file is larger than 512 KB.");
  }

  const records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  if (!records.length) throw new Error("CSV file is empty.");

  const headers = records[0]!.map((header) => header.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error("CSV contains duplicate column headers.");
  if (!headers.includes("whatsapp_number")) throw new Error("CSV must include a whatsapp_number column.");

  const allowed = new Set<string>(WHATSAPP_CONTACT_CSV_HEADERS);
  const unknown = headers.filter((header) => !allowed.has(header));
  if (unknown.length) throw new Error(`Unknown CSV column${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}.`);

  const dataRows = records.slice(1);
  if (dataRows.length > WHATSAPP_CONTACT_CSV_MAX_ROWS) {
    throw new Error(`CSV imports are limited to ${WHATSAPP_CONTACT_CSV_MAX_ROWS} contacts at a time.`);
  }

  const rows: WhatsAppContactCsvImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const rowNumber = index + 2;
    const record = dataRows[index]!;
    if (record.length !== headers.length) {
      errors.push({ row: rowNumber, message: "Column count does not match the header row." });
      continue;
    }
    const data = Object.fromEntries(headers.map((header, cellIndex) => [header, record[cellIndex] || ""])) as Record<string, string>;
    const waId = normalizeWhatsAppContactNumber(clean(data.whatsapp_number, 40));
    if (!waId) {
      errors.push({ row: rowNumber, message: "Invalid WhatsApp number." });
      continue;
    }

    const email = clean(data.email, 254).toLowerCase();
    if (!isValidWhatsAppContactEmail(email)) {
      errors.push({ row: rowNumber, message: "Invalid email address." });
      continue;
    }

    const websiteInput = clean(data.website, 300);
    const website = normalizeWhatsAppContactWebsite(websiteInput);
    if (website === null) {
      errors.push({ row: rowNumber, message: "Invalid website address." });
      continue;
    }

    const temperature = clean(data.lead_temperature, 10).toUpperCase() || "COLD";
    if (!isWhatsAppContactTemperature(temperature)) {
      errors.push({ row: rowNumber, message: "lead_temperature must be COLD, WARM, or HOT." });
      continue;
    }
    const leadStage = clean(data.lead_stage, 30).toUpperCase() || "NEW";
    if (!isWhatsAppContactLeadStage(leadStage)) {
      errors.push({ row: rowNumber, message: "Invalid lead_stage value." });
      continue;
    }
    const optInStatus = clean(data.opt_in_status, 20).toUpperCase() || "UNKNOWN";
    if (!isWhatsAppContactOptInStatus(optInStatus)) {
      errors.push({ row: rowNumber, message: "Invalid opt_in_status value." });
      continue;
    }

    const tags = normalizeWhatsAppContactTags(clean(data.tags, 900));
    if (tags === null) {
      errors.push({ row: rowNumber, message: "Tags are invalid or exceed the CRM limits." });
      continue;
    }
    const customFields = normalizeWhatsAppContactCustomFields(unprotectSpreadsheetCell(data.custom_fields || ""));
    if (customFields === null) {
      errors.push({ row: rowNumber, message: "custom_fields must use key=value lines and stay within CRM limits." });
      continue;
    }

    const now = new Date().toISOString();
    rows.push({
      rowNumber,
      waId,
      payload: {
        wa_id: waId,
        display_name: clean(data.display_name, 120) || null,
        business_name: clean(data.company, 160) || null,
        email: email || null,
        phone: clean(data.phone, 50) || `+${waId}`,
        website: website || null,
        source: clean(data.source, 80) || "CSV Import",
        lead_status: "open",
        lead_temperature: temperature,
        lead_stage: leadStage,
        tags,
        custom_fields: customFields,
        opt_in_status: optInStatus,
        opt_in_at: optInStatus === "OPTED_IN" ? now : null,
        opt_out_at: optInStatus === "OPTED_OUT" ? now : null,
        updated_at: now,
      },
    });
  }

  return { rows, errors };
}
