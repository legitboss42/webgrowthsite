import type { WhatsAppLeadRow } from "./dashboard";

/**
 * Pure model for the WhatsApp console overview.
 *
 * Every value here is derived from stored rows or real configuration. Counts that
 * could not be read are carried as `null` rather than 0 so the UI can render "—"
 * instead of asserting a zero that may not be true.
 */
export type WhatsAppActivityMessage = {
  direction: "inbound" | "outbound";
  message_timestamp?: string;
};

export type WhatsAppActivityPoint = {
  key: string;
  label: string;
  sent: number;
  received: number;
};

export type WhatsAppOverviewMetrics = {
  connectedNumbers: number;
  conversations: number;
  contacts: number | null;
  messagesSent: number | null;
  messagesReceived: number | null;
  hotLeads: number;
  warmLeads: number;
  needsReview: number;
  openConversations: number;
  lastActivityAt?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toUtcDayKey(timestampMs: number) {
  const date = new Date(timestampMs);
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function toDayLabel(timestampMs: number) {
  const date = new Date(timestampMs);
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Buckets messages into one point per UTC day, oldest first, always returning
 * exactly `days` points so the chart keeps a stable width even with sparse data.
 */
export function buildWhatsAppActivitySeries(input: {
  messages: WhatsAppActivityMessage[];
  days: number;
  now: number;
}): WhatsAppActivityPoint[] {
  const days = Math.max(1, Math.floor(input.days));
  const todayStart = Math.floor(input.now / DAY_MS) * DAY_MS;
  const points: WhatsAppActivityPoint[] = [];
  const index = new Map<string, WhatsAppActivityPoint>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = todayStart - offset * DAY_MS;
    const point: WhatsAppActivityPoint = {
      key: toUtcDayKey(dayStart),
      label: toDayLabel(dayStart),
      sent: 0,
      received: 0,
    };
    points.push(point);
    index.set(point.key, point);
  }

  for (const message of input.messages) {
    if (!message.message_timestamp) continue;
    const parsed = Date.parse(message.message_timestamp);
    if (!Number.isFinite(parsed)) continue;
    const point = index.get(toUtcDayKey(parsed));
    if (!point) continue;
    if (message.direction === "outbound") point.sent += 1;
    else point.received += 1;
  }

  return points;
}

export type WhatsAppChartGeometry = {
  line: string;
  area: string;
  last: { x: number; y: number } | null;
};

/**
 * Hand-rolled SVG geometry for a small line/area chart — no charting dependency.
 * `max` is shared across series by the caller so both lines use one scale.
 */
export function buildWhatsAppChartGeometry(
  values: number[],
  options: { width: number; height: number; max: number },
): WhatsAppChartGeometry {
  if (values.length === 0) return { line: "", area: "", last: null };

  const { width, height } = options;
  // A flat zero series should sit on the baseline rather than divide by zero.
  const max = options.max > 0 ? options.max : 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((value, position) => ({
    x: values.length > 1 ? position * step : width / 2,
    y: height - (Math.max(0, value) / max) * height,
  }));

  const line = points
    .map((point, position) => `${position === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(2)},${height} L${first.x.toFixed(2)},${height} Z`;

  return { line, area, last };
}

export function getWhatsAppActivityMax(points: WhatsAppActivityPoint[]) {
  return points.reduce((max, point) => Math.max(max, point.sent, point.received), 0);
}

export function buildWhatsAppOverviewMetrics(input: {
  leads: WhatsAppLeadRow[];
  contacts: number | null;
  messagesSent: number | null;
  messagesReceived: number | null;
  senderConnected: boolean;
}): WhatsAppOverviewMetrics {
  const lastActivityAt = input.leads
    .map((lead) => lead.last_message_at)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

  return {
    // Exactly one sender can be configured through the current env contract.
    connectedNumbers: input.senderConnected ? 1 : 0,
    conversations: input.leads.length,
    contacts: input.contacts,
    messagesSent: input.messagesSent,
    messagesReceived: input.messagesReceived,
    hotLeads: input.leads.filter((lead) => lead.lead_temperature === "HOT").length,
    warmLeads: input.leads.filter((lead) => lead.lead_temperature === "WARM").length,
    needsReview: input.leads.filter((lead) => lead.human_review_required).length,
    openConversations: input.leads.filter((lead) => lead.status === "open").length,
    lastActivityAt,
  };
}

/** Renders a count for display, distinguishing "unavailable" from a real zero. */
export function formatWhatsAppMetric(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "—";
}
