import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postPagePath = new URL("../../app/scheduler/posts/[id]/page.tsx", import.meta.url);
const panelPath = new URL("../../components/scheduler/PostApprovalPanel.tsx", import.meta.url);
const statusPanelPath = new URL("../../components/scheduler/PostStatusPanel.tsx", import.meta.url);
const statusRoutePath = new URL("../../app/api/scheduler/posts/[id]/status/route.ts", import.meta.url);

test("post approval UI is gated behind Direct Post enablement", () => {
  const postPageSource = readFileSync(postPagePath, "utf8");
  const panelSource = readFileSync(panelPath, "utf8");

  assert.match(postPageSource, /getSchedulerConfig/);
  assert.match(postPageSource, /directPostEnabled=\{config\.directPostEnabled\}/);
  assert.match(panelSource, /directPostEnabled: boolean/);
  assert.match(panelSource, /if \(!directPostEnabled\) return/);
  assert.match(panelSource, /Direct Post approval needed/);
  assert.doesNotMatch(panelSource, /Connect TikTok Direct Post first\./);
});

// Mutation target: sending the raw datetime-local field lets the server parse
// it in another timezone or removes the local/instant integrity evidence.
test("schedule form submits a resolved instant with its original local time and zone", () => {
  const panelSource = readFileSync(panelPath, "utf8");

  assert.match(panelSource, /toScheduleInstantInTimezone/);
  assert.match(panelSource, /scheduledFor:\s*instant\.scheduledForIso/);
  assert.match(panelSource, /const localTime = String\(data\.get\("time"\)/);
  assert.match(panelSource, /localTime, timezone/);
  assert.match(panelSource, /timezone/);
});

test("live status is a separate, user-scoped panel with bounded polling", () => {
  const postPageSource = readFileSync(postPagePath, "utf8");
  const statusPanelSource = readFileSync(statusPanelPath, "utf8");
  const statusRouteSource = readFileSync(statusRoutePath, "utf8");
  const approvalPanelSource = readFileSync(panelPath, "utf8");

  assert.match(postPageSource, /PostStatusPanel/);
  assert.match(statusPanelSource, /\/api\/scheduler\/posts\/\$\{postId\}\/status\//);
  assert.match(statusPanelSource, /shouldPollPostStatus/);
  assert.match(statusPanelSource, /createStatusPollingController/);
  assert.match(statusPanelSource, /document\.visibilityState/);
  assert.match(statusPanelSource, /router\.refresh\(\)/);
  assert.match(statusPanelSource, /headingRef\.current\?\.focus\(\)/);
  assert.match(postPageSource, /createPublicStatusSnapshot/);
  assert.doesNotMatch(statusPanelSource, /user_failure_code|scheduled_posts/);
  assert.match(statusRouteSource, /readOwnedPostStatus\(db[\s\S]*?, id, session\.userId\)/);
  assert.match(statusRouteSource, /createPublicStatusSnapshot/);
  assert.doesNotMatch(statusRouteSource, /publish_id|encrypted_tokens|access_token|refresh_token/i);
  assert.doesNotMatch(approvalPanelSource, /Post scheduled successfully/);
});
