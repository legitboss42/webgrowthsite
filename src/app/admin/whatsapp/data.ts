/**
 * Server-only Supabase REST access for the WhatsApp console.
 *
 * Stage 11 makes this the central tenant boundary for ordinary admin reads/writes.
 * Tenant-owned tables are automatically constrained by the active workspace cookie,
 * or by an explicit workspaceId for webhook/background jobs. Callers can opt out only
 * for platform-control-plane work such as workspace administration.
 */

import {
  applyWhatsAppWorkspaceToBody,
  getWhatsAppRestTable,
  isWhatsAppWorkspaceId,
  scopeWhatsAppRestPath,
  WHATSAPP_TENANT_TABLES,
} from "@/lib/whatsapp/workspaceModel";
import {
  getDefaultWhatsAppWorkspace,
  readRequestedWhatsAppWorkspaceIdFromRequest,
} from "@/lib/whatsapp/workspaces";

export function getWhatsAppSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

type WorkspaceDataOptions = {
  workspaceId?: string | null;
  /** Platform-control-plane escape hatch. Never use this for client-facing data. */
  unscoped?: boolean;
};

async function resolveDataWorkspaceId(options: WorkspaceDataOptions = {}) {
  if (options.unscoped) return null;
  if (isWhatsAppWorkspaceId(options.workspaceId)) return options.workspaceId;
  const requested = await readRequestedWhatsAppWorkspaceIdFromRequest();
  if (requested) return requested;
  return (await getDefaultWhatsAppWorkspace())?.id || null;
}

export async function readWhatsAppRows<T>(pathAndQuery: string, options: WorkspaceDataOptions = {}): Promise<T[] | null> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return null;
  const workspaceId = await resolveDataWorkspaceId(options);
  const scopedPath = options.unscoped ? pathAndQuery : scopeWhatsAppRestPath(pathAndQuery, workspaceId);

  try {
    const response = await fetch(`${config.url}/rest/v1/${scopedPath}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`WhatsApp admin fetch failed: ${response.status}`);
    return (await response.json()) as T[];
  } catch (error) {
    console.error("Unable to read WhatsApp rows", error);
    return null;
  }
}

/** Exact row count via PostgREST's Content-Range header. */
export async function countWhatsAppRows(pathAndQuery: string, options: WorkspaceDataOptions = {}): Promise<number | null> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return null;
  const workspaceId = await resolveDataWorkspaceId(options);
  const scopedPath = options.unscoped ? pathAndQuery : scopeWhatsAppRestPath(pathAndQuery, workspaceId);

  try {
    const response = await fetch(`${config.url}/rest/v1/${scopedPath}`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`WhatsApp admin count failed: ${response.status}`);
    return parseWhatsAppContentRangeTotal(response.headers.get("content-range"));
  } catch (error) {
    console.error("Unable to count WhatsApp rows", error);
    return null;
  }
}

export function parseWhatsAppContentRangeTotal(value: string | null | undefined) {
  if (!value) return null;
  const total = value.split("/")[1];
  if (!total || total === "*") return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

export type WhatsAppTableProbe = "ok" | "missing" | "unreachable" | "unconfigured";

/** Schema diagnostics are intentionally unscoped; they only test table existence. */
export async function probeWhatsAppTable(table: string): Promise<WhatsAppTableProbe> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return "unconfigured";

  try {
    const response = await fetch(
      `${config.url}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`,
      {
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, Range: "0-0" },
        cache: "no-store",
      },
    );
    if (response.ok) return "ok";
    if (response.status === 404) return "missing";

    const payload = (await response.json().catch(() => null)) as { code?: string } | null;
    if (payload?.code === "PGRST205" || payload?.code === "42P01") return "missing";

    console.error("WhatsApp table probe failed", { table, status: response.status });
    return "unreachable";
  } catch (error) {
    console.error("Unable to probe WhatsApp table", table, error);
    return "unreachable";
  }
}

export type WhatsAppMutationResult =
  | { ok: true; rows: Array<Record<string, unknown>> }
  | { ok: false; status: number; code?: string; message: string };

/**
 * Service-role write against PostgREST. The server owns workspace_id: a browser body
 * can never move a row into another tenant because this function overwrites it.
 */
export async function mutateWhatsAppRest(input: {
  method: "POST" | "PATCH" | "DELETE";
  pathAndQuery: string;
  body?: unknown;
  workspaceId?: string | null;
  unscoped?: boolean;
}): Promise<WhatsAppMutationResult> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return { ok: false, status: 503, message: "WhatsApp storage is not configured." };

  const workspaceId = await resolveDataWorkspaceId({ workspaceId: input.workspaceId, unscoped: input.unscoped });
  const table = getWhatsAppRestTable(input.pathAndQuery);
  const tenantOwned = WHATSAPP_TENANT_TABLES.has(table) && !input.unscoped;
  const scopedPath = tenantOwned ? scopeWhatsAppRestPath(input.pathAndQuery, workspaceId) : input.pathAndQuery;
  const scopedBody = tenantOwned ? applyWhatsAppWorkspaceToBody(input.body, workspaceId) : input.body;

  try {
    const response = await fetch(`${config.url}/rest/v1/${scopedPath}`, {
      method: input.method,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: scopedBody === undefined ? undefined : JSON.stringify(scopedBody),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const error = (payload || {}) as { code?: string; message?: string };
      console.error("WhatsApp write rejected", { status: response.status, code: error.code, message: error.message });
      return { ok: false, status: response.status, code: typeof error.code === "string" ? error.code : undefined, message: "The change could not be saved." };
    }
    return { ok: true, rows: Array.isArray(payload) ? payload as Array<Record<string, unknown>> : [] };
  } catch (error) {
    console.error("Unable to write WhatsApp rows", error);
    return { ok: false, status: 502, message: "The change could not be saved." };
  }
}

export const POSTGRES_UNIQUE_VIOLATION = "23505";

/** Legacy env-only snapshot retained for non-tenant diagnostics. */
export function getWhatsAppSenderConfig() {
  const env = process.env;
  return {
    senderConnected: Boolean(env.WHATSAPP_ACCESS_TOKEN?.trim() && env.WHATSAPP_PHONE_NUMBER_ID?.trim()),
    webhookVerifyConfigured: Boolean(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || env.WHATSAPP_VERIFY_TOKEN?.trim()),
    appSecretConfigured: Boolean(env.META_APP_SECRET?.trim()),
    graphApiVersion: env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0",
  };
}
