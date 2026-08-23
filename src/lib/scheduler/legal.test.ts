import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CURRENT_SCHEDULER_PRIVACY_VERSION,
  CURRENT_SCHEDULER_TERMS_VERSION,
  hasCurrentLegalAcceptance,
  isActiveSchedulerUser,
  shouldPersistSchedulerConnection,
} from "./legal";

test("current scheduler legal acceptance requires both current versions", () => {
  assert.equal(CURRENT_SCHEDULER_TERMS_VERSION, "2026-08-23");
  assert.equal(CURRENT_SCHEDULER_PRIVACY_VERSION, "2026-08-23");
  assert.equal(hasCurrentLegalAcceptance({ termsVersion: "2026-08-23", privacyVersion: "2026-08-23" }), true);
  assert.equal(hasCurrentLegalAcceptance({ termsVersion: "2026-08-22", privacyVersion: "2026-08-23" }), false);
  assert.equal(hasCurrentLegalAcceptance({ termsVersion: "2026-08-23", privacyVersion: null }), false);
});

test("suspended and deletion-requested users cannot enter the active scheduler dashboard", () => {
  assert.equal(isActiveSchedulerUser({ status: "ACTIVE", suspendedAt: null, deletionRequestedAt: null }), true);
  assert.equal(isActiveSchedulerUser({ status: "SUSPENDED", suspendedAt: null, deletionRequestedAt: null }), false);
  assert.equal(isActiveSchedulerUser({ status: "ACTIVE", suspendedAt: "2026-08-23T00:00:00.000Z", deletionRequestedAt: null }), false);
  assert.equal(isActiveSchedulerUser({ status: "ACTIVE", suspendedAt: null, deletionRequestedAt: "2026-08-23T00:00:00.000Z" }), false);
});

test("unknown callback user status fails closed before token persistence", () => {
  assert.equal(shouldPersistSchedulerConnection({ status: null, suspendedAt: null, deletionRequestedAt: null }), false);
  assert.equal(shouldPersistSchedulerConnection({ status: "UNKNOWN", suspendedAt: null, deletionRequestedAt: null }), false);
  assert.equal(shouldPersistSchedulerConnection({ status: "ACTIVE", suspendedAt: null, deletionRequestedAt: null }), true);
});

test("dashboard renders legal acceptance before creator actions", async () => {
  const dashboard = await readFile(new URL("../../app/scheduler/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /hasCurrentLegalAcceptance/);
  assert.match(dashboard, /<TermsAcceptance/);
  assert.match(dashboard, /Create post/);
});
