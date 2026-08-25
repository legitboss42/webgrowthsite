/**
 * Read-only access to the WhatsApp message templates on the connected Business
 * Account.
 *
 * Templates live at Meta, not in our database, so this module calls the Graph API
 * server-side with the existing access token. The browser must never talk to Meta
 * with these credentials, so nothing here may be imported into a client component.
 *
 * Follows the same injectable `env`/`fetch` shape as `send.ts` so it can be tested
 * without network access.
 */
export type WhatsAppTemplateStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "PAUSED"
  | "DISABLED"
  | "UNKNOWN";

export type WhatsAppTemplateButton = {
  type: string;
  text?: string;
  url?: string;
  phone_number?: string;
};

export type WhatsAppTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "UNKNOWN";
  format?: string;
  text?: string;
  buttons?: WhatsAppTemplateButton[];
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  status: WhatsAppTemplateStatus;
  category?: string;
  language?: string;
  components: WhatsAppTemplateComponent[];
};

export type WhatsAppTemplateFetchResult =
  | { ok: true; templates: WhatsAppTemplate[] }
  | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR" };

const KNOWN_STATUSES: WhatsAppTemplateStatus[] = [
  "APPROVED",
  "PENDING",
  "REJECTED",
  "PAUSED",
  "DISABLED",
];

const KNOWN_COMPONENT_TYPES: WhatsAppTemplateComponent["type"][] = [
  "HEADER",
  "BODY",
  "FOOTER",
  "BUTTONS",
];

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function normalizeWhatsAppTemplateComponent(
  raw: Record<string, unknown>,
): WhatsAppTemplateComponent {
  const rawType = typeof raw.type === "string" ? raw.type.toUpperCase() : "";
  const type = (KNOWN_COMPONENT_TYPES as string[]).includes(rawType)
    ? (rawType as WhatsAppTemplateComponent["type"])
    : "UNKNOWN";

  const buttons = Array.isArray(raw.buttons)
    ? (raw.buttons as Array<Record<string, unknown>>).map((button) => ({
        type: typeof button.type === "string" ? button.type.toUpperCase() : "UNKNOWN",
        text: readText(button.text),
        url: readText(button.url),
        phone_number: readText(button.phone_number),
      }))
    : undefined;

  return {
    type,
    format: readText(raw.format),
    text: readText(raw.text),
    ...(buttons?.length ? { buttons } : {}),
  };
}

export function normalizeWhatsAppTemplate(raw: Record<string, unknown>): WhatsAppTemplate {
  const rawStatus = typeof raw.status === "string" ? raw.status.toUpperCase() : "";
  const components = Array.isArray(raw.components)
    ? (raw.components as Array<Record<string, unknown>>).map(normalizeWhatsAppTemplateComponent)
    : [];

  return {
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    status: (KNOWN_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as WhatsAppTemplateStatus)
      : "UNKNOWN",
    category: readText(raw.category),
    language: readText(raw.language),
    components,
  };
}

export function getWhatsAppTemplateComponent(
  template: WhatsAppTemplate,
  type: WhatsAppTemplateComponent["type"],
) {
  return template.components.find((component) => component.type === type);
}

export function getWhatsAppTemplateBodyText(template: WhatsAppTemplate) {
  return getWhatsAppTemplateComponent(template, "BODY")?.text;
}

/**
 * Placeholder names in a template body, in first-appearance order without
 * duplicates. Meta uses `{{1}}` positionally and `{{name}}` for named parameters.
 */
export function listWhatsAppTemplateVariables(text: string | undefined) {
  if (!text) return [];
  const found: string[] = [];
  for (const match of text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
    const name = match[1];
    if (!found.includes(name)) found.push(name);
  }
  return found;
}

export function countWhatsAppTemplatesByStatus(templates: WhatsAppTemplate[]) {
  const counts: Record<string, number> = { ALL: templates.length };
  for (const status of [...KNOWN_STATUSES, "UNKNOWN" as const]) {
    counts[status] = templates.filter((template) => template.status === status).length;
  }
  return counts;
}

export function sortWhatsAppTemplates(templates: WhatsAppTemplate[]) {
  // Approved first, then alphabetical, so the usable ones lead.
  const rank = (status: WhatsAppTemplateStatus) => (status === "APPROVED" ? 0 : 1);
  return [...templates].sort(
    (left, right) => rank(left.status) - rank(right.status) || left.name.localeCompare(right.name),
  );
}

type FetchOptions = {
  env?: Record<string, string | undefined>;
  fetch?: typeof globalThis.fetch;
  limit?: number;
};

export async function fetchWhatsAppTemplates(
  options: FetchOptions = {},
): Promise<WhatsAppTemplateFetchResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  if (!token || !businessAccountId) return { ok: false, reason: "NOT_CONFIGURED" };

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 100;

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates?limit=${limit}&fields=id,name,status,category,language,components`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );

    if (!response.ok) {
      // The token or its scopes are the usual cause; log for the server, stay vague
      // to the browser.
      const detail = await response.text().catch(() => "");
      console.error("WhatsApp template fetch failed", response.status, detail.slice(0, 400));
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "PERMISSION_DENIED" };
      }
      return { ok: false, reason: "API_ERROR" };
    }

    const payload = (await response.json().catch(() => null)) as { data?: unknown } | null;
    const rows = Array.isArray(payload?.data) ? (payload.data as Array<Record<string, unknown>>) : [];
    return { ok: true, templates: sortWhatsAppTemplates(rows.map(normalizeWhatsAppTemplate)) };
  } catch (error) {
    console.error("Unable to reach Meta for WhatsApp templates", error);
    return { ok: false, reason: "API_ERROR" };
  }
}
