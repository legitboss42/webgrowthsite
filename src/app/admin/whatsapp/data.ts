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
