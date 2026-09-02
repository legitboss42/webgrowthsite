import { buildWhatsAppMetaTemplateComponents, listWhatsAppTemplateVariables, type WhatsAppTemplateDraftInput } from "./templateModel";

export type WhatsAppTemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DISABLED" | "UNKNOWN";
export type WhatsAppTemplateButton = { type: string; text?: string; url?: string; phone_number?: string };
export type WhatsAppTemplateComponent = { type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "UNKNOWN"; format?: string; text?: string; buttons?: WhatsAppTemplateButton[] };
export type WhatsAppTemplate = { id: string; name: string; status: WhatsAppTemplateStatus; category?: string; language?: string; rejectedReason?: string; qualityScore?: string; lastUpdatedTime?: string; components: WhatsAppTemplateComponent[] };
export type WhatsAppTemplateFetchResult = { ok: true; templates: WhatsAppTemplate[] } | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR" };
export type WhatsAppTemplateCreateResult = { ok: true; id: string; status?: string; category?: string } | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR"; error?: string };
export type WhatsAppTemplateSendResult = { ok: true; messageId: string } | { ok: false; reason: "NOT_CONFIGURED" | "INVALID_RECIPIENT" | "PERMISSION_DENIED" | "API_ERROR"; error?: string };

const KNOWN_STATUSES: WhatsAppTemplateStatus[] = ["APPROVED", "PENDING", "REJECTED", "PAUSED", "DISABLED"];
const KNOWN_COMPONENT_TYPES: WhatsAppTemplateComponent["type"][] = ["HEADER", "BODY", "FOOTER", "BUTTONS"];
function readText(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
async function readMetaError(response: Response) { const payload = await response.json().catch(() => null) as { error?: { message?: string; code?: number } } | null; return { message: payload?.error?.message, code: payload?.error?.code }; }
function classifyMetaPermission(status: number, code?: number) { return status === 401 || status === 403 || code === 10 || code === 200 || code === 190; }
function normalizeRecipient(value: string) {
  const digits = value.trim().replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}
async function resolveMeta(options: MetaOptions) {
  // Kept behind a dynamic import so client components can use the pure presentation
  // helpers above without bundling Node crypto/request-context modules into the browser.
  const { resolveWhatsAppMetaConfig } = await import("./workspaceCredentials");
  return resolveWhatsAppMetaConfig({ workspaceId: options.workspaceId, env: options.env });
}

export function normalizeWhatsAppTemplateComponent(raw: Record<string, unknown>): WhatsAppTemplateComponent {
  const rawType = typeof raw.type === "string" ? raw.type.toUpperCase() : "";
  const type = (KNOWN_COMPONENT_TYPES as string[]).includes(rawType) ? rawType as WhatsAppTemplateComponent["type"] : "UNKNOWN";
  const buttons = Array.isArray(raw.buttons) ? (raw.buttons as Array<Record<string, unknown>>).map((button) => ({ type: typeof button.type === "string" ? button.type.toUpperCase() : "UNKNOWN", text: readText(button.text), url: readText(button.url), phone_number: readText(button.phone_number) })) : undefined;
  return { type, format: readText(raw.format), text: readText(raw.text), ...(buttons?.length ? { buttons } : {}) };
}
export function normalizeWhatsAppTemplate(raw: Record<string, unknown>): WhatsAppTemplate {
  const rawStatus = typeof raw.status === "string" ? raw.status.toUpperCase() : "";
  const quality = raw.quality_score && typeof raw.quality_score === "object" ? readText((raw.quality_score as Record<string, unknown>).score) : readText(raw.quality_score);
  return { id: String(raw.id || ""), name: String(raw.name || ""), status: (KNOWN_STATUSES as string[]).includes(rawStatus) ? rawStatus as WhatsAppTemplateStatus : "UNKNOWN", category: readText(raw.category), language: readText(raw.language), rejectedReason: readText(raw.rejected_reason), qualityScore: quality, lastUpdatedTime: readText(raw.last_updated_time), components: Array.isArray(raw.components) ? (raw.components as Array<Record<string, unknown>>).map(normalizeWhatsAppTemplateComponent) : [] };
}
export function getWhatsAppTemplateComponent(template: WhatsAppTemplate, type: WhatsAppTemplateComponent["type"]) { return template.components.find((component) => component.type === type); }
export function getWhatsAppTemplateBodyText(template: WhatsAppTemplate) { return getWhatsAppTemplateComponent(template, "BODY")?.text; }
export { listWhatsAppTemplateVariables };
export function countWhatsAppTemplatesByStatus(templates: WhatsAppTemplate[]) { const counts: Record<string, number> = { ALL: templates.length }; for (const status of [...KNOWN_STATUSES, "UNKNOWN" as const]) counts[status] = templates.filter((template) => template.status === status).length; return counts; }
export function sortWhatsAppTemplates(templates: WhatsAppTemplate[]) { const rank = (status: WhatsAppTemplateStatus) => status === "APPROVED" ? 0 : status === "PENDING" ? 1 : status === "REJECTED" ? 2 : 3; return [...templates].sort((left, right) => rank(left.status) - rank(right.status) || left.name.localeCompare(right.name)); }

type MetaOptions = { env?: Record<string, string | undefined>; workspaceId?: string | null; fetch?: typeof globalThis.fetch };
export async function fetchWhatsAppTemplates(options: MetaOptions & { limit?: number } = {}): Promise<WhatsAppTemplateFetchResult> {
  const meta = await resolveMeta(options);
  if (!meta?.wabaId) return { ok: false, reason: "NOT_CONFIGURED" };
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 100;
  try {
    const fields = "id,name,status,category,language,components,rejected_reason,quality_score,last_updated_time";
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${meta.apiVersion}/${meta.wabaId}/message_templates?limit=${limit}&fields=${fields}`, { headers: { Authorization: `Bearer ${meta.token}` }, cache: "no-store" });
    if (!response.ok) { const detail = await readMetaError(response); console.error("WhatsApp template fetch failed", response.status, detail.code, detail.message, meta.workspaceId); return { ok: false, reason: classifyMetaPermission(response.status, detail.code) ? "PERMISSION_DENIED" : "API_ERROR" }; }
    const payload = await response.json().catch(() => null) as { data?: unknown } | null; const rows = Array.isArray(payload?.data) ? payload!.data as Array<Record<string, unknown>> : [];
    return { ok: true, templates: sortWhatsAppTemplates(rows.map(normalizeWhatsAppTemplate)) };
  } catch (error) { console.error("Unable to reach Meta for WhatsApp templates", error); return { ok: false, reason: "API_ERROR" }; }
}

export async function createWhatsAppTemplate(input: WhatsAppTemplateDraftInput, options: MetaOptions = {}): Promise<WhatsAppTemplateCreateResult> {
  const meta = await resolveMeta(options);
  if (!meta?.wabaId) return { ok: false, reason: "NOT_CONFIGURED" };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${meta.apiVersion}/${meta.wabaId}/message_templates`, { method: "POST", headers: { Authorization: `Bearer ${meta.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: input.name, language: input.language, category: input.category, components: buildWhatsAppMetaTemplateComponents(input) }) });
    const payload = await response.json().catch(() => null) as { id?: string; status?: string; category?: string; error?: { message?: string; code?: number } } | null;
    if (!response.ok || !payload?.id) { const code = payload?.error?.code; console.error("WhatsApp template create failed", response.status, code, payload?.error?.message, meta.workspaceId); return { ok: false, reason: classifyMetaPermission(response.status, code) ? "PERMISSION_DENIED" : "API_ERROR", error: payload?.error?.message }; }
    return { ok: true, id: payload.id, status: payload.status, category: payload.category };
  } catch (error) { console.error("Unable to submit WhatsApp template", error); return { ok: false, reason: "API_ERROR" }; }
}

export async function sendWhatsAppTemplateMessage(input: { to: string; name: string; language: string; headerParameters?: string[]; bodyParameters?: string[] }, options: MetaOptions = {}): Promise<WhatsAppTemplateSendResult> {
  const meta = await resolveMeta(options);
  if (!meta) return { ok: false, reason: "NOT_CONFIGURED" };
  const recipient = normalizeRecipient(input.to); if (!recipient) return { ok: false, reason: "INVALID_RECIPIENT" };
  const components: Array<Record<string, unknown>> = [];
  if (input.headerParameters?.length) components.push({ type: "header", parameters: input.headerParameters.map((text) => ({ type: "text", text })) });
  if (input.bodyParameters?.length) components.push({ type: "body", parameters: input.bodyParameters.map((text) => ({ type: "text", text })) });
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${meta.apiVersion}/${meta.phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${meta.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: recipient, type: "template", template: { name: input.name, language: { code: input.language }, ...(components.length ? { components } : {}) } }) });
    const payload = await response.json().catch(() => null) as { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } } | null; const messageId = payload?.messages?.[0]?.id;
    if (!response.ok || !messageId) { const code = payload?.error?.code; console.error("WhatsApp template send failed", response.status, code, payload?.error?.message, meta.workspaceId); return { ok: false, reason: classifyMetaPermission(response.status, code) ? "PERMISSION_DENIED" : "API_ERROR", error: payload?.error?.message }; }
    return { ok: true, messageId };
  } catch (error) { console.error("Unable to send WhatsApp template", error); return { ok: false, reason: "API_ERROR" }; }
}
