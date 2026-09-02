import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppAnalyticsTrend,
  classifyWhatsAppAnalyticsPeriod,
  countWhatsAppAnalyticsStatuses,
  safeWhatsAppAnalyticsRate,
  summarizeWhatsAppDurations,
  topWhatsAppAnalyticsEntries,
} from "./advancedAnalyticsModel";

test("classifies analytics timestamps into equal current and previous periods", () => {
  const now = Date.parse("2026-09-02T22:00:00.000Z");
  const current = Date.parse("2026-08-26T22:00:00.000Z");
  const previous = Date.parse("2026-08-19T22:00:00.000Z");
  assert.equal(classifyWhatsAppAnalyticsPeriod("2026-09-01T12:00:00.000Z", current, previous, now), "current");
  assert.equal(classifyWhatsAppAnalyticsPeriod("2026-08-22T12:00:00.000Z", current, previous, now), "previous");
  assert.equal(classifyWhatsAppAnalyticsPeriod("2026-08-01T12:00:00.000Z", current, previous, now), "outside");
});

test("builds favorable trends for normal and lower-is-better metrics", () => {
  assert.deepEqual(buildWhatsAppAnalyticsTrend(12, 10), {
    direction: "up", delta: 2, percent: 0.2, favorable: true,
  });
  assert.deepEqual(buildWhatsAppAnalyticsTrend(4, 8, { lowerIsBetter: true }), {
    direction: "down", delta: -4, percent: -0.5, favorable: true,
  });
  assert.equal(buildWhatsAppAnalyticsTrend(3, 0).percent, null);
});

test("summarizes durations without accepting invalid values", () => {
  assert.deepEqual(summarizeWhatsAppDurations([1000, 3000, 2000, -1, null]), {
    count: 3,
    averageMs: 2000,
    medianMs: 2000,
    fastestMs: 1000,
    slowestMs: 3000,
  });
  assert.equal(summarizeWhatsAppDurations([]).medianMs, null);
});

test("counts known statuses and ignores unknown values", () => {
  const result = countWhatsAppAnalyticsStatuses(["SUCCEEDED", "failed", "other"], ["SUCCEEDED", "FAILED"] as const);
  assert.deepEqual(result, { SUCCEEDED: 1, FAILED: 1 });
});

test("builds top entries and safe rates", () => {
  assert.deepEqual(topWhatsAppAnalyticsEntries(["SEO", "Automation", "SEO", ""], 2), [
    { label: "SEO", count: 2 },
    { label: "Automation", count: 1 },
  ]);
  assert.equal(safeWhatsAppAnalyticsRate(3, 4), 0.75);
  assert.equal(safeWhatsAppAnalyticsRate(0, 0), null);
});
