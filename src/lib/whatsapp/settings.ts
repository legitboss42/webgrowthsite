/**
 * Operator-editable WhatsApp console settings.
 *
 * Stored as a single jsonb document (see the whatsapp_settings migration) and
 * validated here on the way in and on the way out. A partial, stale, or
 * hand-edited document still produces a complete settings object with every field
 * in range, so no reader downstream has to handle a missing or absurd value.
 *
 * Every default below reproduces the behaviour that was hardcoded before this
 * table existed, which means a fresh install — and a deployment where the
 * migration has not been run — behaves exactly as it did.
 *
 * Pure: no I/O, no environment access. The loader lives in settingsStore.ts.
 */

import type { WhatsAppClassification } from "./types";

export type WhatsAppLeadKeywordRules = {
  /** Forces HOT no matter what the built-in rules decided. */
  hot: string[];
  /** Lifts a COLD message to WARM. Never downgrades a HOT one. */
  warm: string[];
  /** Forces COLD and silences the auto-reply. Beats both lists above. */
  spam: string[];
};

export type WhatsAppBusinessHours = {
  enabled: boolean;
  /** IANA zone name. An unknown zone falls back to UTC rather than throwing. */
  timezone: string;
  /** Days open, 0 = Sunday through 6 = Saturday. */
  days: number[];
  /** "HH:MM", 24-hour. `end` is always later the same day. */
  start: string;
  end: string;
};

export type WhatsAppConsolePreferences = {
  activityWindowDays: number;
  inboxRefreshSeconds: number;
};

export type WhatsAppSettings = {
  leadKeywords: WhatsAppLeadKeywordRules;
  businessHours: WhatsAppBusinessHours;
  /** Minutes. 0 means no target has been set, not a target of zero. */
  targetFirstResponseMinutes: number;
  console: WhatsAppConsolePreferences;
};

export const WHATSAPP_SETTINGS_LIMITS = {
  keywordsPerList: 40,
  keywordMaxLength: 40,
  activityWindowDays: { min: 7, max: 90 },
  inboxRefreshSeconds: { min: 5, max: 300 },
  targetFirstResponseMinutes: { min: 0, max: 1440 },
} as const;

/**
 * The pre-settings behaviour, written down. Changing a value here changes what a
 * deployment does before anyone touches the Settings page, so these stay pinned to
 * what the code did previously: a 14-day activity window and a 10-second inbox
 * refresh, no keyword overrides, no business hours, no response target.
 */
export const WHATSAPP_DEFAULT_SETTINGS: WhatsAppSettings = {
  leadKeywords: { hot: [], warm: [], spam: [] },
  businessHours: {
    enabled: false,
    timezone: "Africa/Johannesburg",
    days: [1, 2, 3, 4, 5],
    start: "08:00",
    end: "17:00",
  },
  targetFirstResponseMinutes: 0,
  console: { activityWindowDays: 14, inboxRefreshSeconds: 10 },
};

export const WHATSAPP_WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WHATSAPP_WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/* -------------------------------------------------------------------------- */
/* Keywords                                                                   */
/* -------------------------------------------------------------------------- */

/** Lowercased, whitespace-collapsed, length-capped. Phrases are allowed. */
export function normalizeWhatsAppKeyword(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WHATSAPP_SETTINGS_LIMITS.keywordMaxLength);
}

/**
 * Accepts an array or a single string. A string splits on commas and newlines, so
 * the textarea in the console and a JSON array from the database both normalise to
 * the same list: unique, non-empty, capped in count.
 */
export function normalizeWhatsAppKeywordList(value: unknown): string[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n\r]+/)
      : [];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const keyword = normalizeWhatsAppKeyword(candidate);
    if (!keyword) continue;
    seen.add(keyword);
    if (seen.size >= WHATSAPP_SETTINGS_LIMITS.keywordsPerList) break;
  }
  return [...seen];
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches on word edges rather than raw substrings, so "art" does not fire inside
 * "start" while a phrase like "how much" still matches. Returns the keyword that
 * matched so the console can explain a classification.
 */
export function matchWhatsAppKeyword(text: string, keywords: string[]): string | null {
  if (!keywords.length) return null;
  const haystack = text.toLowerCase();
  for (const keyword of keywords) {
    if (!keyword) continue;
    const pattern = new RegExp(`(?<![a-z0-9])${escapeForRegExp(keyword)}(?![a-z0-9])`, "i");
    if (pattern.test(haystack)) return keyword;
  }
  return null;
}

export type WhatsAppKeywordOverride = {
  applied: "hot" | "warm" | "spam" | null;
  keyword: string | null;
};

/**
 * Layers the operator's keywords over a built-in classification.
 *
 * The built-in rules stay as the floor: they still decide the intent, and these
 * overrides only move the temperature. That keeps intent detection — and every
 * test that covers it — intact, and means an empty keyword list cannot break
 * classification.
 *
 * Precedence is spam, then hot, then warm. Spam wins outright so that a message
 * cannot escape being silenced by also mentioning a price.
 */
export function applyWhatsAppLeadKeywords(
  classification: WhatsAppClassification,
  text: string,
  rules: WhatsAppLeadKeywordRules,
): WhatsAppClassification & { override: WhatsAppKeywordOverride } {
  const spam = matchWhatsAppKeyword(text, rules.spam);
  if (spam) {
    return {
      ...classification,
      temperature: "COLD",
      humanReviewRequired: false,
      safeReplyKind: "NONE",
      override: { applied: "spam", keyword: spam },
    };
  }

  const hot = matchWhatsAppKeyword(text, rules.hot);
  if (hot) {
    return {
      ...classification,
      temperature: "HOT",
      humanReviewRequired: true,
      // A hot lead gets an acknowledgement, never a canned marketing answer.
      safeReplyKind: "ACKNOWLEDGEMENT",
      override: { applied: "hot", keyword: hot },
    };
  }

  const warm = matchWhatsAppKeyword(text, rules.warm);
  if (warm && classification.temperature === "COLD") {
    return {
      ...classification,
      temperature: "WARM",
      override: { applied: "warm", keyword: warm },
    };
  }

  return { ...classification, override: { applied: null, keyword: null } };
}

/* -------------------------------------------------------------------------- */
/* Business hours                                                             */
/* -------------------------------------------------------------------------- */

/** Minutes since local midnight, or null when the value is not "HH:MM". */
export function parseWhatsAppTimeOfDay(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatWhatsAppTimeOfDay(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const hours = Math.floor(clamped / 60);
  return `${String(hours).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

export function isValidWhatsAppTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Local weekday and minutes-since-midnight in a given zone.
 *
 * Deliberately WhatsApp-local rather than shared with the scheduler's timezone
 * helpers: this is a read-only formatting concern, and the scheduler owns
 * publishing correctness that must not be coupled to console settings.
 */
export function getWhatsAppLocalTimeParts(at: Date, timezone: string) {
  const zone = isValidWhatsAppTimezone(timezone) ? timezone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  const weekday = WHATSAPP_WEEKDAY_SHORT_LABELS.indexOf(
    lookup("weekday") as (typeof WHATSAPP_WEEKDAY_SHORT_LABELS)[number],
  );
  const hour = Number(lookup("hour"));
  const minute = Number(lookup("minute"));

  return {
    zone,
    weekday: weekday >= 0 ? weekday : at.getUTCDay(),
    minutes: Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : 0,
  };
}

/** `null` when business hours are switched off — "unknown", not "closed". */
export function isWhatsAppBusinessHoursOpen(
  hours: WhatsAppBusinessHours,
  at: Date,
): boolean | null {
  if (!hours.enabled) return null;
  const start = parseWhatsAppTimeOfDay(hours.start);
  const end = parseWhatsAppTimeOfDay(hours.end);
  if (start === null || end === null || end <= start) return null;

  const local = getWhatsAppLocalTimeParts(at, hours.timezone);
  if (!hours.days.includes(local.weekday)) return false;
  return local.minutes >= start && local.minutes < end;
}

export function describeWhatsAppBusinessDays(days: number[]): string {
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";

  const sorted = [...days].sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const day of sorted) {
    const current = runs[runs.length - 1];
    if (current && day === current[current.length - 1] + 1) current.push(day);
    else runs.push([day]);
  }

  return runs
    .map((run) =>
      run.length > 1
        ? `${WHATSAPP_WEEKDAY_SHORT_LABELS[run[0]]}–${WHATSAPP_WEEKDAY_SHORT_LABELS[run[run.length - 1]]}`
        : WHATSAPP_WEEKDAY_SHORT_LABELS[run[0]],
    )
    .join(", ");
}

/* -------------------------------------------------------------------------- */
/* Response target                                                            */
/* -------------------------------------------------------------------------- */

export type WhatsAppTargetComparison = {
  status: "met" | "missed" | "unset" | "unknown";
  targetMinutes: number;
  label: string;
};

/**
 * Compares a measured median first response against the operator's target.
 *
 * "unset" and "unknown" are kept apart on purpose: no target configured is a
 * different statement from a target that cannot be judged because there is no
 * data yet.
 */
export function compareWhatsAppResponseToTarget(
  medianSeconds: number | null,
  targetMinutes: number,
): WhatsAppTargetComparison {
  if (targetMinutes <= 0) {
    return { status: "unset", targetMinutes, label: "No target set" };
  }
  if (medianSeconds === null || !Number.isFinite(medianSeconds)) {
    return { status: "unknown", targetMinutes, label: `Target ${targetMinutes}m — not enough data` };
  }
  const met = medianSeconds <= targetMinutes * 60;
  return {
    status: met ? "met" : "missed",
    targetMinutes,
    label: met ? `Within the ${targetMinutes}m target` : `Over the ${targetMinutes}m target`,
  };
}

/* -------------------------------------------------------------------------- */
/* Parsing and validation                                                     */
/* -------------------------------------------------------------------------- */

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeDays(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  const days = [...new Set(value.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  return days.sort((a, b) => a - b);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Reads a stored document into a complete settings object. Never throws and never
 * returns a partial: anything missing, malformed, or out of range falls back to
 * the corresponding default.
 */
export function parseWhatsAppSettings(raw: unknown): WhatsAppSettings {
  const record = asRecord(raw);
  const defaults = WHATSAPP_DEFAULT_SETTINGS;

  const keywords = asRecord(record.leadKeywords);
  const hours = asRecord(record.businessHours);
  const preferences = asRecord(record.console);

  const timezone = typeof hours.timezone === "string" && isValidWhatsAppTimezone(hours.timezone)
    ? hours.timezone
    : defaults.businessHours.timezone;

  const start = parseWhatsAppTimeOfDay(hours.start);
  const end = parseWhatsAppTimeOfDay(hours.end);
  const validWindow = start !== null && end !== null && end > start;

  return {
    leadKeywords: {
      hot: normalizeWhatsAppKeywordList(keywords.hot),
      warm: normalizeWhatsAppKeywordList(keywords.warm),
      spam: normalizeWhatsAppKeywordList(keywords.spam),
    },
    businessHours: {
      enabled: hours.enabled === true,
      timezone,
      days: normalizeDays(hours.days, defaults.businessHours.days),
      start: validWindow ? formatWhatsAppTimeOfDay(start) : defaults.businessHours.start,
      end: validWindow ? formatWhatsAppTimeOfDay(end) : defaults.businessHours.end,
    },
    targetFirstResponseMinutes: clampInteger(
      record.targetFirstResponseMinutes,
      WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.min,
      WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.max,
      defaults.targetFirstResponseMinutes,
    ),
    console: {
      activityWindowDays: clampInteger(
        preferences.activityWindowDays,
        WHATSAPP_SETTINGS_LIMITS.activityWindowDays.min,
        WHATSAPP_SETTINGS_LIMITS.activityWindowDays.max,
        defaults.console.activityWindowDays,
      ),
      inboxRefreshSeconds: clampInteger(
        preferences.inboxRefreshSeconds,
        WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.min,
        WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.max,
        defaults.console.inboxRefreshSeconds,
      ),
    },
  };
}

export type WhatsAppSettingsValidation =
  | { ok: true; value: WhatsAppSettings }
  | { ok: false; error: string };

/**
 * Validates a submission from the console.
 *
 * Unlike `parseWhatsAppSettings`, this rejects rather than silently corrects the
 * mistakes an operator can actually see and fix — an end time before a start time,
 * no days selected, a timezone that does not exist. Everything else is normalised,
 * so a save always stores a document this module can read back.
 */
export function validateWhatsAppSettingsInput(input: unknown): WhatsAppSettingsValidation {
  const record = asRecord(input);
  const hours = asRecord(record.businessHours);
  const enabled = hours.enabled === true;

  if (enabled) {
    if (typeof hours.timezone !== "string" || !isValidWhatsAppTimezone(hours.timezone)) {
      return { ok: false, error: "Choose a timezone that exists, for example Africa/Johannesburg." };
    }
    const start = parseWhatsAppTimeOfDay(hours.start);
    const end = parseWhatsAppTimeOfDay(hours.end);
    if (start === null || end === null) {
      return { ok: false, error: "Opening and closing times must be in 24-hour HH:MM form." };
    }
    if (end <= start) {
      return { ok: false, error: "Closing time must be later than opening time on the same day." };
    }
    if (normalizeDays(hours.days, []).length === 0) {
      return { ok: false, error: "Pick at least one day, or switch business hours off." };
    }
  }

  const target = record.targetFirstResponseMinutes;
  if (target !== undefined && target !== null && target !== "") {
    const parsed = Number(target);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: "The response target must be a number of minutes, or 0 for none." };
    }
    if (parsed > WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.max) {
      return { ok: false, error: "The response target cannot be longer than 24 hours." };
    }
  }

  return { ok: true, value: parseWhatsAppSettings(record) };
}

/** Counts what an operator has actually configured, for the console summary. */
export function summarizeWhatsAppSettings(settings: WhatsAppSettings) {
  const keywordCount =
    settings.leadKeywords.hot.length +
    settings.leadKeywords.warm.length +
    settings.leadKeywords.spam.length;

  return {
    keywordCount,
    businessHoursEnabled: settings.businessHours.enabled,
    targetSet: settings.targetFirstResponseMinutes > 0,
    changedFromDefaults:
      keywordCount > 0 ||
      settings.businessHours.enabled ||
      settings.targetFirstResponseMinutes > 0 ||
      settings.console.activityWindowDays !== WHATSAPP_DEFAULT_SETTINGS.console.activityWindowDays ||
      settings.console.inboxRefreshSeconds !== WHATSAPP_DEFAULT_SETTINGS.console.inboxRefreshSeconds,
  };
}
