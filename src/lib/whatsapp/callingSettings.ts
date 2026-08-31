export type WhatsAppCallingSettings = {
  status?: "ENABLED" | "DISABLED" | string;
  call_icon_visibility?: "DEFAULT" | "DISABLE_ALL" | string;
  callback_permission_status?: "ENABLED" | "DISABLED" | string;
  call_hours?: {
    status?: "ENABLED" | "DISABLED" | string;
    timezone_id?: string;
    weekly_operating_hours?: Array<{
      day_of_week: string;
      open_time: string;
      close_time: string;
    }>;
    holiday_schedule?: Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;
  };
  audio?: { additional_codecs?: string[] };
};

type CallingResult =
  | { ok: true; settings: WhatsAppCallingSettings }
  | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR"; detail?: string };

type MetaGraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

function getConfig(env: Record<string, string | undefined>) {
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  return token && phoneNumberId ? { token, phoneNumberId, apiVersion } : null;
}

function extractCallingSettings(payload: unknown): WhatsAppCallingSettings | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  if (record.calling && typeof record.calling === "object" && !Array.isArray(record.calling)) {
    return record.calling as WhatsAppCallingSettings;
  }
  if (Array.isArray(record.data)) {
    for (const item of record.data) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const calling = (item as Record<string, unknown>).calling;
      if (calling && typeof calling === "object" && !Array.isArray(calling)) {
        return calling as WhatsAppCallingSettings;
      }
    }
  }
  return null;
}

async function classifyMetaFailure(response: Response): Promise<Exclude<CallingResult, { ok: true }>> {
  const raw = await response.text().catch(() => "");
  let parsed: MetaGraphError | null = null;
  try {
    parsed = raw ? (JSON.parse(raw) as MetaGraphError) : null;
  } catch {
    parsed = null;
  }

  const graphError = parsed?.error;
  const message = (graphError?.message || "").trim();
  const type = (graphError?.type || "").trim();
  const code = graphError?.code;
  const subcode = graphError?.error_subcode;
  const haystack = `${message} ${type}`.toLowerCase();

  const permissionDenied =
    response.status === 401 ||
    response.status === 403 ||
    code === 10 ||
    code === 190 ||
    code === 200 ||
    haystack.includes("permission") ||
    haystack.includes("oauth") ||
    haystack.includes("access token");

  const parts: string[] = [];
  if (message) parts.push(message.slice(0, 220));
  if (typeof code === "number") parts.push(`Meta code ${code}${typeof subcode === "number" ? `/${subcode}` : ""}`);
  if (!parts.length) parts.push(`Meta returned HTTP ${response.status}`);

  return {
    ok: false,
    reason: permissionDenied ? "PERMISSION_DENIED" : "API_ERROR",
    detail: parts.join(" · ").slice(0, 300),
  };
}

async function readCallingSettings(
  url: string,
  token: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<CallingResult> {
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return classifyMetaFailure(response);

  const payload = (await response.json().catch(() => null)) as unknown;
  const calling = extractCallingSettings(payload);
  if (calling) return { ok: true, settings: calling };

  return {
    ok: false,
    reason: "API_ERROR",
    detail: "Meta returned phone-number settings but no calling configuration was present.",
  };
}

export async function fetchWhatsAppCallingSettings(
  options: { env?: Record<string, string | undefined>; fetch?: typeof globalThis.fetch } = {},
): Promise<CallingResult> {
  const config = getConfig(options.env || process.env);
  if (!config) return { ok: false, reason: "NOT_CONFIGURED" };

  const fetchImpl = options.fetch || globalThis.fetch;
  const base = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/settings`;

  try {
    const scoped = await readCallingSettings(`${base}?fields=calling`, config.token, fetchImpl);
    if (scoped.ok || scoped.reason === "PERMISSION_DENIED") return scoped;

    // Meta has changed the exact settings response shape across Graph API versions.
    // A plain /settings read is an official form too, so use it as a compatibility
    // fallback when the field-scoped request is rejected or returns no calling block.
    const fallback = await readCallingSettings(base, config.token, fetchImpl);
    if (fallback.ok) return fallback;

    // Keep the more useful of the two provider errors. The fallback usually contains
    // the current-version reason when a field expansion itself was the problem.
    return fallback.detail ? fallback : scoped;
  } catch (error) {
    return { ok: false, reason: "API_ERROR", detail: error instanceof Error ? error.message : "Request failed" };
  }
}

export async function updateWhatsAppCallingSettings(
  update: Partial<WhatsAppCallingSettings>,
  options: { env?: Record<string, string | undefined>; fetch?: typeof globalThis.fetch } = {},
): Promise<CallingResult> {
  const config = getConfig(options.env || process.env);
  if (!config) return { ok: false, reason: "NOT_CONFIGURED" };

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/settings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", calling: update }),
        cache: "no-store",
      },
    );
    if (!response.ok) return classifyMetaFailure(response);

    return fetchWhatsAppCallingSettings(options);
  } catch (error) {
    return { ok: false, reason: "API_ERROR", detail: error instanceof Error ? error.message : "Request failed" };
  }
}
