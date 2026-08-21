import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const postPagePath = new URL("../../app/scheduler/posts/[id]/page.tsx", import.meta.url);
const panelPath = new URL("../../components/scheduler/PostApprovalPanel.tsx", import.meta.url);

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
