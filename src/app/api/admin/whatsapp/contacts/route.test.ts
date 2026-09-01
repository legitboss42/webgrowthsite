import test from "node:test";
import assert from "node:assert/strict";
import { applyOptInTimestamps } from "./route";

const NOW = "2026-09-01T08:00:00.000Z";
const PREVIOUS_OPT_IN = "2026-08-20T10:00:00.000Z";
const PREVIOUS_OPT_OUT = "2026-08-25T11:00:00.000Z";

test("opting in records the new opt-in time without erasing prior opt-out history", () => {
  const patch: Record<string, unknown> = {
    opt_in_status: "OPTED_IN",
    opt_out_at: PREVIOUS_OPT_OUT,
  };

  applyOptInTimestamps(patch, "OPTED_OUT", NOW);

  assert.equal(patch.opt_in_at, NOW);
  assert.equal(patch.opt_out_at, PREVIOUS_OPT_OUT);
});

test("opting out records the new opt-out time without erasing prior opt-in history", () => {
  const patch: Record<string, unknown> = {
    opt_in_status: "OPTED_OUT",
    opt_in_at: PREVIOUS_OPT_IN,
  };

  applyOptInTimestamps(patch, "OPTED_IN", NOW);

  assert.equal(patch.opt_out_at, NOW);
  assert.equal(patch.opt_in_at, PREVIOUS_OPT_IN);
});

test("setting consent to unknown preserves historical timestamps", () => {
  const patch: Record<string, unknown> = {
    opt_in_status: "UNKNOWN",
    opt_in_at: PREVIOUS_OPT_IN,
    opt_out_at: PREVIOUS_OPT_OUT,
  };

  applyOptInTimestamps(patch, "OPTED_OUT", NOW);

  assert.equal(patch.opt_in_at, PREVIOUS_OPT_IN);
  assert.equal(patch.opt_out_at, PREVIOUS_OPT_OUT);
});

test("unchanged consent state does not create a new timestamp", () => {
  const patch: Record<string, unknown> = { opt_in_status: "OPTED_IN" };

  applyOptInTimestamps(patch, "OPTED_IN", NOW);

  assert.equal(Object.prototype.hasOwnProperty.call(patch, "opt_in_at"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(patch, "opt_out_at"), false);
});
