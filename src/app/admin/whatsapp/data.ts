/**
 * Server-only Supabase REST access for the WhatsApp console.
 *
 * Reads go through PostgREST with the service-role key, exactly as the rest of the
 * WhatsApp feature does — there is no browser database client and RLS carries no
 * policies, so every read must stay on the server.
 *
 * Count helpers return `null` (not 0) when Supabase is unreachable or unconfigured,
 * so the UI can show "—" instead of claiming a real zero.
 */

export function getWhatsAppSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export async function readWhatsAppRows<T>(pathAndQuery: string): Promise<T[] | null> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/${pathAndQuery}`, {
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
export async function countWhatsAppRows(pathAndQuery: string): Promise<number | null> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/${pathAndQuery}`, {
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

/** Parses the total out of a `0-24/1234` style Content-Range value. */
export function parseWhatsAppContentRangeTotal(value: string | null | undefined) {
  if (!value) return null;
  const total = value.split("/")[1];
  if (!total || total === "*") return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

export type WhatsAppTableProbe = "ok" | "missing" | "unreachable" | "unconfigured";

/**
 * Reports whether a table exists, so Settings can tell "the migration has not been
 * applied" apart from "the database is unreachable". `readWhatsAppRows` collapses
 * both into `null`, which is right for a page rendering data but useless for a page
 * diagnosing configuration.
 *
 * PostgREST answers an unknown table with 404 and a `PGRST205` (formerly `42P01`)
 * code, so a 404 is read as a missing table rather than a transport failure.
 */
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
 * Service-role write against PostgREST. Callers are responsible for having already
 * checked admin access and request origin.
 */
export async function mutateWhatsAppRest(input: {
  method: "POST" | "PATCH" | "DELETE";
  pathAndQuery: string;
  body?: unknown;
}): Promise<WhatsAppMutationResult> {
  const config = getWhatsAppSupabaseConfig();
  if (!config) {
    return { ok: false, status: 503, message: "WhatsApp storage is not configured." };
  }

  try {
    const response = await fetch(`${config.url}/rest/v1/${input.pathAndQuery}`, {
      method: input.method,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      const error = (payload || {}) as { code?: string; message?: string };
      console.error("WhatsApp write rejected", {
        status: response.status,
        code: error.code,
        message: error.message,
      });
      return {
        ok: false,
        status: response.status,
        code: typeof error.code === "string" ? error.code : undefined,
        // Postgres error text can name columns and constraints, so it is logged
        // rather than returned to the browser.
        message: "The change could not be saved.",
      };
    }

    return { ok: true, rows: Array.isArray(payload) ? (payload as Array<Record<string, unknown>>) : [] };
  } catch (error) {
    console.error("Unable to write WhatsApp rows", error);
    return { ok: false, status: 502, message: "The change could not be saved." };
  }
}

/** Postgres unique-violation code, used to report duplicate shortcuts clearly. */
export const POSTGRES_UNIQUE_VIOLATION = "23505";


export function getWhatsAppSenderConfig() {
  const env = process.env;
  return {
    senderConnected: Boolean(env.WHATSAPP_ACCESS_TOKEN?.trim() && env.WHATSAPP_PHONE_NUMBER_ID?.trim()),
    webhookVerifyConfigured: Boolean(
      env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || env.WHATSAPP_VERIFY_TOKEN?.trim(),
    ),
    appSecretConfigured: Boolean(env.META_APP_SECRET?.trim()),
    graphApiVersion:
      env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0",
  };
}
