export const WHATSAPP_REALTIME_EVENT = "webgrowth:whatsapp-realtime";

export const WHATSAPP_PRESENCE_FALLBACK_MS = 120_000;
export const WHATSAPP_CALL_FALLBACK_MS = 30_000;
export const WHATSAPP_COLLABORATION_FALLBACK_MS = 60_000;
export const WHATSAPP_COLLABORATION_HEARTBEAT_MS = 30_000;
export const WHATSAPP_COLLABORATION_STALE_MS = 90_000;
export const WHATSAPP_SERVICE_WINDOW_TICK_MS = 60_000;

export type WhatsAppRealtimeInvalidation = {
  scope?: string;
  operation?: string;
};

export function getWhatsAppInboxFallbackMs(refreshSeconds: number | null | undefined) {
  const seconds = Number.isFinite(refreshSeconds) ? Number(refreshSeconds) : 10;
  const clampedSeconds = Math.max(5, Math.min(300, Math.round(seconds)));
  return Math.max(60_000, clampedSeconds * 1_000);
}

export function matchesWhatsAppRealtimeScope(
  detail: WhatsAppRealtimeInvalidation | null | undefined,
  scopes: readonly string[],
) {
  return typeof detail?.scope === "string" && scopes.includes(detail.scope);
}
