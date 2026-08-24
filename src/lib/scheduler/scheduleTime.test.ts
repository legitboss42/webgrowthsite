import assert from "node:assert/strict";
import test from "node:test";
import { parseOffsetScheduleInstant, toScheduleInstantInTimezone } from "./scheduleTime";

// Mutation target: treating the datetime-local wall time as UTC or using the
// server zone schedules a Lagos creator's requested local time an hour late.
test("the browser converts datetime-local values using the supplied IANA timezone", () => {
  assert.deepEqual(toScheduleInstantInTimezone("2026-08-24T13:30", "Africa/Lagos"), {
    ok: true,
    scheduledForIso: "2026-08-24T12:30:00.000Z",
  });
});

// Mutation target: inferring one offset at the nominal UTC wall time accepts a
// repeated fall-back wall time or maps a date rollover to the wrong UTC day.
test("timezone candidate resolution handles DST, non-hour offsets, and date rollover", () => {
  assert.deepEqual(toScheduleInstantInTimezone("2026-03-08T03:30", "America/New_York"), {
    ok: true,
    scheduledForIso: "2026-03-08T07:30:00.000Z",
  });
  assert.deepEqual(toScheduleInstantInTimezone("2026-08-24T13:30", "Asia/Kathmandu"), {
    ok: true,
    scheduledForIso: "2026-08-24T07:45:00.000Z",
  });
  assert.deepEqual(toScheduleInstantInTimezone("2026-01-01T00:30", "Pacific/Kiritimati"), {
    ok: true,
    scheduledForIso: "2025-12-31T10:30:00.000Z",
  });
});

// Mutation target: accepting an invalid zone or normalizing a nonexistent DST
// wall time silently changes the creator's requested publishing time.
test("browser conversion rejects invalid zones and nonexistent local times", () => {
  assert.deepEqual(toScheduleInstantInTimezone("2026-08-24T13:30", "Not/A_Timezone"), {
    ok: false,
    error: "Timezone is invalid.",
  });
  assert.deepEqual(toScheduleInstantInTimezone("2026-03-08T02:30", "America/New_York"), {
    ok: false,
    error: "Choose a valid local time in your timezone.",
  });
  assert.deepEqual(toScheduleInstantInTimezone("2026-11-01T01:30", "America/New_York"), {
    ok: false,
    error: "Choose a different local time because this time occurs twice in your timezone.",
  });
});

// Mutation target: accepting offset-free client timestamps lets the server
// reinterpret datetime-local input in its own timezone.
test("schedule boundary accepts a future offset-bearing instant and preserves timezone", () => {
  assert.deepEqual(parseOffsetScheduleInstant({
    scheduledFor: "2026-08-24T14:00:00+01:00",
    localTime: "2026-08-24T14:00",
    timezone: "Africa/Lagos",
    nowIso: "2026-08-24T12:00:00.000Z",
  }), {
    ok: true,
    scheduledForIso: "2026-08-24T13:00:00.000Z",
    timezone: "Africa/Lagos",
  });
});

// Mutation target: relying on Date parsing alone accepts offset-free input,
// a forged offset/zone pair, invalid zones, or non-future instants.
test("schedule boundary rejects offset-free, forged, invalid-zone, and non-future input", () => {
  for (const input of [
    { scheduledFor: "2026-08-24T14:00", localTime: "2026-08-24T14:00", timezone: "Africa/Lagos", nowIso: "2026-08-24T12:00:00.000Z", error: "Choose a future time and timezone." },
    { scheduledFor: "2026-08-24T14:00:00+01:00", localTime: "2026-08-24T14:00", timezone: "Not/A_Timezone", nowIso: "2026-08-24T12:00:00.000Z", error: "Timezone is invalid." },
    { scheduledFor: "2026-08-24T14:00:00Z", localTime: "2026-08-24T14:00", timezone: "Africa/Lagos", nowIso: "2026-08-24T12:00:00.000Z", error: "Scheduled time does not match the selected timezone." },
    { scheduledFor: "2026-08-24T12:00:00Z", localTime: "2026-08-24T13:00", timezone: "Africa/Lagos", nowIso: "2026-08-24T12:00:00.000Z", error: "Choose a future time and timezone." },
  ]) {
    assert.deepEqual(parseOffsetScheduleInstant(input), { ok: false, status: 400, error: input.error });
  }
});
