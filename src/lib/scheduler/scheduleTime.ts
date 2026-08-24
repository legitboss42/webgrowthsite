type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function parseLocalDateTime(value: string): LocalDateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) return null;
  const parts: LocalDateTimeParts = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]),
    second: Number(match[6] ?? 0), millisecond: Number((match[7] ?? "").padEnd(3, "0") || 0),
  };
  const candidate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond));
  if (candidate.getUTCFullYear() !== parts.year || candidate.getUTCMonth() !== parts.month - 1 || candidate.getUTCDate() !== parts.day
    || candidate.getUTCHours() !== parts.hour || candidate.getUTCMinutes() !== parts.minute || candidate.getUTCSeconds() !== parts.second) return null;
  return parts;
}

function partsInTimezone(instantMs: number, timezone: string): LocalDateTimeParts {
  const values = new Map(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instantMs)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(values.get("year")), month: Number(values.get("month")), day: Number(values.get("day")),
    hour: Number(values.get("hour")), minute: Number(values.get("minute")), second: Number(values.get("second")), millisecond: 0,
  };
}

function equalLocalParts(left: LocalDateTimeParts, right: LocalDateTimeParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour
    && left.minute === right.minute && left.second === right.second;
}

function timezoneOffsetAt(instantMs: number, timezone: string): number {
  const roundedInstant = instantMs - (instantMs % 1_000);
  const local = partsInTimezone(roundedInstant, timezone);
  return Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) - roundedInstant;
}

function plausibleTimezoneOffsets(localAsUtc: number, timezone: string): number[] {
  const offsets = new Set<number>();
  // Sample either side of the local date so both sides of nearby DST changes
  // are candidate offsets. Candidates are always round-tripped below.
  for (let hours = -72; hours <= 72; hours += 6) {
    offsets.add(timezoneOffsetAt(localAsUtc + hours * 60 * 60 * 1_000, timezone));
  }
  return [...offsets];
}

export function toScheduleInstantInTimezone(localDateTime: string, timezone: string) {
  if (!isValidTimezone(timezone)) return { ok: false as const, error: "Timezone is invalid." };
  const local = parseLocalDateTime(localDateTime);
  if (!local) return { ok: false as const, error: "Choose a valid local time in your timezone." };

  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second, local.millisecond);
  const candidates = plausibleTimezoneOffsets(localAsUtc, timezone)
    .map((offset) => localAsUtc - offset)
    .filter((instantMs) => equalLocalParts(partsInTimezone(instantMs, timezone), local));
  if (candidates.length === 0) return { ok: false as const, error: "Choose a valid local time in your timezone." };
  if (candidates.length > 1) {
    return { ok: false as const, error: "Choose a different local time because this time occurs twice in your timezone." };
  }
  return { ok: true as const, scheduledForIso: new Date(candidates[0]).toISOString() };
}

export function parseOffsetScheduleInstant(input: { scheduledFor: unknown; localTime: unknown; timezone: unknown; nowIso: string }) {
  const timezone = typeof input.timezone === "string" ? input.timezone : "";
  const scheduledFor = typeof input.scheduledFor === "string" ? input.scheduledFor : "";
  if (!scheduledFor || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(scheduledFor)) {
    return { ok: false as const, status: 400, error: "Choose a future time and timezone." };
  }
  const expected = toScheduleInstantInTimezone(typeof input.localTime === "string" ? input.localTime : "", timezone);
  if (!expected.ok) return { ok: false as const, status: 400, error: expected.error };
  const instantMs = Date.parse(scheduledFor);
  const nowMs = Date.parse(input.nowIso);
  if (!Number.isFinite(instantMs) || !Number.isFinite(nowMs)) {
    return { ok: false as const, status: 400, error: "Choose a future time and timezone." };
  }
  if (new Date(instantMs).toISOString() !== expected.scheduledForIso) {
    return { ok: false as const, status: 400, error: "Scheduled time does not match the selected timezone." };
  }
  if (instantMs <= nowMs) return { ok: false as const, status: 400, error: "Choose a future time and timezone." };
  return { ok: true as const, scheduledForIso: expected.scheduledForIso, timezone };
}
