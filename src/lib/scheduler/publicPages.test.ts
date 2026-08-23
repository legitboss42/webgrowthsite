import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schedulerPage = new URL("../../app/scheduler/page.tsx", import.meta.url);
const signInPage = new URL("../../app/scheduler/sign-in/page.tsx", import.meta.url);
const termsPage = new URL("../../app/scheduler/terms/page.tsx", import.meta.url);
const schedulerLayout = new URL("../../app/scheduler/layout.tsx", import.meta.url);
const routeGovernance = new URL("../route-governance.json", import.meta.url);

test("scheduler landing describes the gated and open-beta rollout states", async () => {
  const source = await readFile(schedulerPage, "utf8");

  assert.match(source, /getSchedulerLaunchState/);
  assert.match(source, /publicEnrollment/);
  assert.match(source, /TikTok access opening after approval/);
  assert.match(source, /Continue with TikTok/);
  assert.doesNotMatch(source, /public posting available/i);
});

test("scheduler sign-in only renders the TikTok access CTA for open enrollment", async () => {
  const source = await readFile(signInPage, "utf8");

  assert.match(source, /getSchedulerLaunchState/);
  assert.match(source, /launch\.publicEnrollment/);
  assert.match(source, /launch\.publicEnrollment\s*\?\s*\(/);
  assert.match(source, /Continue with TikTok/);
});

test("scheduler terms disclose retention and TikTok-only authentication", async () => {
  const source = await readFile(termsPage, "utf8");

  assert.match(source, /seven days/i);
  assert.match(source, /TikTok-only authentication/i);
  assert.match(source, /CURRENT_SCHEDULER_TERMS_VERSION/);
  assert.match(source, /CURRENT_SCHEDULER_PRIVACY_VERSION/);
});

test("scheduler shell exposes public legal navigation and governs the terms route", async () => {
  const [layout, governance] = await Promise.all([
    readFile(schedulerLayout, "utf8"),
    readFile(routeGovernance, "utf8"),
  ]);

  assert.match(layout, /href="\/scheduler\/terms\/"/);
  assert.match(governance, /"path": "\/scheduler\/terms\/"/);
});
