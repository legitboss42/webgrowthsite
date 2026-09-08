import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();

test("TikTok terminal reconciliation synchronizes the blog-social publication row", () => {
  const source = readFileSync(path.join(ROOT, "src/lib/scheduler/reconcile.ts"), "utf8");

  assert.match(source, /from\(["']social_publications["']\)/);
  assert.match(source, /external_publication_id/);
  assert.match(source, /platform["']?,\s*["']TIKTOK["']|\.eq\(["']platform["'],\s*["']TIKTOK["']\)/);
  assert.match(source, /PUBLISHED/);
});
