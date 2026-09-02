import { getWhatsAppSupabaseConfig } from "@/app/admin/whatsapp/data";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

export type WhatsAppCallDirection = "inbound" | "outbound";
export type WhatsAppCallRow = { call_id: string; direction: WhatsAppCallDirection; customer_wa_id: string | null; customer_name: string | null; status: string; started_at: string | null; answered_at: string | null; ended_at: string | null; duration_seconds: number | null; last_event_at: string };
function asRecord(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" ? value as Record<string, unknown> : null; }
function asText(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function toIso(value: unknown) { const seconds = typeof value === "string" || typeof value === "number" ? Number(value) : NaN; return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : new Date().toISOString(); }
export function extractWhatsAppCallEvents(payload: unknown) {
  const root = asRecord(payload); const entries = Array.isArray(root?.entry) ? root!.entry : []; const events: Array<Record<string, unknown>> = [];
  for (const entryValue of entries) { const entry = asRecord(entryValue); const changes = Array.isArray(entry?.changes) ? entry!.changes : []; for (const changeValue of changes) { const value = asRecord(asRecord(changeValue)?.value); if (!value) continue; const contacts = Array.isArray(value.contacts) ? value.contacts : []; const firstContact = asRecord(contacts[0]); const profile = asRecord(firstContact?.profile); const contactName = asText(profile?.name); const contactWaId = asText(firstContact?.wa_id); const calls = Array.isArray(value.calls) ? value.calls : [];
      for (const callValue of calls) { const call = asRecord(callValue); if (!call) continue; const id = asText(call.id); if (!id) continue; const rawDirection = asText(call.direction)?.toUpperCase() || ""; const direction: WhatsAppCallDirection = rawDirection.includes("BUSINESS") ? "outbound" : "inbound"; const from = asText(call.from); const to = asText(call.to); const event = (asText(call.event) || "unknown").toLowerCase(); events.push({ call_id: id, direction, customer_wa_id: contactWaId || (direction === "inbound" ? from : to), customer_name: contactName, status: event === "connect" ? (direction === "inbound" ? "ringing" : "connecting") : event, event, occurred_at: toIso(call.timestamp), raw: call }); }
    } }
  return events;
}
export async function storeWhatsAppCallEvents(payload: unknown, options: { workspaceId?: string | null } = {}) {
  const events = extractWhatsAppCallEvents(payload); if (!events.length) return 0; const config = getWhatsAppSupabaseConfig(); if (!config) return 0;
  const workspaceId = isWhatsAppWorkspaceId(options.workspaceId) ? options.workspaceId : null;
  for (const event of events) {
    const eventTime = String(event.occurred_at); const status = String(event.status);
    const body = { ...(workspaceId ? { workspace_id: workspaceId } : {}), call_id: event.call_id, direction: event.direction, customer_wa_id: event.customer_wa_id, customer_name: event.customer_name, status, started_at: status === "ringing" || status === "connecting" ? eventTime : undefined, answered_at: status === "accepted" ? eventTime : undefined, ended_at: status === "terminate" || status === "terminated" || status === "rejected" ? eventTime : undefined, last_event_at: eventTime, raw: event.raw, updated_at: new Date().toISOString() };
    const conflict = workspaceId ? "workspace_id,call_id" : "call_id";
    const response = await fetch(`${config.url}/rest/v1/whatsapp_calls?on_conflict=${conflict}`, { method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body), cache: "no-store" });
    if (!response.ok && response.status !== 404) console.error("WhatsApp call history write failed", response.status, await response.text().catch(() => ""));
  }
  return events.length;
}
