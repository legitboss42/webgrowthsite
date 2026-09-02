export type WhatsAppAnalyticsPeriod = "current" | "previous" | "outside";

export function classifyWhatsAppAnalyticsPeriod(
  value: string | null | undefined,
  currentStartMs: number,
  previousStartMs: number,
  nowMs: number,
): WhatsAppAnalyticsPeriod {
  if (!value) return "outside";
  const at = Date.parse(value);
  if (!Number.isFinite(at) || at > nowMs || at < previousStartMs) return "outside";
  return at >= currentStartMs ? "current" : "previous";
}

export function safeWhatsAppAnalyticsRate(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return null;
  return part / total;
}

export type WhatsAppAnalyticsTrend = {
  direction: "up" | "down" | "flat" | "unavailable";
  delta: number | null;
  percent: number | null;
  favorable: boolean | null;
};

export function buildWhatsAppAnalyticsTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  options: { lowerIsBetter?: boolean } = {},
): WhatsAppAnalyticsTrend {
  if (
    typeof current !== "number" ||
    typeof previous !== "number" ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  ) {
    return { direction: "unavailable", delta: null, percent: null, favorable: null };
  }

  const delta = current - previous;
  const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const percent = previous === 0 ? null : delta / Math.abs(previous);
  const favorable = delta === 0 ? null : options.lowerIsBetter ? delta < 0 : delta > 0;
  return { direction, delta, percent, favorable };
}

export type WhatsAppDurationSummary = {
  count: number;
  averageMs: number | null;
  medianMs: number | null;
  fastestMs: number | null;
  slowestMs: number | null;
};

export function summarizeWhatsAppDurations(values: Array<number | null | undefined>): WhatsAppDurationSummary {
  const durations = values
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0)
    .sort((left, right) => left - right);
  if (!durations.length) {
    return { count: 0, averageMs: null, medianMs: null, fastestMs: null, slowestMs: null };
  }
  const middle = Math.floor(durations.length / 2);
  const medianMs = durations.length % 2
    ? durations[middle]
    : Math.round((durations[middle - 1] + durations[middle]) / 2);
  return {
    count: durations.length,
    averageMs: Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    medianMs,
    fastestMs: durations[0],
    slowestMs: durations[durations.length - 1],
  };
}

export function countWhatsAppAnalyticsStatuses<T extends string>(
  values: string[],
  allowed: readonly T[],
): Record<T, number> {
  const counts = Object.fromEntries(allowed.map((key) => [key, 0])) as Record<T, number>;
  for (const value of values) {
    const normalized = value.toUpperCase() as T;
    if (Object.prototype.hasOwnProperty.call(counts, normalized)) counts[normalized] += 1;
  }
  return counts;
}

export function topWhatsAppAnalyticsEntries(
  values: Array<string | null | undefined>,
  limit = 8,
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = typeof raw === "string" ? raw.trim() : "";
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, Math.max(1, limit));
}

export function formatWhatsAppAnalyticsPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}
