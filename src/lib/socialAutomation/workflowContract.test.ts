import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function source(relativePath: string) {
  const fullPath = path.join(process.cwd(), relativePath);
  assert.equal(fs.existsSync(fullPath), true, `${relativePath} must exist`);
  return fs.readFileSync(fullPath, "utf8");
}

test("main workflow detects newly added blog posts and invokes the signed social runner", () => {
  const workflow = source(".github/workflows/blog-social-automation.yml");
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /content\/blog\/\*\*/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assert.match(workflow, /npm run test:social/);
  assert.match(workflow, /npm run test:scheduler/);
  assert.match(workflow, /detect-new-blog-posts\.mjs/);
  assert.match(workflow, /run-blog-social-automation\.mjs/);
  assert.match(workflow, /SOCIAL_AUTOMATION_WEBHOOK_SECRET/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("detector uses Git name-status instead of article dates", () => {
  const detector = source("scripts/detect-new-blog-posts.mjs");
  assert.match(detector, /git/);
  assert.match(detector, /diff/);
  assert.match(detector, /--name-status/);
  assert.match(detector, /detectAddedBlogPaths/);
});

test("scheduled cleanup uses the signed cleanup endpoint", () => {
  const workflow = source(".github/workflows/blog-social-cleanup.yml");
  const runner = source("scripts/run-social-cleanup.mjs");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /run-social-cleanup\.mjs/);
  assert.match(workflow, /SOCIAL_AUTOMATION_WEBHOOK_SECRET/);
  assert.match(runner, /createHmac/);
  assert.match(runner, /\/api\/internal\/social-automation\/cleanup\//);
  assert.match(runner, /x-wg-timestamp/);
  assert.match(runner, /x-wg-signature/);
});
