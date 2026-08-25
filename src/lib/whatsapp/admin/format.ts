import type {
  MetricDelta,
  ServiceWindow,
  WhatsAppContact,
  WhatsAppDeliveryStatus,
  WhatsAppMessageType,
} from "@/types/whatsapp";

/**
 * Pure presentation helpers for the WhatsApp platform.
 *
 * Everything here is deterministic and side-effect free so it can run on the
 * server, in a client component, and under `node --test` without a browser or a
 * database. Nothing here reads `process.env` or `Date.now()` implicitly: callers
 * pass the clock in, which is what makes the service-window maths testable.
 */

export const SERVICE_WINDOW_SECONDS = 24 * 60 * 60;

/** Shown wherever a record genuinely has no value. */
export const NO_VALUE = "–";

/* Identity --------------------------------------------------------------- */

/**
 * A WhatsApp id is an E.164 number without the plus. Group it the way people
 * read phone numbers instead of printing 13 undifferentiated digits.
 */
export function formatWaId(waId: string | null | undefined) {
  const digits = (waId || "").replace(/\D/g, "");
  if (!digits) return NO_VALUE;
  if (digits.length <= 6) return `+${digits}`;
  // Country code length varies, so group the trailing digits and leave the
  // leading group as the country/area prefix.
  const tail = digits.slice(-7);
  const middle = digits.slice(-10, -7);
  const head = digits.slice(0, Math.max(0, digits.length - 10));
  return [head && `+${head}`, middle, tail.slice(0, 3), tail.slice(3)]
    .filter(Boolean)
    .join(" ");
}

export function contactDisplayName(contact: Pick<WhatsAppContact, "displayName" | "waId"> | null) {
  if (!contact) return "Unknown contact";
  const name = contact.displayName?.trim();
  return name || formatWaId(contact.waId);
}

/** Up to two letters. Falls back to the last two digits of the number. */
export function contactInitials(contact: Pick<WhatsAppContact, "displayName" | "waId"> | null) {
  const name = contact?.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const digits = (contact?.waId || "").replace(/\D/g, "");
  return digits ? digits.slice(-2) : "?";
}

/* Numbers ---------------------------------------------------------------- */

/** Thousands separated without depending on the runtime locale. */
export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return NO_VALUE;
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded).toString();
  let out = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ",";
    out += digits[i];
  }
  return `${sign}${out}`;
}

export function buildDelta(current: number, previous: number): MetricDelta {
  if (previous === 0) {
    if (current === 0) return { percent: 0, direction: "flat" };
    // Growth from nothing has no meaningful percentage. Say so rather than
    // printing an invented number or Infinity.
    return { percent: null, direction: "up" };
  }
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(percent * 10) / 10;
  return {
    percent: rounded,
    direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
  };
}

export function formatDelta(delta: MetricDelta) {
  if (delta.percent === null) return "New";
  if (delta.percent === 0) return "No change";
  const sign = delta.percent > 0 ? "+" : "";
  return `${sign}${delta.percent}%`;
}

/* Time ------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

export function toDate(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `14:32` in UTC. Deterministic, so a server render and the first client render
 * agree; a client component swaps in the viewer's own timezone after mount.
 */
export function formatUtcTime(value: string | number | null | undefined) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** `24 Aug 2026`. */
export function formatUtcDate(value: string | number | null | undefined) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `24 Aug 2026, 14:32`. */
export function formatUtcDateTime(value: string | number | null | undefined) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  return `${formatUtcDate(value)}, ${formatUtcTime(value)}`;
}

/** ISO date at day precision, used as the chart's x axis key. */
export function toUtcDayKey(value: string | number | Date | null | undefined) {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** `Mon 24`, the compact chart tick. */
export function formatDayTick(dayKey: string) {
  const date = toDate(`${dayKey}T00:00:00Z`);
  if (!date) return dayKey;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/**
 * `now`, `4m`, `3h`, `Tue`, `24 Aug`. Short because it sits in a dense list, and
 * it never says "ago": the column heading already establishes that.
 */
export function formatShortRelative(value: string | number | null | undefined, nowMs: number) {
  const date = toDate(value);
  if (!date) return NO_VALUE;
  const seconds = Math.floor((nowMs - date.getTime()) / 1000);
  if (seconds < 0) return formatUtcTime(value);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;
  return formatUtcDate(value).replace(/ \d{4}$/, "");
}

/* Service window --------------------------------------------------------- */

/**
 * The 24-hour customer service window.
 *
 * Mirrors `isFreeformReplyAllowed` in `src/lib/whatsapp/classify.ts`, which the
 * send path already enforces, so the interface cannot offer a free-text reply
 * the API would reject.
 */
export function computeServiceWindow(
  lastInboundAtSeconds: number | null | undefined,
  nowMs: number
): ServiceWindow {
  if (lastInboundAtSeconds === null || lastInboundAtSeconds === undefined || !Number.isFinite(lastInboundAtSeconds)) {
    return { known: false, open: false, secondsRemaining: null, expiresAt: null };
  }
  const nowSeconds = Math.floor(nowMs / 1000);
  const expiresAtSeconds = lastInboundAtSeconds + SERVICE_WINDOW_SECONDS;
  const remaining = expiresAtSeconds - nowSeconds;
  return {
    known: true,
    // A timestamp in the future means clock skew, not an open window.
    open: nowSeconds >= lastInboundAtSeconds && remaining > 0,
    secondsRemaining: Math.max(0, remaining),
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}

/** `23h 41m`, then `41m`, then `expired`. */
export function formatWindowRemaining(window: ServiceWindow) {
  if (!window.known) return "No inbound message";
  if (!window.open || !window.secondsRemaining) return "Expired";
  const hours = Math.floor(window.secondsRemaining / 3600);
  const minutes = Math.floor((window.secondsRemaining % 3600) / 60);
  if (hours > 0) return `${hours}h ${pad(minutes)}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return "Under a minute left";
}

/** 0 to 1, how much of the window has been used. Drives the countdown rail. */
export function windowElapsedFraction(window: ServiceWindow) {
  if (!window.known || window.secondsRemaining === null) return 1;
  const used = SERVICE_WINDOW_SECONDS - window.secondsRemaining;
  return Math.min(1, Math.max(0, used / SERVICE_WINDOW_SECONDS));
}

/* Message metadata ------------------------------------------------------- */

const DELIVERY_STATUSES: WhatsAppDeliveryStatus[] = ["queued", "sent", "delivered", "read", "failed"];

/** Meta sends lowercase status strings; anything unrecognised becomes null. */
export function normaliseDeliveryStatus(raw: string | null | undefined): WhatsAppDeliveryStatus | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "accepted" || value === "pending") return "queued";
  return (DELIVERY_STATUSES as string[]).includes(value) ? (value as WhatsAppDeliveryStatus) : null;
}

export const DELIVERY_STATUS_LABEL: Record<WhatsAppDeliveryStatus, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};

const MESSAGE_TYPES: WhatsAppMessageType[] = [
  "text",
  "image",
  "audio",
  "video",
  "document",
  "sticker",
  "location",
  "contacts",
  "template",
  "interactive",
];

export function normaliseMessageType(raw: string | null | undefined): WhatsAppMessageType {
  if (!raw) return "text";
  const value = raw.trim().toLowerCase();
  return (MESSAGE_TYPES as string[]).includes(value) ? (value as WhatsAppMessageType) : "unsupported";
}

/**
 * What to show in a one-line preview when a message carries no text of its own.
 * Says what the customer actually sent rather than "message".
 */
export function messagePreview(
  message: { type: WhatsAppMessageType; text: string | null; media?: { voice: boolean } | null } | null
) {
  if (!message) return "No messages yet";
  const text = message.text?.trim();
  if (text) return text.replace(/\s+/g, " ");
  if (message.type === "audio") return message.media?.voice ? "Voice note" : "Audio file";
  if (message.type === "image") return "Photo";
  if (message.type === "video") return "Video";
  if (message.type === "document") return "Document";
  if (message.type === "sticker") return "Sticker";
  if (message.type === "location") return "Location";
  if (message.type === "contacts") return "Shared a contact";
  if (message.type === "template") return "Template message";
  if (message.type === "interactive") return "Button reply";
  return "Unsupported message type";
}

/* Meta account metadata -------------------------------------------------- */

/** `TIER_1K` is Meta's wire format. Administrators read "1,000 a day". */
export function formatMessagingTier(tier: string | null | undefined) {
  if (!tier) return NO_VALUE;
  const value = tier.trim().toUpperCase();
  if (value === "TIER_50") return "50 a day";
  if (value === "TIER_250") return "250 a day";
  if (value === "TIER_1K") return "1,000 a day";
  if (value === "TIER_10K") return "10,000 a day";
  if (value === "TIER_100K") return "100,000 a day";
  if (value === "TIER_UNLIMITED") return "Unlimited";
  return value.replace(/^TIER_/, "").replace(/_/g, " ");
}

export function formatQualityRating(rating: string | null | undefined) {
  if (!rating) return NO_VALUE;
  const value = rating.trim().toUpperCase();
  if (value === "GREEN") return "High";
  if (value === "YELLOW") return "Medium";
  if (value === "RED") return "Low";
  if (value === "NA" || value === "UNKNOWN") return "Not rated yet";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** `PRICING_REQUEST` becomes `Pricing request`. */
export function formatIntent(intent: string | null | undefined) {
  if (!intent) return NO_VALUE;
  const words = intent.trim().toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
