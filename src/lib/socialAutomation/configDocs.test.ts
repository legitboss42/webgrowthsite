import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const requiredNames = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_GRAPH_VERSION",
  "META_REDIRECT_URI",
  "META_OAUTH_STATE_SECRET",
  "META_TOKEN_ENCRYPTION_KEY",
  "SOCIAL_AUTOMATION_WEBHOOK_SECRET",
  "SOCIAL_AUTOMATION_BASE_URL",
  "SOCIAL_AUTOMATION_VERSION",
];

for (const file of [".env.example", ".env.local.example"]) {
  test(`${file} documents every blog social variable`, () => {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const name of requiredNames) {
      assert.match(source, new RegExp(`^${name}=`, "m"), `${name} missing from ${file}`);
    }
  });
}

test("operations guide documents workflows, live migration, Meta consent, and TikTok approval", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "docs/blog-social-automation.md"),
    "utf8"
  );
  assert.match(source, /20260906105535/);
  assert.match(source, /SOCIAL_AUTOMATION_WEBHOOK_SECRET/);
  assert.match(source, /blog-social-automation\.yml/);
  assert.match(source, /blog-social-cleanup\.yml/);
  assert.match(source, /Meta.*OAuth/i);
  assert.match(source, /TikTok.*NEEDS_APPROVAL/i);
  assert.match(source, /do not merge.*main/i);
});
