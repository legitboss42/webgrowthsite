import { createWhatsAppTtlCache } from "./ttlCache";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

type Config = { url: string; key: string };
const secretCache = createWhatsAppTtlCache<string, string>({ ttlMs: 300_000 });
const workspacesCache = createWhatsAppTtlCache<string, string[]>({ ttlMs: 60_000 });

function config(): Config | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}
async function readRows(path: string) {
  const value = config();
  if (!value) throw new Error("Supabase is not configured.");
  const response = await fetch(`${value.url}/rest/v1/${path}`, {
    headers: { apikey: value.key, Authorization: `Bearer ${value.key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Processor configuration read failed: ${response.status}`);
  return await response.json() as Array<Record<string, unknown>>;
}

export async function getCachedWhatsAppProcessorSecret() {
  try {
    return await secretCache.get("default", async () => {
      const rows = await readRows("whatsapp_automation_runtime_config?id=eq.default&select=processor_secret&limit=1");
      return typeof rows[0]?.processor_secret === "string" ? rows[0].processor_secret.trim() : "";
    });
  } catch { return ""; }
}

export async function getCachedActiveWhatsAppWorkspaceIds() {
  try {
    return await workspacesCache.get("active", async () => {
      const rows = await readRows("whatsapp_workspaces?status=eq.ACTIVE&select=id&order=created_at.asc");
      return rows.map((row) => String(row.id || "")).filter(isWhatsAppWorkspaceId);
    });
  } catch { return []; }
}

export function clearWhatsAppProcessorConfigCache() {
  secretCache.clear();
  workspacesCache.clear();
}
