import { getDefaultWhatsAppWorkspace, readRequestedWhatsAppWorkspaceIdFromRequest } from "./workspaces";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

export type WhatsAppQuickSettings = {
  typingIndicatorEnabled: boolean;
  newMessageAlertsEnabled: boolean;
  serviceWindowWarningEnabled: boolean;
  deliveryStatusVisible: boolean;
  readStatusVisible: boolean;
};
export const WHATSAPP_DEFAULT_QUICK_SETTINGS: WhatsAppQuickSettings = {
  typingIndicatorEnabled: true,
  newMessageAlertsEnabled: true,
  serviceWindowWarningEnabled: true,
  deliveryStatusVisible: true,
  readStatusVisible: true,
};
const TABLE = "whatsapp_settings";
const ROW_ID = "quick-controls";
function config() { const url = process.env.SUPABASE_URL?.trim(); const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(); if (!url || !key) return null; return { url: url.replace(/\/$/, ""), key }; }
function parse(raw: unknown): WhatsAppQuickSettings {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    typingIndicatorEnabled: typeof value.typingIndicatorEnabled === "boolean" ? value.typingIndicatorEnabled : true,
    newMessageAlertsEnabled: typeof value.newMessageAlertsEnabled === "boolean" ? value.newMessageAlertsEnabled : true,
    serviceWindowWarningEnabled: typeof value.serviceWindowWarningEnabled === "boolean" ? value.serviceWindowWarningEnabled : true,
    deliveryStatusVisible: typeof value.deliveryStatusVisible === "boolean" ? value.deliveryStatusVisible : true,
    readStatusVisible: typeof value.readStatusVisible === "boolean" ? value.readStatusVisible : true,
  };
}
async function workspaceId(explicit?: string | null) {
  if (isWhatsAppWorkspaceId(explicit)) return explicit;
  const requested = await readRequestedWhatsAppWorkspaceIdFromRequest();
  if (requested) return requested;
  return (await getDefaultWhatsAppWorkspace())?.id || null;
}
export async function loadWhatsAppQuickSettings(options: { workspaceId?: string | null } = {}): Promise<WhatsAppQuickSettings> {
  const resolved = config(); const scope = await workspaceId(options.workspaceId);
  if (!resolved || !scope) return WHATSAPP_DEFAULT_QUICK_SETTINGS;
  try {
    const response = await fetch(`${resolved.url}/rest/v1/${TABLE}?select=settings&id=eq.${ROW_ID}&workspace_id=eq.${encodeURIComponent(scope)}&limit=1`, { headers: { apikey: resolved.key, Authorization: `Bearer ${resolved.key}` }, cache: "no-store" });
    if (!response.ok) return WHATSAPP_DEFAULT_QUICK_SETTINGS;
    const rows = await response.json() as Array<{ settings?: unknown }>;
    return parse(rows[0]?.settings);
  } catch { return WHATSAPP_DEFAULT_QUICK_SETTINGS; }
}
export async function saveWhatsAppQuickSettings(settings: WhatsAppQuickSettings, options: { workspaceId?: string | null } = {}): Promise<{ ok: true; settings: WhatsAppQuickSettings } | { ok: false; error: string }> {
  const resolved = config(); const scope = await workspaceId(options.workspaceId);
  if (!resolved || !scope) return { ok: false, error: "WhatsApp storage is not configured." };
  const normalized = parse(settings);
  try {
    const response = await fetch(`${resolved.url}/rest/v1/${TABLE}?on_conflict=workspace_id,id`, {
      method: "POST",
      headers: { apikey: resolved.key, Authorization: `Bearer ${resolved.key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ workspace_id: scope, id: ROW_ID, settings: normalized, updated_at: new Date().toISOString() }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, error: "Quick settings could not be saved." };
    return { ok: true, settings: normalized };
  } catch { return { ok: false, error: "Quick settings could not be saved." }; }
}
