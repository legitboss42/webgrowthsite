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

function getConfig(env: Record<string, string | undefined>) {
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  return token && phoneNumberId ? { token, phoneNumberId, apiVersion } : null;
}

export async function fetchWhatsAppCallingSettings(
  options: { env?: Record<string, string | undefined>; fetch?: typeof globalThis.fetch } = {},
): Promise<CallingResult> {
  const config = getConfig(options.env || process.env);
  if (!config) return { ok: false, reason: "NOT_CONFIGURED" };

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/settings?fields=calling`,
      { headers: { Authorization: `Bearer ${config.token}` }, cache: "no-store" },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "PERMISSION_DENIED", detail: detail.slice(0, 300) };
      }
      return { ok: false, reason: "API_ERROR", detail: detail.slice(0, 300) };
    }
    const payload = (await response.json().catch(() => null)) as { calling?: WhatsAppCallingSettings } | null;
    return { ok: true, settings: payload?.calling || {} };
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
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "PERMISSION_DENIED", detail: detail.slice(0, 300) };
      }
      return { ok: false, reason: "API_ERROR", detail: detail.slice(0, 300) };
    }

    return fetchWhatsAppCallingSettings(options);
  } catch (error) {
    return { ok: false, reason: "API_ERROR", detail: error instanceof Error ? error.message : "Request failed" };
  }
}
