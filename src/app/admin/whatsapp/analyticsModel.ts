/**
 * Pure model for the WhatsApp analytics page.
 *
 * Everything here is derived from rows already stored by the webhook and the reply
 * routes — no Meta Insights call, no invented figures. Values that cannot be
 * computed are carried as `null` rather than 0, matching `overview.ts`, so the UI
 * can render "—" instead of asserting a zero that may not be true.
 */

export type WhatsAppAnalyticsMessage = {
  direction: "inbound" | "outbound";
  message_timestamp?: string;
  /** Meta's own status string, stored verbatim. Null until a status webhook lands. */
  delivery_status?: string | null;
  conversation_id?: string;
};

/* -------------------------------------------------------------------------- */
/* Range selection                                                            */
/* -------------------------------------------------------------------------- */

export const WHATSAPP_ANALYTICS_RANGES = [7, 30, 90] as const;
export type WhatsAppAnalyticsRange = (typeof WHATSAPP_ANALYTICS_RANGES)[number];
export const WHATSAPP_ANALYTICS_DEFAULT_RANGE: WhatsAppAnalyticsRange = 30;

/**
 * Whitelists the `?days=` parameter before it can reach a query string. Anything
 * unrecognised falls back to the default rather than being interpolated.
 */
export function resolveWhatsAppAnalyticsRange(value: unknown): WhatsAppAnalyticsRange {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return (
    WHATSAPP_ANALYTICS_RANGES.find((range) => range === parsed) || WHATSAPP_ANALYTICS_DEFAULT_RANGE
  );
}

export function describeWhatsAppAnalyticsRange(range: WhatsAppAnalyticsRange) {
  return range === 7 ? "Last 7 days" : range === 90 ? "Last 90 days" : "Last 30 days";
}

/* -------------------------------------------------------------------------- */
/* Delivery funnel                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `queued` is our own label for an outbound row Meta has not acknowledged yet:
 * a null `delivery_status`, or one of our own pre-webhook markers (`accepted`,
 * `queued`, `sending`). The other four are Meta's own vocabulary. `unknown`
 * catches any status Meta adds later, so a new value is surfaced rather than
 * silently dropped — the same degrade-don't-throw rule as `templates.ts`.
 */
export const WHATSAPP_DELIVERY_STATUS_KEYS = [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "unknown",
] as const;
export type WhatsAppDeliveryStatusKey = (typeof WHATSAPP_DELIVERY_STATUS_KEYS)[number];

export function normalizeWhatsAppDeliveryStatus(
  value: string | null | undefined,
): WhatsAppDeliveryStatusKey {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return "queued";
  if (raw === "accepted" || raw === "queued" || raw === "sending") return "queued";
  if (raw === "sent") return "sent";
  if (raw === "delivered") return "delivered";
  if (raw === "read") return "read";
  if (raw === "failed" || raw === "undelivered") return "failed";
  return "unknown";
}

export type WhatsAppDeliveryBreakdown = {
  /** Outbound messages in range. Zero means the rates below are null. */
  total: number;
  counts: Record<WhatsAppDeliveryStatusKey, number>;
  /** Reached the handset: delivered or read. Null when nothing was sent. */
  deliveredRate: number | null;
  readRate: number | null;
  failedRate: number | null;
};

/**
 * Counts outbound messages by their final status. Meta overwrites a message's
 * status as it progresses (sent → delivered → read), so the stored value is the
 * furthest point reached and each message belongs to exactly one bucket.
 */
export function buildWhatsAppDeliveryBreakdown(
  messages: WhatsAppAnalyticsMessage[],
): WhatsAppDeliveryBreakdown {
  const counts = WHATSAPP_DELIVERY_STATUS_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = 0;
      return accumulator;
    },
    {} as Record<WhatsAppDeliveryStatusKey, number>,
  );

  let total = 0;
  for (const message of messages) {
    if (message.direction !== "outbound") continue;
    total += 1;
    counts[normalizeWhatsAppDeliveryStatus(message.delivery_status)] += 1;
  }

  const rate = (part: number) => (total > 0 ? part / total : null);

  return {
    total,
    counts,
    // A read message necessarily reached the device, so it counts as delivered.
    deliveredRate: rate(counts.delivered + counts.read),
    readRate: rate(counts.read),
    failedRate: rate(counts.failed),
  };
}

/* -------------------------------------------------------------------------- */
/* Response time                                                              */
/* -------------------------------------------------------------------------- */

export type WhatsAppResponseTimes = {
  /** How many inbound→outbound pairs were measurable. */
  measured: number;
  medianMs: number | null;
  averageMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
};

/**
 * Measures how long the business took to answer each customer message.
 *
 * Within one conversation, an inbound message opens a wait that the next outbound
 * message closes. Consecutive inbound messages collapse into a single wait — a
 * customer sending three messages in a row is one question, not three — and the
 * clock starts at the first of them, which is when the customer actually began
 * waiting.
 *
 * Only pairs where both timestamps parse and the reply is not earlier than the
 * question are counted, so clock skew in stored rows cannot produce a negative.
 * Median is reported alongside the average because a single overnight reply
 * skews a mean badly on low volume.
 */
export function buildWhatsAppResponseTimes(
  messages: WhatsAppAnalyticsMessage[],
): WhatsAppResponseTimes {
  const byConversation = new Map<string, Array<{ at: number; outbound: boolean }>>();

  for (const message of messages) {
    if (!message.conversation_id || !message.message_timestamp) continue;
    const at = Date.parse(message.message_timestamp);
    if (!Number.isFinite(at)) continue;
    const bucket = byConversation.get(message.conversation_id);
    const entry = { at, outbound: message.direction === "outbound" };
    if (bucket) bucket.push(entry);
    else byConversation.set(message.conversation_id, [entry]);
  }

  const waits: number[] = [];
  for (const entries of byConversation.values()) {
    entries.sort((left, right) => left.at - right.at);
    let openedAt: number | null = null;
    for (const entry of entries) {
      if (!entry.outbound) {
        // First unanswered inbound starts the clock; later ones do not reset it.
        if (openedAt === null) openedAt = entry.at;
        continue;
      }
      if (openedAt === null) continue;
      if (entry.at >= openedAt) waits.push(entry.at - openedAt);
      openedAt = null;
    }
  }

  if (waits.length === 0) {
    return { measured: 0, medianMs: null, averageMs: null, fastestMs: null, slowestMs: null };
  }

  const sorted = [...waits].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);

  return {
    measured: sorted.length,
    medianMs,
    averageMs: Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
    fastestMs: sorted[0],
    slowestMs: sorted[sorted.length - 1],
  };
}

/* -------------------------------------------------------------------------- */
/* Totals                                                                     */
/* -------------------------------------------------------------------------- */

export type WhatsAppAnalyticsTotals = {
  sent: number;
  received: number;
  /** Conversations with at least one message inside the range. */
  activeConversations: number;
};

export function buildWhatsAppAnalyticsTotals(
  messages: WhatsAppAnalyticsMessage[],
): WhatsAppAnalyticsTotals {
  const conversations = new Set<string>();
  let sent = 0;
  let received = 0;

  for (const message of messages) {
    if (message.direction === "outbound") sent += 1;
    else received += 1;
    if (message.conversation_id) conversations.add(message.conversation_id);
  }

  return { sent, received, activeConversations: conversations.size };
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

/** Compact, human duration: "48s", "12m 30s", "3h 5m", "2d 4h". */
export function formatWhatsAppDuration(ms: number | null | undefined) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "—";

  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    const seconds = totalSeconds % 60;
    return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainderMinutes = minutes % 60;
    return remainderMinutes ? `${hours}h ${remainderMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainderHours = hours % 24;
  return remainderHours ? `${days}d ${remainderHours}h` : `${days}d`;
}

/** Whole-percent display. Null (nothing to divide by) renders as "—". */
export function formatWhatsAppRate(rate: number | null | undefined) {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}
