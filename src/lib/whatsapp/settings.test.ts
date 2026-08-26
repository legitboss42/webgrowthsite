import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_DEFAULT_SETTINGS,
  WHATSAPP_SETTINGS_LIMITS,
  applyWhatsAppLeadKeywords,
  compareWhatsAppResponseToTarget,
  describeWhatsAppBusinessDays,
  formatWhatsAppTimeOfDay,
  getWhatsAppLocalTimeParts,
  isWhatsAppBusinessHoursOpen,
  matchWhatsAppKeyword,
  normalizeWhatsAppKeyword,
  normalizeWhatsAppKeywordList,
  parseWhatsAppSettings,
  parseWhatsAppTimeOfDay,
  summarizeWhatsAppSettings,
  validateWhatsAppSettingsInput,
} from "./settings";
import type { WhatsAppClassification } from "./types";

const COLD: WhatsAppClassification = {
  intent: "OTHER",
  temperature: "COLD",
  humanReviewRequired: false,
  safeReplyKind: "NONE",
};

const WARM_SERVICE: WhatsAppClassification = {
  intent: "SERVICE_QUESTION",
  temperature: "WARM",
  humanReviewRequired: false,
  safeReplyKind: "SERVICE",
};

const HOT_PRICING: WhatsAppClassification = {
  intent: "PRICING_REQUEST",
  temperature: "HOT",
  humanReviewRequired: true,
  safeReplyKind: "ACKNOWLEDGEMENT",
};

const NO_RULES = { hot: [], warm: [], spam: [] };

/* Defaults ----------------------------------------------------------------- */

test("defaults reproduce the behaviour that was hardcoded before settings existed", () => {
  // These two numbers were WHATSAPP_INBOX_REFRESH_INTERVAL_MS and ACTIVITY_DAYS.
  // If either default changes, every deployment changes behaviour without anyone
  // touching the Settings page.
  assert.equal(WHATSAPP_DEFAULT_SETTINGS.console.activityWindowDays, 14);
  assert.equal(WHATSAPP_DEFAULT_SETTINGS.console.inboxRefreshSeconds, 10);
  assert.equal(WHATSAPP_DEFAULT_SETTINGS.targetFirstResponseMinutes, 0);
  assert.equal(WHATSAPP_DEFAULT_SETTINGS.businessHours.enabled, false);
  assert.deepEqual(WHATSAPP_DEFAULT_SETTINGS.leadKeywords, NO_RULES);
});

test("an empty, missing, or malformed document parses to the defaults", () => {
  assert.deepEqual(parseWhatsAppSettings({}), WHATSAPP_DEFAULT_SETTINGS);
  assert.deepEqual(parseWhatsAppSettings(null), WHATSAPP_DEFAULT_SETTINGS);
  assert.deepEqual(parseWhatsAppSettings("nonsense"), WHATSAPP_DEFAULT_SETTINGS);
  assert.deepEqual(parseWhatsAppSettings([1, 2, 3]), WHATSAPP_DEFAULT_SETTINGS);
});

/* Keywords ----------------------------------------------------------------- */

test("keywords normalise to lowercase, single-spaced, length-capped text", () => {
  assert.equal(normalizeWhatsAppKeyword("  How   MUCH  "), "how much");
  assert.equal(normalizeWhatsAppKeyword(42), "");
  assert.equal(
    normalizeWhatsAppKeyword("x".repeat(200)).length,
    WHATSAPP_SETTINGS_LIMITS.keywordMaxLength,
  );
});

test("a keyword list accepts an array or a comma and newline separated string", () => {
  assert.deepEqual(normalizeWhatsAppKeywordList(["Price", "price", " QUOTE "]), ["price", "quote"]);
  assert.deepEqual(normalizeWhatsAppKeywordList("price,\nquote\r\nhow much"), [
    "price",
    "quote",
    "how much",
  ]);
  assert.deepEqual(normalizeWhatsAppKeywordList(undefined), []);
});

test("a keyword list is capped so one paste cannot fill the document", () => {
  const many = Array.from({ length: 500 }, (_, index) => `word${index}`);
  assert.equal(
    normalizeWhatsAppKeywordList(many).length,
    WHATSAPP_SETTINGS_LIMITS.keywordsPerList,
  );
});

test("keywords match on word edges, so a keyword cannot fire inside a longer word", () => {
  assert.equal(matchWhatsAppKeyword("we start on Monday", ["art"]), null);
  assert.equal(matchWhatsAppKeyword("what is the art budget", ["art"]), "art");
  assert.equal(matchWhatsAppKeyword("How much does it cost?", ["how much"]), "how much");
  assert.equal(matchWhatsAppKeyword("anything", []), null);
});

test("a keyword containing regex punctuation is matched literally", () => {
  assert.equal(matchWhatsAppKeyword("call me on +27 82", ["+27"]), "+27");
  assert.doesNotThrow(() => matchWhatsAppKeyword("test", ["c++ (dev)"]));
});

/* Keyword overrides -------------------------------------------------------- */

test("no keywords means the built-in classification passes through untouched", () => {
  const result = applyWhatsAppLeadKeywords(WARM_SERVICE, "do you do seo", NO_RULES);
  assert.equal(result.temperature, "WARM");
  assert.equal(result.intent, "SERVICE_QUESTION");
  assert.equal(result.override.applied, null);
});

test("a hot keyword forces HOT, flags review, and never auto-sends marketing copy", () => {
  const result = applyWhatsAppLeadKeywords(COLD, "I need a boekie for my shop", {
    ...NO_RULES,
    hot: ["boekie"],
  });
  assert.equal(result.temperature, "HOT");
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.safeReplyKind, "ACKNOWLEDGEMENT");
  assert.equal(result.override.keyword, "boekie");
});

test("a warm keyword lifts a cold message but never downgrades a hot one", () => {
  const lifted = applyWhatsAppLeadKeywords(COLD, "just browsing your shop", {
    ...NO_RULES,
    warm: ["shop"],
  });
  assert.equal(lifted.temperature, "WARM");

  const kept = applyWhatsAppLeadKeywords(HOT_PRICING, "price for the shop", {
    ...NO_RULES,
    warm: ["shop"],
  });
  assert.equal(kept.temperature, "HOT");
  assert.equal(kept.override.applied, null);
});

test("a spam keyword wins over a hot keyword and over the built-in classification", () => {
  const result = applyWhatsAppLeadKeywords(HOT_PRICING, "cheap loan, best price today", {
    hot: ["price"],
    warm: [],
    spam: ["loan"],
  });
  assert.equal(result.temperature, "COLD");
  assert.equal(result.humanReviewRequired, false);
  assert.equal(result.safeReplyKind, "NONE", "a spam message must not receive an auto-reply");
  assert.equal(result.override.applied, "spam");
});

test("keyword overrides never change the detected intent", () => {
  const result = applyWhatsAppLeadKeywords(WARM_SERVICE, "urgent seo help", {
    ...NO_RULES,
    hot: ["urgent"],
  });
  assert.equal(result.intent, "SERVICE_QUESTION");
});

/* Business hours ----------------------------------------------------------- */

test("times of day parse and format only in 24-hour HH:MM form", () => {
  assert.equal(parseWhatsAppTimeOfDay("08:30"), 510);
  assert.equal(parseWhatsAppTimeOfDay("00:00"), 0);
  assert.equal(parseWhatsAppTimeOfDay("23:59"), 1439);
  assert.equal(parseWhatsAppTimeOfDay("24:00"), null);
  assert.equal(parseWhatsAppTimeOfDay("8:30"), null);
  assert.equal(parseWhatsAppTimeOfDay("half past"), null);
  assert.equal(formatWhatsAppTimeOfDay(510), "08:30");
});

test("local time is read in the configured zone, not the server's", () => {
  // 2026-08-26T06:30:00Z is a Wednesday, 08:30 in Johannesburg (UTC+2).
  const at = new Date("2026-08-26T06:30:00.000Z");
  const johannesburg = getWhatsAppLocalTimeParts(at, "Africa/Johannesburg");
  assert.equal(johannesburg.weekday, 3);
  assert.equal(johannesburg.minutes, 8 * 60 + 30);

  const utc = getWhatsAppLocalTimeParts(at, "UTC");
  assert.equal(utc.minutes, 6 * 60 + 30);
});

test("an unknown timezone falls back to UTC instead of throwing", () => {
  const at = new Date("2026-08-26T06:30:00.000Z");
  const parts = getWhatsAppLocalTimeParts(at, "Not/AZone");
  assert.equal(parts.zone, "UTC");
  assert.equal(parts.minutes, 6 * 60 + 30);
});

test("business hours are open inside the window and closed outside it", () => {
  const hours = {
    enabled: true,
    timezone: "Africa/Johannesburg",
    days: [1, 2, 3, 4, 5],
    start: "08:00",
    end: "17:00",
  };
  // Same instant, judged in the configured zone: 08:30 local on a Wednesday.
  assert.equal(isWhatsAppBusinessHoursOpen(hours, new Date("2026-08-26T06:30:00.000Z")), true);
  // 17:30 local, past closing.
  assert.equal(isWhatsAppBusinessHoursOpen(hours, new Date("2026-08-26T15:30:00.000Z")), false);
  // Saturday, a day that is not selected.
  assert.equal(isWhatsAppBusinessHoursOpen(hours, new Date("2026-08-29T08:30:00.000Z")), false);
  // Exactly at closing time counts as closed.
  assert.equal(isWhatsAppBusinessHoursOpen(hours, new Date("2026-08-26T15:00:00.000Z")), false);
});

test("business hours report unknown rather than closed when switched off or unusable", () => {
  const base = {
    enabled: false,
    timezone: "Africa/Johannesburg",
    days: [1],
    start: "08:00",
    end: "17:00",
  };
  const at = new Date("2026-08-26T06:30:00.000Z");
  assert.equal(isWhatsAppBusinessHoursOpen(base, at), null);
  assert.equal(isWhatsAppBusinessHoursOpen({ ...base, enabled: true, end: "08:00" }, at), null);
  assert.equal(isWhatsAppBusinessHoursOpen({ ...base, enabled: true, start: "oops" }, at), null);
});

test("business days are described as runs, not a list of seven names", () => {
  assert.equal(describeWhatsAppBusinessDays([1, 2, 3, 4, 5]), "Mon–Fri");
  assert.equal(describeWhatsAppBusinessDays([0, 1, 2, 3, 4, 5, 6]), "Every day");
  assert.equal(describeWhatsAppBusinessDays([1, 3, 5]), "Mon, Wed, Fri");
  assert.equal(describeWhatsAppBusinessDays([6, 0]), "Sun, Sat");
  assert.equal(describeWhatsAppBusinessDays([]), "No days selected");
});

/* Response target ---------------------------------------------------------- */

test("no target reads as unset, and no data reads as unknown", () => {
  assert.equal(compareWhatsAppResponseToTarget(120, 0).status, "unset");
  assert.equal(compareWhatsAppResponseToTarget(null, 30).status, "unknown");
});

test("a median is judged against the target inclusively", () => {
  assert.equal(compareWhatsAppResponseToTarget(30 * 60, 30).status, "met");
  assert.equal(compareWhatsAppResponseToTarget(30 * 60 + 1, 30).status, "missed");
  assert.match(compareWhatsAppResponseToTarget(60, 30).label, /within the 30m target/i);
});

/* Parsing and clamping ----------------------------------------------------- */

test("out-of-range console preferences clamp instead of being rejected on read", () => {
  const parsed = parseWhatsAppSettings({
    console: { activityWindowDays: 10_000, inboxRefreshSeconds: 0 },
  });
  assert.equal(parsed.console.activityWindowDays, WHATSAPP_SETTINGS_LIMITS.activityWindowDays.max);
  assert.equal(parsed.console.inboxRefreshSeconds, WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.min);
});

test("a stored window with the end before the start falls back to the default window", () => {
  const parsed = parseWhatsAppSettings({
    businessHours: { enabled: true, start: "17:00", end: "08:00" },
  });
  assert.equal(parsed.businessHours.start, WHATSAPP_DEFAULT_SETTINGS.businessHours.start);
  assert.equal(parsed.businessHours.end, WHATSAPP_DEFAULT_SETTINGS.businessHours.end);
});

test("a stored timezone that does not exist falls back to the default zone", () => {
  const parsed = parseWhatsAppSettings({ businessHours: { timezone: "Middle/Earth" } });
  assert.equal(parsed.businessHours.timezone, WHATSAPP_DEFAULT_SETTINGS.businessHours.timezone);
});

test("parsing a real document round-trips every field", () => {
  const parsed = parseWhatsAppSettings({
    leadKeywords: { hot: ["Boekie", "boekie"], warm: "shop", spam: ["loan"] },
    businessHours: {
      enabled: true,
      timezone: "Africa/Johannesburg",
      days: [1, 2, 3, 4, 5, 5],
      start: "07:30",
      end: "16:00",
    },
    targetFirstResponseMinutes: "45",
    console: { activityWindowDays: 30, inboxRefreshSeconds: 20 },
  });

  assert.deepEqual(parsed.leadKeywords, { hot: ["boekie"], warm: ["shop"], spam: ["loan"] });
  assert.deepEqual(parsed.businessHours.days, [1, 2, 3, 4, 5]);
  assert.equal(parsed.businessHours.start, "07:30");
  assert.equal(parsed.targetFirstResponseMinutes, 45);
  assert.equal(parsed.console.activityWindowDays, 30);
});

/* Validation --------------------------------------------------------------- */

test("validation rejects the mistakes an operator can see and fix", () => {
  const hours = {
    enabled: true,
    timezone: "Africa/Johannesburg",
    days: [1],
    start: "08:00",
    end: "17:00",
  };

  assert.equal(validateWhatsAppSettingsInput({ businessHours: hours }).ok, true);

  const backwards = validateWhatsAppSettingsInput({
    businessHours: { ...hours, start: "17:00", end: "08:00" },
  });
  assert.equal(backwards.ok, false);
  assert.match(backwards.ok ? "" : backwards.error, /later than opening/i);

  const noDays = validateWhatsAppSettingsInput({ businessHours: { ...hours, days: [] } });
  assert.equal(noDays.ok, false);
  assert.match(noDays.ok ? "" : noDays.error, /at least one day/i);

  const badZone = validateWhatsAppSettingsInput({
    businessHours: { ...hours, timezone: "Middle/Earth" },
  });
  assert.equal(badZone.ok, false);
  assert.match(badZone.ok ? "" : badZone.error, /timezone/i);
});

test("an unusable window is ignored while business hours are switched off", () => {
  const result = validateWhatsAppSettingsInput({
    businessHours: { enabled: false, start: "17:00", end: "08:00", days: [] },
  });
  assert.equal(result.ok, true);
});

test("validation rejects an impossible response target", () => {
  assert.equal(validateWhatsAppSettingsInput({ targetFirstResponseMinutes: -5 }).ok, false);
  assert.equal(validateWhatsAppSettingsInput({ targetFirstResponseMinutes: 99_999 }).ok, false);
  assert.equal(validateWhatsAppSettingsInput({ targetFirstResponseMinutes: 0 }).ok, true);
  assert.equal(validateWhatsAppSettingsInput({ targetFirstResponseMinutes: "" }).ok, true);
});

test("a valid submission is returned already normalised", () => {
  const result = validateWhatsAppSettingsInput({
    leadKeywords: { hot: " PRICE , price ", warm: [], spam: [] },
    targetFirstResponseMinutes: "30",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.leadKeywords.hot, ["price"]);
  assert.equal(result.value.targetFirstResponseMinutes, 30);
});

/* Summary ------------------------------------------------------------------ */

test("the summary reports whether anything has actually been configured", () => {
  const untouched = summarizeWhatsAppSettings(WHATSAPP_DEFAULT_SETTINGS);
  assert.equal(untouched.changedFromDefaults, false);
  assert.equal(untouched.keywordCount, 0);

  const configured = summarizeWhatsAppSettings(
    parseWhatsAppSettings({
      leadKeywords: { hot: ["price"], warm: ["shop"], spam: [] },
      targetFirstResponseMinutes: 30,
    }),
  );
  assert.equal(configured.changedFromDefaults, true);
  assert.equal(configured.keywordCount, 2);
  assert.equal(configured.targetSet, true);
});
