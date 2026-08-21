import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settingsPagePath = new URL("../../app/scheduler/settings/page.tsx", import.meta.url);

test("settings page gates Direct Post OAuth behind the approval flag", () => {
  const source = readFileSync(settingsPagePath, "utf8");

  assert.match(source, /getSchedulerConfig/);
  assert.match(source, /directPostEnabled/);
  assert.match(source, /TIKTOK_DIRECT_POST_ENABLED/);
  assert.match(source, /video\.publish/);
});
