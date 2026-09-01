/**
 * Pure model for the WhatsApp contacts list and Stage 3 CRM forms.
 *
 * The original contact columns come from `202608130001_whatsapp_crm.sql`. The
 * Stage 3 CRM extension adds pipeline stage, tags, custom fields and opt-in state.
 * Normalisation deliberately falls back to safe defaults so the UI can keep
 * rendering while the additive migration is waiting to be applied in Supabase.
 */
export type WhatsAppContactConversation = {
  id: string;
  status: string;
  intent?: string;
  last_message_at?: string;
  human_review_required: boolean;
  assigned_member_id?: string;
};

export const WHATSAPP_CONTACT_LEAD_STAGES = [
  "NEW",
  "QUALIFIED",
  "FOLLOW_UP",
  "CUSTOMER",
  "REPEAT_CUSTOMER",
  "LOST",
] as const;
export const WHATSAPP_CONTACT_OPT_IN_STATUSES = ["UNKNOWN", "OPTED_IN", "OPTED_OUT"] as const;

export type WhatsAppContactLeadStage = (typeof WHATSAPP_CONTACT_LEAD_STAGES)[number];
export type WhatsAppContactOptInStatus = (typeof WHATSAPP_CONTACT_OPT_IN_STATUSES)[number];

export type WhatsAppContactRow = {
  id: string;
  wa_id: string;
  phone?: string;
  display_name?: string;
  business_name?: string;
  email?: string;
  website?: string;
  source?: string;
  lead_status: string;
  lead_temperature: "COLD" | "WARM" | "HOT";
  lead_stage: WhatsAppContactLeadStage;
  tags: string[];
  custom_fields: Record<string, string>;
  opt_in_status: WhatsAppContactOptInStatus;
  opt_in_at?: string;
  opt_out_at?: string;
  crm_ready: boolean;
  created_at?: string;
  updated_at?: string;
  conversation?: WhatsAppContactConversation;
};

export const WHATSAPP_CONTACT_FILTERS = ["ALL", "HOT", "WARM", "COLD"] as const;
export const WHATSAPP_CONTACT_TEMPERATURES = ["COLD", "WARM", "HOT"] as const;
export type WhatsAppContactFilter = (typeof WHATSAPP_CONTACT_FILTERS)[number];
export type WhatsAppContactTemperature = (typeof WHATSAPP_CONTACT_TEMPERATURES)[number];

/** Widest list we will pull in one request; the UI says so when it is reached. */
export const WHATSAPP_CONTACT_PAGE_SIZE = 200;

export function isWhatsAppContactFilter(value: string | undefined): value is WhatsAppContactFilter {
  return WHATSAPP_CONTACT_FILTERS.includes(value as WhatsAppContactFilter);
}

export function isWhatsAppContactTemperature(value: unknown): value is WhatsAppContactTemperature {
  return WHATSAPP_CONTACT_TEMPERATURES.includes(value as WhatsAppContactTemperature);
}

export function isWhatsAppContactLeadStage(value: unknown): value is WhatsAppContactLeadStage {
  return WHATSAPP_CONTACT_LEAD_STAGES.includes(value as WhatsAppContactLeadStage);
}

export function isWhatsAppContactOptInStatus(value: unknown): value is WhatsAppContactOptInStatus {
  return WHATSAPP_CONTACT_OPT_IN_STATUSES.includes(value as WhatsAppContactOptInStatus);
}

/**
 * Normalises a manual CRM number into the digits-only WhatsApp `wa_id` form.
 * Nigerian local mobile numbers are converted to +234; international numbers should
 * be entered with their country code. E.164 allows at most 15 digits.
 */
export function normalizeWhatsAppContactNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let compact = value.trim().replace(/[\s().-]/g, "");
  if (!compact) return null;
  if (compact.startsWith("00")) compact = compact.slice(2);
  if (compact.startsWith("+")) compact = compact.slice(1);
  if (/^0[789]\d{9}$/.test(compact)) compact = `234${compact.slice(1)}`;
  if (!/^[1-9]\d{7,14}$/.test(compact)) return null;
  return compact;
}

export function isValidWhatsAppContactEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/** Returns an empty string for blank input, null for an invalid URL, or a safe http(s) URL. */
export function normalizeWhatsAppContactWebsite(value: unknown): string | null {
  if (typeof value !== "string") return "";
  const clean = value.trim().slice(0, 300);
  if (!clean) return "";
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Accepts a comma-separated form value or a JSON array. Tags are case-preserving,
 * de-duplicated case-insensitively and deliberately capped so a contact cannot become
 * an accidental document store.
 */
export function normalizeWhatsAppContactTags(value: unknown): string[] | null {
  const raw = typeof value === "string"
    ? value.split(",")
    : Array.isArray(value)
      ? value
      : value == null
        ? []
        : null;
  if (!raw) return null;

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const clean = item.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    if (clean.length > 40) return null;
    const key = clean.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(clean);
    if (tags.length > 20) return null;
  }
  return tags;
}

/**
 * Custom fields are intentionally string-to-string for Stage 3. The UI accepts one
 * `key=value` pair per line, while API callers may send a plain object. This keeps the
 * storage flexible without permitting nested arbitrary JSON trees.
 */
export function normalizeWhatsAppContactCustomFields(value: unknown): Record<string, string> | null {
  let entries: Array<[string, unknown]>;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return {};
    entries = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const separator = line.indexOf("=");
      if (separator <= 0) return null;
      entries.push([line.slice(0, separator), line.slice(separator + 1)]);
    }
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    entries = Object.entries(value as Record<string, unknown>);
  } else if (value == null) {
    return {};
  } else {
    return null;
  }

  if (entries.length > 20) return null;
  const result: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    if (typeof rawValue !== "string") return null;
    const key = rawKey.replace(/\s+/g, " ").trim();
    const fieldValue = rawValue.trim();
    if (!key || key.length > 40 || !/^[\p{L}\p{N} _.-]+$/u.test(key)) return null;
    if (fieldValue.length > 300) return null;
    if (!fieldValue) continue;
    result[key] = fieldValue;
  }
  return result;
}

/**
 * Strips every character that carries meaning inside a PostgREST filter
 * (`,` `(` `)` `*` `%` quotes, backslashes, control characters) so a search term can
 * never break out of the `or=(...)` expression it is embedded in. Keeps the
 * characters people actually search with: letters, digits, spaces, @ . _ - +
 */
export function sanitizeWhatsAppSearchTerm(input: string | undefined | null) {
  if (!input) return "";
  return input
    .replace(/[^\p{L}\p{N}@._+\- ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

/**
 * Builds the PostgREST `or=(...)` fragment matching a term across the columns worth
 * searching. Returns null when there is nothing to search for.
 */
export function buildWhatsAppContactSearchFilter(term: string) {
  const safe = sanitizeWhatsAppSearchTerm(term);
  if (!safe) return null;

  const pattern = `*${safe}*`;
  const clauses = ["display_name", "business_name", "email", "wa_id", "phone"].map(
    (column) => `${column}.ilike.${pattern}`,
  );
  return `or=(${encodeURIComponent(clauses.join(","))})`;
}

function readConversation(value: unknown): WhatsAppContactConversation | undefined {
  const row = (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  if (!row || typeof row !== "object" || !row.id) return undefined;

  return {
    id: String(row.id),
    status: String(row.status || "open"),
    intent: typeof row.intent === "string" ? row.intent : undefined,
    last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : undefined,
    human_review_required: row.human_review_required === true,
    assigned_member_id:
      typeof row.assigned_member_id === "string" ? row.assigned_member_id : undefined,
  };
}

function readOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

function readCustomFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

export function normalizeWhatsAppContactRow(row: Record<string, unknown>): WhatsAppContactRow {
  const crmReady = Object.prototype.hasOwnProperty.call(row, "lead_stage");
  return {
    id: String(row.id),
    wa_id: String(row.wa_id || ""),
    phone: readOptionalText(row.phone),
    display_name: readOptionalText(row.display_name),
    business_name: readOptionalText(row.business_name),
    email: readOptionalText(row.email),
    website: readOptionalText(row.website),
    source: readOptionalText(row.source),
    lead_status: String(row.lead_status || "open"),
    lead_temperature:
      row.lead_temperature === "HOT" || row.lead_temperature === "WARM"
        ? row.lead_temperature
        : "COLD",
    lead_stage: isWhatsAppContactLeadStage(row.lead_stage) ? row.lead_stage : "NEW",
    tags: readTags(row.tags),
    custom_fields: readCustomFields(row.custom_fields),
    opt_in_status: isWhatsAppContactOptInStatus(row.opt_in_status) ? row.opt_in_status : "UNKNOWN",
    opt_in_at: readOptionalText(row.opt_in_at),
    opt_out_at: readOptionalText(row.opt_out_at),
    crm_ready: crmReady,
    created_at: readOptionalText(row.created_at),
    updated_at: readOptionalText(row.updated_at),
    conversation: readConversation(row.whatsapp_conversations),
  };
}

export function getWhatsAppContactName(contact: WhatsAppContactRow) {
  return contact.display_name || contact.business_name || contact.wa_id || "Unknown contact";
}

export function formatWhatsAppLeadStage(stage: WhatsAppContactLeadStage) {
  if (stage === "FOLLOW_UP") return "Follow-up";
  if (stage === "REPEAT_CUSTOMER") return "Repeat Customer";
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

/** Agents may see contacts for their own conversations and the same unassigned pool they can claim. */
export function canAgentAccessWhatsAppContact(contact: WhatsAppContactRow, memberId: string | null) {
  if (!memberId || !contact.conversation) return false;
  const assigned = contact.conversation.assigned_member_id;
  return !assigned || assigned === memberId;
}

export function countWhatsAppContactsByTemperature(contacts: WhatsAppContactRow[]) {
  return {
    ALL: contacts.length,
    HOT: contacts.filter((contact) => contact.lead_temperature === "HOT").length,
    WARM: contacts.filter((contact) => contact.lead_temperature === "WARM").length,
    COLD: contacts.filter((contact) => contact.lead_temperature === "COLD").length,
  } satisfies Record<WhatsAppContactFilter, number>;
}
