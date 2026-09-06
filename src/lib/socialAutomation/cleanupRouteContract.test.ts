import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath = path.join(
  process.cwd(),
  "src/app/api/internal/social-automation/cleanup/route.ts"
);

test("cleanup route is signed, retention-aware, and handles both storage buckets", () => {
  assert.equal(fs.existsSync(routePath), true, "cleanup route must exist");
  const source = fs.readFileSync(routePath, "utf8");
  assert.match(source, /readSignedJsonRequest/);
  assert.match(source, /isRetentionCleanupEligible/);
  assert.match(source, /social_media_assets/);
  assert.match(source, /social_publications/);
  assert.match(source, /scheduled_posts/);
  assert.match(source, /social-automation/);
  assert.match(source, /tiktok-scheduler-media/);
  assert.match(source, /\.remove\(/);
  assert.match(source, /storage_deleted_at/);
  assert.match(source, /cleanup_state/);
  assert.match(source, /deleted_at/);
});
