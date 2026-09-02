import { randomUUID } from "node:crypto";
import { normalizeWhatsAppRecipient } from "./send";
import type { WhatsAppFlowCategory } from "./flowModel";

export type MetaWhatsAppFlow = {
  id: string;
  name: string;
  status: string;
  categories: string[];
  validationErrors: Array<Record<string, unknown>>;
  jsonVersion?: string;
  dataApiVersion?: string;
  endpointUri?: string;
  previewUrl?: string;
  previewExpiresAt?: string;
  healthStatus?: Record<string, unknown>;
};

type MetaOptions = { env?: Record<string, string | undefined>; fetch?: typeof globalThis.fetch };
type MetaError = { message?: string; code?: number; error_subcode?: number };

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function config(env: Record<string, string | undefined>) {
  return {
    token: env.WHATSAPP_ACCESS_TOKEN?.trim(),
    wabaId: env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim(),
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    apiVersion: env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0",
  };
}
async function payload(response: Response) { return (await response.json().catch(() => null)) as Record<string, unknown> | null; }
function errorFrom(body: Record<string, unknown> | null): MetaError { return record(body?.error) as MetaError; }
function failure(response: Response, body: Record<string, unknown> | null, fallback: string) {
  const detail = errorFrom(body);
  const message = text(detail.message) || fallback;
  console.error("WhatsApp Flows Meta API failed", response.status, detail.code, detail.error_subcode, message);
  return { ok: false as const, status: response.status, error: message, code: detail.code };
}
function metaFlow(raw: Record<string, unknown>): MetaWhatsAppFlow {
  const preview = record(raw.preview);
  return {
    id: String(raw.id || ""),
    name: text(raw.name),
    status: text(raw.status).toUpperCase() || "UNKNOWN",
    categories: Array.isArray(raw.categories) ? raw.categories.filter((v): v is string => typeof v === "string") : [],
    validationErrors: Array.isArray(raw.validation_errors) ? raw.validation_errors.filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object" && !Array.isArray(v))) : [],
    jsonVersion: text(raw.json_version) || undefined,
    dataApiVersion: text(raw.data_api_version) || undefined,
    endpointUri: text(raw.data_channel_uri) || text(raw.endpoint_uri) || undefined,
    previewUrl: text(preview.preview_url) || text(raw.preview_url) || undefined,
    previewExpiresAt: text(preview.expires_at) || undefined,
    healthStatus: Object.keys(record(raw.health_status)).length ? record(raw.health_status) : undefined,
  };
}

export async function createMetaWhatsAppFlow(input: { name: string; categories: WhatsAppFlowCategory[]; endpointUri?: string; cloneFlowId?: string }, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, wabaId, apiVersion } = config(env);
  if (!token || !wabaId) return { ok: false as const, error: "WhatsApp Meta credentials are not configured." };
  const body: Record<string, unknown> = { name: input.name, categories: input.categories };
  if (input.endpointUri) body.endpoint_uri = input.endpointUri;
  if (input.cloneFlowId) body.clone_flow_id = input.cloneFlowId;
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${wabaId}/flows`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await payload(response); if (!response.ok || !data?.id) return failure(response, data, "Meta could not create the Flow.");
    return { ok: true as const, id: String(data.id), success: data.success === true };
  } catch (error) { console.error("Meta Flow create request failed", error); return { ok: false as const, error: "Meta could not be reached to create the Flow." }; }
}

export async function uploadMetaWhatsAppFlowJson(flowId: string, flowJson: Record<string, unknown>, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, apiVersion } = config(env); if (!token) return { ok: false as const, error: "WhatsApp Meta credentials are not configured." };
  try {
    const form = new FormData();
    form.set("name", "flow.json"); form.set("asset_type", "FLOW_JSON");
    form.set("file", new Blob([JSON.stringify(flowJson)], { type: "application/json" }), "flow.json");
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${flowId}/assets`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form, cache: "no-store" });
    const data = await payload(response); if (!response.ok) return failure(response, data, "Meta rejected the Flow JSON upload.");
    const errors = Array.isArray(data?.validation_errors) ? data.validation_errors.filter((v): v is Record<string, unknown> => Boolean(v && typeof v === "object" && !Array.isArray(v))) : [];
    return { ok: true as const, success: data?.success !== false, validationErrors: errors };
  } catch (error) { console.error("Meta Flow asset upload failed", error); return { ok: false as const, error: "Meta could not be reached to upload the Flow JSON." }; }
}

export async function getMetaWhatsAppFlow(flowId: string, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, apiVersion } = config(env); if (!token) return { ok: false as const, error: "WhatsApp Meta credentials are not configured." };
  try {
    const fields = "id,name,categories,preview,status,validation_errors,json_version,data_api_version,data_channel_uri,health_status";
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${flowId}?fields=${encodeURIComponent(fields)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await payload(response); if (!response.ok || !data) return failure(response, data, "Meta could not load this Flow.");
    return { ok: true as const, flow: metaFlow(data) };
  } catch (error) { console.error("Meta Flow get failed", error); return { ok: false as const, error: "Meta could not be reached to load the Flow." }; }
}

async function flowMutation(flowId: string, action: "publish" | "deprecate", options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, apiVersion } = config(env); if (!token) return { ok: false as const, error: "WhatsApp Meta credentials are not configured." };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${flowId}/${action}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await payload(response); if (!response.ok || data?.success === false) return failure(response, data, `Meta could not ${action} the Flow.`);
    return { ok: true as const };
  } catch (error) { console.error(`Meta Flow ${action} failed`, error); return { ok: false as const, error: `Meta could not be reached to ${action} the Flow.` }; }
}
export function publishMetaWhatsAppFlow(flowId: string, options?: MetaOptions) { return flowMutation(flowId, "publish", options); }
export function deprecateMetaWhatsAppFlow(flowId: string, options?: MetaOptions) { return flowMutation(flowId, "deprecate", options); }

export async function deleteMetaWhatsAppFlow(flowId: string, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, apiVersion } = config(env); if (!token) return { ok: false as const, error: "WhatsApp Meta credentials are not configured." };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${flowId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await payload(response); if (!response.ok || data?.success === false) return failure(response, data, "Meta could not delete the Draft Flow.");
    return { ok: true as const };
  } catch (error) { console.error("Meta Flow delete failed", error); return { ok: false as const, error: "Meta could not be reached to delete the Flow." }; }
}

export async function setMetaWhatsAppFlowPublicKey(publicKey: string, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, phoneNumberId, apiVersion } = config(env); if (!token || !phoneNumberId) return { ok: false as const, error: "WhatsApp sender credentials are not configured." };
  try {
    const form = new URLSearchParams(); form.set("business_public_key", publicKey);
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_encryption`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString(), cache: "no-store" });
    const data = await payload(response); if (!response.ok || data?.success === false) return failure(response, data, "Meta could not register the Flow public key.");
    return { ok: true as const };
  } catch (error) { console.error("Meta Flow key registration failed", error); return { ok: false as const, error: "Meta could not be reached to register the Flow public key." }; }
}

export async function getMetaWhatsAppFlowPublicKey(options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, phoneNumberId, apiVersion } = config(env); if (!token || !phoneNumberId) return { ok: false as const, error: "WhatsApp sender credentials are not configured." };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_encryption`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await payload(response); if (!response.ok || !data) return failure(response, data, "Meta could not read the Flow public key.");
    return { ok: true as const, publicKey: text(data.business_public_key), signatureStatus: text(data.business_public_key_signature_status) || undefined };
  } catch (error) { console.error("Meta Flow key read failed", error); return { ok: false as const, error: "Meta could not be reached to read the Flow public key." }; }
}

export async function sendWhatsAppFlowMessage(input: { to: string; flowId: string; flowToken?: string; cta?: string; body?: string; header?: string; screen?: string; data?: Record<string, unknown> }, options: MetaOptions = {}) {
  const env = options.env || process.env; const { token, phoneNumberId, apiVersion } = config(env); if (!token || !phoneNumberId) return { ok: false as const, error: "WhatsApp sender credentials are not configured." };
  const recipient = normalizeWhatsAppRecipient(input.to); if (!recipient) return { ok: false as const, error: "Choose a valid WhatsApp recipient." };
  const flowToken = input.flowToken || randomUUID();
  const parameters: Record<string, unknown> = { flow_message_version: "3", flow_token: flowToken, flow_id: input.flowId, flow_cta: (input.cta || "Open").slice(0, 30), flow_action: "navigate" };
  if (input.screen || input.data) parameters.flow_action_payload = { ...(input.screen ? { screen: input.screen } : {}), ...(input.data ? { data: input.data } : {}) };
  const interactive: Record<string, unknown> = { type: "flow", body: { text: (input.body || "Please complete this form.").slice(0, 1024) }, action: { name: "flow", parameters } };
  if (input.header) interactive.header = { type: "text", text: input.header.slice(0, 60) };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: recipient, type: "interactive", interactive }), cache: "no-store" });
    const data = await payload(response); const messages = Array.isArray(data?.messages) ? data.messages as Array<Record<string, unknown>> : []; const messageId = text(messages[0]?.id);
    if (!response.ok || !messageId) return failure(response, data, "Meta could not send the WhatsApp Flow.");
    return { ok: true as const, messageId, flowToken };
  } catch (error) { console.error("Meta Flow send failed", error); return { ok: false as const, error: "Meta could not be reached to send the WhatsApp Flow." }; }
}
