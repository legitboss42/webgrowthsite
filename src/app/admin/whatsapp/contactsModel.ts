/**
 * Pure model for the WhatsApp contacts list.
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
export type WhatsAppContactFilter = (typeof WHATSAPP_CONTACT_FILTERS)[number];

/** Widest list we will pull in one request; the UI says so when it is reached. */
export const WHATSAPP_CONTACT_PAGE_SIZE = 200;

export function isWhatsAppContactFilter(value: string | undefined): value is WhatsAppContactFilter {
  return WHATSAPP_CONTACT_FILTERS.includes(value as WhatsAppContactFilter);
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
  // PostgREST returns an embedded row as an object or a single-element array
  // depending on how it resolves the relationship, so accept both.
  const row = (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  if (!row || typeof row !== "object" || !row.id) return undefined;

  return {
    id: String(row.id),
    status: String(row.status || "open"),
    intent: typeof row.intent === "string" ? row.intent : undefined,
    last_message_at: typeof row.last_message_at === "string" ? row.last_message_at : undefined,
    human_review_required: row.human_review_required === true,
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

export function countWhatsAppContactsByTemperature(contacts: WhatsAppContactRow[]) {
  return {
    ALL: contacts.length,
    HOT: contacts.filter((contact) => contact.lead_temperature === "HOT").length,
    WARM: contacts.filter((contact) => contact.lead_temperature === "WARM").length,
    COLD: contacts.filter((contact) => contact.lead_temperature === "COLD").length,
  } satisfies Record<WhatsAppContactFilter, number>;
}
