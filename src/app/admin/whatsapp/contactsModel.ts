/**
 * Pure model for the WhatsApp contacts list and Stage 3 CRM forms.
 *
 * Everything here maps to real `whatsapp_contacts` columns (see
 * `supabase/migrations/202608130001_whatsapp_crm.sql`). Missing values stay
 * `undefined` so the UI can render "—" rather than inventing content.
 */
export type WhatsAppContactConversation = {
  id: string;
  status: string;
  intent?: string;
  last_message_at?: string;
  human_review_required: boolean;
  assigned_member_id?: string;
};

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

export function normalizeWhatsAppContactRow(row: Record<string, unknown>): WhatsAppContactRow {
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
    created_at: readOptionalText(row.created_at),
    updated_at: readOptionalText(row.updated_at),
    conversation: readConversation(row.whatsapp_conversations),
  };
}

export function getWhatsAppContactName(contact: WhatsAppContactRow) {
  return contact.display_name || contact.business_name || contact.wa_id || "Unknown contact";
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
