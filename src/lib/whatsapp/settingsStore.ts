import { WHATSAPP_DEFAULT_SETTINGS, parseWhatsAppSettings, type WhatsAppSettings } from "./settings";
import { getDefaultWhatsAppWorkspace, readRequestedWhatsAppWorkspaceIdFromRequest } from "./workspaces";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

const TABLE = "whatsapp_settings";
const ROW_ID = "default";
const DEFAULT_MAX_AGE_MS = 60_000;
export type WhatsAppSettingsSource = "database" | "defaults";
export type WhatsAppSettingsLoadReason = "ok" | "unconfigured" | "missing-table" | "unreachable";
export type WhatsAppSettingsLoad = { settings: WhatsAppSettings; source: WhatsAppSettingsSource; reason: WhatsAppSettingsLoadReason };
type LoadOptions = { maxAgeMs?: number; fetch?: typeof globalThis.fetch; url?: string; serviceRoleKey?: string; now?: number; workspaceId?: string | null };
function resolveConfig(options: LoadOptions) { const url = (options.url ?? process.env.SUPABASE_URL)?.trim(); const key = (options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim(); if (!url || !key) return null; return { url: url.replace(/\/$/, ""), key }; }
const cache = new Map<string, { at: number; value: WhatsAppSettingsLoad }>();
export function invalidateWhatsAppSettingsCache(workspaceId?: string | null) { if (workspaceId) cache.delete(workspaceId); else cache.clear(); }
function withDefaults(reason: WhatsAppSettingsLoadReason): WhatsAppSettingsLoad { return { settings: WHATSAPP_DEFAULT_SETTINGS, source: "defaults", reason }; }
async function resolveWorkspaceId(explicit?: string | null) { if (isWhatsAppWorkspaceId(explicit)) return explicit; const requested = await readRequestedWhatsAppWorkspaceIdFromRequest(); if (requested) return requested; return (await getDefaultWhatsAppWorkspace())?.id || null; }

export async function loadWhatsAppSettings(options: LoadOptions = {}): Promise<WhatsAppSettingsLoad> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS; const now = options.now ?? Date.now(); const scope = await resolveWorkspaceId(options.workspaceId);
  if (!scope) return withDefaults("unconfigured");
  const cached = cache.get(scope); if (cached && maxAgeMs > 0 && now - cached.at < maxAgeMs) return cached.value;
  const config = resolveConfig(options); if (!config) return withDefaults("unconfigured");
  const fetcher = options.fetch || globalThis.fetch; let value: WhatsAppSettingsLoad;
  try {
    const response = await fetcher(`${config.url}/rest/v1/${TABLE}?select=settings&id=eq.${ROW_ID}&workspace_id=eq.${encodeURIComponent(scope)}&limit=1`, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, cache: "no-store" });
    if (response.status === 404) value = withDefaults("missing-table");
    else if (!response.ok) { console.error("WhatsApp settings read failed", { status: response.status }); value = withDefaults("unreachable"); }
    else { const rows = await response.json() as Array<{ settings?: unknown }>; const row = Array.isArray(rows) ? rows[0] : undefined; value = row ? { settings: parseWhatsAppSettings(row.settings), source: "database", reason: "ok" } : { settings: WHATSAPP_DEFAULT_SETTINGS, source: "defaults", reason: "ok" }; }
  } catch (error) { console.error("Unable to read WhatsApp settings", error); value = withDefaults("unreachable"); }
  cache.set(scope, { at: now, value }); return value;
}

export type WhatsAppSettingsSaveResult = { ok: true; settings: WhatsAppSettings } | { ok: false; reason: "unconfigured" | "missing-table" | "failed"; message: string };
const MISSING_TABLE_MESSAGE = "Settings storage has not been created yet. Run the whatsapp_settings migration, then save again.";
export async function saveWhatsAppSettings(settings: WhatsAppSettings, options: { fetch?: typeof globalThis.fetch; url?: string; serviceRoleKey?: string; workspaceId?: string | null } = {}): Promise<WhatsAppSettingsSaveResult> {
  const config = resolveConfig(options); const scope = await resolveWorkspaceId(options.workspaceId);
  if (!config || !scope) return { ok: false, reason: "unconfigured", message: "WhatsApp storage is not configured, so settings cannot be saved." };
  const fetcher = options.fetch || globalThis.fetch;
  try {
    const response = await fetcher(`${config.url}/rest/v1/${TABLE}?on_conflict=workspace_id,id`, {
      method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ workspace_id: scope, id: ROW_ID, settings, updated_at: new Date().toISOString() }), cache: "no-store",
    });
    if (response.status === 404) return { ok: false, reason: "missing-table", message: MISSING_TABLE_MESSAGE };
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { code?: string; message?: string } | null;
      if (payload?.code === "PGRST205" || payload?.code === "42P01") return { ok: false, reason: "missing-table", message: MISSING_TABLE_MESSAGE };
      console.error("WhatsApp settings write rejected", { status: response.status, code: payload?.code, message: payload?.message });
      return { ok: false, reason: "failed", message: "The settings could not be saved." };
    }
    invalidateWhatsAppSettingsCache(scope); return { ok: true, settings };
  } catch (error) { console.error("Unable to save WhatsApp settings", error); return { ok: false, reason: "failed", message: "The settings could not be saved." }; }
}
