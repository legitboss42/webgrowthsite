/**
 * Server-side load and save for WhatsApp console settings.
 *
 * Two callers with different needs share this module:
 *
 *  - The console reads fresh on every render, so a save is visible immediately.
 *  - The webhook reads on every inbound message, so it reads through a short-lived
 *    in-process cache. Settings change rarely and a stale keyword list for up to a
 *    minute is a far better trade than a database round trip per message on the
 *    receive path.
 *
 * Nothing here throws. A missing table, missing credentials, or an unreachable
 * database all resolve to the documented defaults, because failing to read a
 * preference must never stop a message from being received.
 */

import {
  WHATSAPP_DEFAULT_SETTINGS,
  parseWhatsAppSettings,
  type WhatsAppSettings,
} from "./settings";

const TABLE = "whatsapp_settings";
const ROW_ID = "default";
const DEFAULT_MAX_AGE_MS = 60_000;

export type WhatsAppSettingsSource = "database" | "defaults";

export type WhatsAppSettingsLoadReason =
  | "ok"
  | "unconfigured"
  | "missing-table"
  | "unreachable";

export type WhatsAppSettingsLoad = {
  settings: WhatsAppSettings;
  source: WhatsAppSettingsSource;
  reason: WhatsAppSettingsLoadReason;
};

type LoadOptions = {
  /** 0 forces a fresh read. Defaults to a 60 second in-process cache. */
  maxAgeMs?: number;
  fetch?: typeof globalThis.fetch;
  url?: string;
  serviceRoleKey?: string;
  now?: number;
};

function resolveConfig(options: LoadOptions) {
  const url = (options.url ?? process.env.SUPABASE_URL)?.trim();
  const key = (options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

let cache: { at: number; value: WhatsAppSettingsLoad } | null = null;

/** Called after a successful save so this instance stops serving the old document. */
export function invalidateWhatsAppSettingsCache() {
  cache = null;
}

function withDefaults(reason: WhatsAppSettingsLoadReason): WhatsAppSettingsLoad {
  return { settings: WHATSAPP_DEFAULT_SETTINGS, source: "defaults", reason };
}

export async function loadWhatsAppSettings(options: LoadOptions = {}): Promise<WhatsAppSettingsLoad> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const now = options.now ?? Date.now();
  if (cache && maxAgeMs > 0 && now - cache.at < maxAgeMs) return cache.value;

  const config = resolveConfig(options);
  if (!config) return withDefaults("unconfigured");

  const fetcher = options.fetch || globalThis.fetch;
  let value: WhatsAppSettingsLoad;

  try {
    const response = await fetcher(
      `${config.url}/rest/v1/${TABLE}?select=settings&id=eq.${ROW_ID}&limit=1`,
      {
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      value = withDefaults("missing-table");
    } else if (!response.ok) {
      console.error("WhatsApp settings read failed", { status: response.status });
      value = withDefaults("unreachable");
    } else {
      const rows = (await response.json()) as Array<{ settings?: unknown }>;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      value = row
        ? { settings: parseWhatsAppSettings(row.settings), source: "database", reason: "ok" }
        : // Table exists but the seed row is gone. Defaults are correct, and the
          // next save recreates the row through the upsert.
          { settings: WHATSAPP_DEFAULT_SETTINGS, source: "defaults", reason: "ok" };
    }
  } catch (error) {
    console.error("Unable to read WhatsApp settings", error);
    value = withDefaults("unreachable");
  }

  cache = { at: now, value };
  return value;
}

export type WhatsAppSettingsSaveResult =
  | { ok: true; settings: WhatsAppSettings }
  | { ok: false; reason: "unconfigured" | "missing-table" | "failed"; message: string };

const MISSING_TABLE_MESSAGE =
  "Settings storage has not been created yet. Run the whatsapp_settings migration, then save again.";

export async function saveWhatsAppSettings(
  settings: WhatsAppSettings,
  options: { fetch?: typeof globalThis.fetch; url?: string; serviceRoleKey?: string } = {},
): Promise<WhatsAppSettingsSaveResult> {
  const config = resolveConfig(options);
  if (!config) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "WhatsApp storage is not configured, so settings cannot be saved.",
    };
  }

  const fetcher = options.fetch || globalThis.fetch;

  try {
    const response = await fetcher(`${config.url}/rest/v1/${TABLE}?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: ROW_ID,
        settings,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    if (response.status === 404) {
      return { ok: false, reason: "missing-table", message: MISSING_TABLE_MESSAGE };
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { code?: string; message?: string }
        | null;
      if (payload?.code === "PGRST205" || payload?.code === "42P01") {
        return { ok: false, reason: "missing-table", message: MISSING_TABLE_MESSAGE };
      }
      // Postgres error text names columns and constraints, so it is logged rather
      // than returned to the browser.
      console.error("WhatsApp settings write rejected", {
        status: response.status,
        code: payload?.code,
        message: payload?.message,
      });
      return { ok: false, reason: "failed", message: "The settings could not be saved." };
    }

    invalidateWhatsAppSettingsCache();
    return { ok: true, settings };
  } catch (error) {
    console.error("Unable to save WhatsApp settings", error);
    return { ok: false, reason: "failed", message: "The settings could not be saved." };
  }
}
