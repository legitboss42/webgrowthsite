import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_ANALYTICS_DEFAULT_RANGE,
  buildWhatsAppAnalyticsTotals,
  buildWhatsAppDeliveryBreakdown,
  buildWhatsAppResponseTimes,
  describeWhatsAppAnalyticsRange,
  formatWhatsAppDuration,
  formatWhatsAppRate,
  normalizeWhatsAppDeliveryStatus,
  resolveWhatsAppAnalyticsRange,
  type WhatsAppAnalyticsMessage,
} from "./analyticsModel";

const at = (iso: string) => iso;

function outbound(iso: string, status?: string | null): WhatsAppAnalyticsMessage {
  return { direction: "outbound", message_timestamp: at(iso), delivery_status: status, conversation_id: "c1" };
}

function inbound(iso: string, conversation = "c1"): WhatsAppAnalyticsMessage {
  return { direction: "inbound", message_timestamp: at(iso), conversation_id: conversation };
}

/* -------------------------------------------------------------------------- */
/* Range selection                                                            */
/* -------------------------------------------------------------------------- */

test("the range parameter is whitelisted, never trusted", () => {
  assert.equal(resolveWhatsAppAnalyticsRange("7"), 7);
  assert.equal(resolveWhatsAppAnalyticsRange("90"), 90);
  assert.equal(resolveWhatsAppAnalyticsRange(30), 30);
  // Anything else must collapse to the default rather than reach a query string.
  assert.equal(resolveWhatsAppAnalyticsRange("1; drop table"), WHATSAPP_ANALYTICS_DEFAULT_RANGE);
  assert.equal(resolveWhatsAppAnalyticsRange("365"), WHATSAPP_ANALYTICS_DEFAULT_RANGE);
  assert.equal(resolveWhatsAppAnalyticsRange(undefined), WHATSAPP_ANALYTICS_DEFAULT_RANGE);
  assert.equal(resolveWhatsAppAnalyticsRange(null), WHATSAPP_ANALYTICS_DEFAULT_RANGE);
});

test("every range has a label", () => {
  assert.equal(describeWhatsAppAnalyticsRange(7), "Last 7 days");
  assert.equal(describeWhatsAppAnalyticsRange(30), "Last 30 days");
  assert.equal(describeWhatsAppAnalyticsRange(90), "Last 90 days");
});

/* -------------------------------------------------------------------------- */
/* Delivery status                                                            */
/* -------------------------------------------------------------------------- */

test("delivery statuses normalize, and a missing one means queued", () => {
  assert.equal(normalizeWhatsAppDeliveryStatus("sent"), "sent");
  assert.equal(normalizeWhatsAppDeliveryStatus("DELIVERED"), "delivered");
  assert.equal(normalizeWhatsAppDeliveryStatus("  read  "), "read");
  assert.equal(normalizeWhatsAppDeliveryStatus("failed"), "failed");
  assert.equal(normalizeWhatsAppDeliveryStatus("undelivered"), "failed");
  // Not yet acknowledged by Meta.
  assert.equal(normalizeWhatsAppDeliveryStatus(null), "queued");
  assert.equal(normalizeWhatsAppDeliveryStatus(""), "queued");
  assert.equal(normalizeWhatsAppDeliveryStatus(undefined), "queued");
});

test("a status Meta adds later degrades to unknown instead of throwing", () => {
  assert.equal(normalizeWhatsAppDeliveryStatus("deleted"), "unknown");
  const breakdown = buildWhatsAppDeliveryBreakdown([outbound("2026-08-20T10:00:00Z", "deleted")]);
  assert.equal(breakdown.counts.unknown, 1);
  assert.equal(breakdown.total, 1);
});

test("the breakdown counts each outbound message exactly once and ignores inbound", () => {
  const breakdown = buildWhatsAppDeliveryBreakdown([
    outbound("2026-08-20T10:00:00Z", "read"),
    outbound("2026-08-20T10:01:00Z", "read"),
    outbound("2026-08-20T10:02:00Z", "delivered"),
    outbound("2026-08-20T10:03:00Z", "sent"),
    outbound("2026-08-20T10:04:00Z", "failed"),
    outbound("2026-08-20T10:05:00Z", null),
    inbound("2026-08-20T10:06:00Z"),
  ]);

  assert.equal(breakdown.total, 6);
  assert.equal(breakdown.counts.read, 2);
  assert.equal(breakdown.counts.delivered, 1);
  assert.equal(breakdown.counts.sent, 1);
  assert.equal(breakdown.counts.failed, 1);
  assert.equal(breakdown.counts.queued, 1);

  const summed = Object.values(breakdown.counts).reduce((sum, value) => sum + value, 0);
  assert.equal(summed, breakdown.total, "buckets must partition the outbound total");
});

test("a read message counts as delivered, because it reached the handset", () => {
  const breakdown = buildWhatsAppDeliveryBreakdown([
    outbound("2026-08-20T10:00:00Z", "read"),
    outbound("2026-08-20T10:01:00Z", "delivered"),
    outbound("2026-08-20T10:02:00Z", "failed"),
    outbound("2026-08-20T10:03:00Z", "sent"),
  ]);

  assert.equal(breakdown.deliveredRate, 0.5);
  assert.equal(breakdown.readRate, 0.25);
  assert.equal(breakdown.failedRate, 0.25);
});

test("with nothing sent the rates are null, not a misleading zero", () => {
  const breakdown = buildWhatsAppDeliveryBreakdown([inbound("2026-08-20T10:00:00Z")]);
  assert.equal(breakdown.total, 0);
  assert.equal(breakdown.deliveredRate, null);
  assert.equal(breakdown.readRate, null);
  assert.equal(breakdown.failedRate, null);
});

/* -------------------------------------------------------------------------- */
/* Response time                                                              */
/* -------------------------------------------------------------------------- */

test("response time measures each inbound question to its next outbound reply", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"),
    outbound("2026-08-20T10:05:00Z", "read"), // 5 minutes
  ]);

  assert.equal(stats.measured, 1);
  assert.equal(stats.medianMs, 5 * 60 * 1000);
  assert.equal(stats.averageMs, 5 * 60 * 1000);
  assert.equal(stats.fastestMs, 5 * 60 * 1000);
  assert.equal(stats.slowestMs, 5 * 60 * 1000);
});

test("consecutive customer messages are one wait, timed from the first", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"),
    inbound("2026-08-20T10:01:00Z"),
    inbound("2026-08-20T10:02:00Z"),
    outbound("2026-08-20T10:10:00Z", "read"),
  ]);

  // One question answered in ten minutes, not three waits.
  assert.equal(stats.measured, 1);
  assert.equal(stats.medianMs, 10 * 60 * 1000);
});

test("a second reply with no question in between is not counted again", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"),
    outbound("2026-08-20T10:02:00Z", "read"),
    outbound("2026-08-20T10:30:00Z", "read"),
  ]);

  assert.equal(stats.measured, 1);
  assert.equal(stats.medianMs, 2 * 60 * 1000);
});

test("waits are measured per conversation, never across them", () => {
  const stats = buildWhatsAppResponseTimes([
    { direction: "inbound", message_timestamp: "2026-08-20T10:00:00Z", conversation_id: "a" },
    { direction: "inbound", message_timestamp: "2026-08-20T10:01:00Z", conversation_id: "b" },
    { direction: "outbound", message_timestamp: "2026-08-20T10:03:00Z", conversation_id: "b" },
    { direction: "outbound", message_timestamp: "2026-08-20T10:20:00Z", conversation_id: "a" },
  ]);

  assert.equal(stats.measured, 2);
  assert.equal(stats.fastestMs, 2 * 60 * 1000); // conversation b
  assert.equal(stats.slowestMs, 20 * 60 * 1000); // conversation a
});

test("the median resists a single overnight outlier that skews the mean", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"),
    outbound("2026-08-20T10:01:00Z", "read"), // 1m
    inbound("2026-08-20T11:00:00Z"),
    outbound("2026-08-20T11:02:00Z", "read"), // 2m
    inbound("2026-08-20T12:00:00Z"),
    outbound("2026-08-21T12:00:00Z", "read"), // 24h
  ]);

  assert.equal(stats.measured, 3);
  assert.equal(stats.medianMs, 2 * 60 * 1000);
  assert.ok(stats.averageMs !== null && stats.averageMs > stats.medianMs * 100);
});

test("an even number of waits averages the two middle values", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"),
    outbound("2026-08-20T10:02:00Z", "read"), // 2m
    inbound("2026-08-20T11:00:00Z"),
    outbound("2026-08-20T11:04:00Z", "read"), // 4m
  ]);

  assert.equal(stats.measured, 2);
  assert.equal(stats.medianMs, 3 * 60 * 1000);
});

test("unanswered questions, bad timestamps, and clock skew are excluded", () => {
  const stats = buildWhatsAppResponseTimes([
    inbound("2026-08-20T10:00:00Z"), // never answered
    { direction: "inbound", message_timestamp: "not-a-date", conversation_id: "c2" },
    { direction: "outbound", message_timestamp: "2026-08-20T10:05:00Z", conversation_id: "c2" },
    // Reply stamped before the question: skew, not a negative response time.
    { direction: "inbound", message_timestamp: "2026-08-20T12:00:00Z", conversation_id: "c3" },
    { direction: "outbound", message_timestamp: "2026-08-20T11:00:00Z", conversation_id: "c3" },
    // No conversation id: cannot be attributed.
    { direction: "inbound", message_timestamp: "2026-08-20T10:00:00Z" },
    { direction: "outbound", message_timestamp: "2026-08-20T10:01:00Z" },
  ]);

  assert.equal(stats.measured, 0);
  assert.equal(stats.medianMs, null);
  assert.equal(stats.averageMs, null);
});

test("rows arriving out of order are sorted before pairing", () => {
  const stats = buildWhatsAppResponseTimes([
    outbound("2026-08-20T10:05:00Z", "read"),
    inbound("2026-08-20T10:00:00Z"),
  ]);

  assert.equal(stats.measured, 1);
  assert.equal(stats.medianMs, 5 * 60 * 1000);
});

/* -------------------------------------------------------------------------- */
/* Totals                                                                     */
/* -------------------------------------------------------------------------- */

test("totals split direction and count distinct active conversations", () => {
  const totals = buildWhatsAppAnalyticsTotals([
    inbound("2026-08-20T10:00:00Z", "a"),
    inbound("2026-08-20T10:01:00Z", "a"),
    { direction: "outbound", message_timestamp: "2026-08-20T10:02:00Z", conversation_id: "b" },
    { direction: "inbound", message_timestamp: "2026-08-20T10:03:00Z", conversation_id: "b" },
  ]);

  assert.equal(totals.received, 3);
  assert.equal(totals.sent, 1);
  assert.equal(totals.activeConversations, 2);
});

test("an empty range is a real zero, not a crash", () => {
  const totals = buildWhatsAppAnalyticsTotals([]);
  assert.deepEqual(totals, { sent: 0, received: 0, activeConversations: 0 });
});

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

test("durations format compactly across every scale", () => {
  assert.equal(formatWhatsAppDuration(0), "0s");
  assert.equal(formatWhatsAppDuration(48_000), "48s");
  assert.equal(formatWhatsAppDuration(60_000), "1m");
  assert.equal(formatWhatsAppDuration(750_000), "12m 30s");
  assert.equal(formatWhatsAppDuration(3_600_000), "1h");
  assert.equal(formatWhatsAppDuration(11_100_000), "3h 5m");
  assert.equal(formatWhatsAppDuration(86_400_000), "1d");
  assert.equal(formatWhatsAppDuration(187_200_000), "2d 4h");
});

test("an unavailable duration or rate renders as an em dash, never 0", () => {
  assert.equal(formatWhatsAppDuration(null), "—");
  assert.equal(formatWhatsAppDuration(undefined), "—");
  assert.equal(formatWhatsAppDuration(-1), "—");
  assert.equal(formatWhatsAppDuration(Number.NaN), "—");
  assert.equal(formatWhatsAppRate(null), "—");
  assert.equal(formatWhatsAppRate(undefined), "—");
});

test("rates render as whole percentages", () => {
  assert.equal(formatWhatsAppRate(0), "0%");
  assert.equal(formatWhatsAppRate(0.5), "50%");
  assert.equal(formatWhatsAppRate(0.987), "99%");
  assert.equal(formatWhatsAppRate(1), "100%");
});
