import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppActivitySeries,
  buildWhatsAppChartGeometry,
  buildWhatsAppOverviewMetrics,
  formatWhatsAppMetric,
  getWhatsAppActivityMax,
} from "./overview";
import { parseWhatsAppContentRangeTotal } from "./data";
import type { WhatsAppLeadRow } from "./dashboard";

const NOW = Date.parse("2026-08-25T09:30:00.000Z");

const leads: WhatsAppLeadRow[] = [
  {
    id: "hot",
    wa_id: "1",
    display_name: "Hot Lead",
    lead_temperature: "HOT",
    intent: "PRICING_REQUEST",
    human_review_required: true,
    status: "open",
    last_message_at: "2026-08-25T08:00:00.000Z",
  },
  {
    id: "warm",
    wa_id: "2",
    display_name: "Warm Lead",
    lead_temperature: "WARM",
    human_review_required: false,
    status: "open",
    last_message_at: "2026-08-24T08:00:00.000Z",
  },
  {
    id: "cold",
    wa_id: "3",
    display_name: "Cold Lead",
    lead_temperature: "COLD",
    human_review_required: false,
    status: "closed",
    last_message_at: "2026-08-20T08:00:00.000Z",
  },
];

test("activity series always returns one point per requested day, oldest first", () => {
  const series = buildWhatsAppActivitySeries({ messages: [], days: 14, now: NOW });

  assert.equal(series.length, 14);
  assert.equal(series[0].key, "2026-08-12");
  assert.equal(series[13].key, "2026-08-25");
  assert.equal(series[13].label, "Aug 25");
  assert.deepEqual(
    series.map((point) => point.sent + point.received),
    new Array(14).fill(0),
  );
});

test("activity series buckets messages by UTC day and direction", () => {
  const series = buildWhatsAppActivitySeries({
    messages: [
      { direction: "inbound", message_timestamp: "2026-08-25T01:00:00.000Z" },
      { direction: "inbound", message_timestamp: "2026-08-25T23:59:59.000Z" },
      { direction: "outbound", message_timestamp: "2026-08-25T09:00:00.000Z" },
      { direction: "outbound", message_timestamp: "2026-08-24T09:00:00.000Z" },
    ],
    days: 14,
    now: NOW,
  });

  const today = series[13];
  assert.equal(today.received, 2);
  assert.equal(today.sent, 1);
  assert.equal(series[12].sent, 1);
});

test("activity series ignores messages outside the window and unparseable timestamps", () => {
  const series = buildWhatsAppActivitySeries({
    messages: [
      { direction: "inbound", message_timestamp: "2020-01-01T00:00:00.000Z" },
      { direction: "inbound", message_timestamp: "not-a-date" },
      { direction: "inbound" },
    ],
    days: 7,
    now: NOW,
  });

  assert.equal(
    series.reduce((total, point) => total + point.sent + point.received, 0),
    0,
  );
});

test("chart geometry spans the full width and closes the area path", () => {
  const geometry = buildWhatsAppChartGeometry([0, 5, 10], { width: 100, height: 50, max: 10 });

  assert.match(geometry.line, /^M0\.00,50\.00 L50\.00,25\.00 L100\.00,0\.00$/);
  assert.match(geometry.area, /Z$/);
  assert.deepEqual(geometry.last, { x: 100, y: 0 });
});

test("chart geometry keeps an all-zero series on the baseline instead of dividing by zero", () => {
  const geometry = buildWhatsAppChartGeometry([0, 0, 0], { width: 100, height: 50, max: 0 });

  assert.equal(geometry.line, "M0.00,50.00 L50.00,50.00 L100.00,50.00");
  assert.ok(Number.isFinite(geometry.last?.y));
});

test("chart geometry handles empty and single-point series", () => {
  assert.deepEqual(buildWhatsAppChartGeometry([], { width: 100, height: 50, max: 1 }), {
    line: "",
    area: "",
    last: null,
  });

  const single = buildWhatsAppChartGeometry([4], { width: 100, height: 50, max: 4 });
  assert.deepEqual(single.last, { x: 50, y: 0 });
});

test("activity max spans both series", () => {
  const points = buildWhatsAppActivitySeries({
    messages: [
      { direction: "inbound", message_timestamp: "2026-08-25T01:00:00.000Z" },
      { direction: "inbound", message_timestamp: "2026-08-25T02:00:00.000Z" },
      { direction: "inbound", message_timestamp: "2026-08-25T03:00:00.000Z" },
      { direction: "outbound", message_timestamp: "2026-08-24T02:00:00.000Z" },
    ],
    days: 5,
    now: NOW,
  });

  assert.equal(getWhatsAppActivityMax(points), 3);
});

test("overview metrics derive lead breakdowns and the latest activity", () => {
  const metrics = buildWhatsAppOverviewMetrics({
    leads,
    contacts: 12,
    messagesSent: 40,
    messagesReceived: 55,
    senderConnected: true,
  });

  assert.equal(metrics.connectedNumbers, 1);
  assert.equal(metrics.conversations, 3);
  assert.equal(metrics.contacts, 12);
  assert.equal(metrics.hotLeads, 1);
  assert.equal(metrics.warmLeads, 1);
  assert.equal(metrics.needsReview, 1);
  assert.equal(metrics.openConversations, 2);
  assert.equal(metrics.lastActivityAt, "2026-08-25T08:00:00.000Z");
});

test("overview reports zero connected numbers when the sender is not configured", () => {
  const metrics = buildWhatsAppOverviewMetrics({
    leads: [],
    contacts: null,
    messagesSent: null,
    messagesReceived: null,
    senderConnected: false,
  });

  assert.equal(metrics.connectedNumbers, 0);
  assert.equal(metrics.conversations, 0);
  assert.equal(metrics.contacts, null);
  assert.equal(metrics.lastActivityAt, undefined);
});

test("unavailable counts render as a dash, never as a fabricated zero", () => {
  assert.equal(formatWhatsAppMetric(null), "—");
  assert.equal(formatWhatsAppMetric(undefined), "—");
  assert.equal(formatWhatsAppMetric(0), "0");
  assert.equal(formatWhatsAppMetric(1234), "1,234");
});

test("PostgREST content-range totals parse, and unknown totals stay null", () => {
  assert.equal(parseWhatsAppContentRangeTotal("0-0/128"), 128);
  assert.equal(parseWhatsAppContentRangeTotal("0-0/*"), null);
  assert.equal(parseWhatsAppContentRangeTotal(null), null);
  assert.equal(parseWhatsAppContentRangeTotal("garbage"), null);
});
