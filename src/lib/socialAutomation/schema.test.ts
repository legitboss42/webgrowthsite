import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260906011750_blog_social_automation.sql"
);

function migrationSql() {
  return fs.readFileSync(migrationPath, "utf8");
}

const tables = [
  "social_automation_jobs",
  "social_publications",
  "social_connections",
  "social_automation_settings",
  "social_media_assets",
  "social_automation_audit_log",
];

test("migration creates all social automation tables with RLS", () => {
  const sql = migrationSql();
  for (const table of tables) {
    assert.match(sql, new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i"));
  }
});

test("migration enforces idempotency and one publication per platform", () => {
  const sql = migrationSql();
  assert.match(sql, /idempotency_key\s+text\s+not\s+null\s+unique/i);
  assert.match(sql, /unique\s*\(job_id\s*,\s*platform\s*\)/i);
});

test("migration enforces exactly one owner Meta connection", () => {
  const sql = migrationSql();
  assert.match(sql, /provider\s+text\s+not\s+null\s+default\s+'META'[^,]+unique/i);
});

test("migration exposes social tables only to service_role", () => {
  const sql = migrationSql();
  for (const table of tables) {
    assert.match(sql, new RegExp(`grant\\s+select\\s*,\\s*insert\\s*,\\s*update\\s*,\\s*delete\\s+on\\s+public\\.${table}\\s+to\\s+service_role`, "i"));
  }
  assert.doesNotMatch(sql, /grant[^;]+to\s+(anon|authenticated)/i);
});

test("migration creates a private social automation storage bucket and 7 day defaults", () => {
  const sql = migrationSql();
  assert.match(sql, /'social-automation'\s*,\s*'social-automation'\s*,\s*false/i);
  assert.match(sql, /asset_retention_days[^;]+default\s+7/i);
  assert.match(sql, /default_timezone[^;]+default\s+'Africa\/Lagos'/i);
});
