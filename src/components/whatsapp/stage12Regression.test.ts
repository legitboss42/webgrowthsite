import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { getWhatsAppLayoutMode } from "./nav";

const ROOT = process.cwd();

function source(file: string) {
  return readFileSync(path.join(ROOT, file), "utf8");
}

test("automation and Flow builders use normal page scrolling instead of the inbox-only fill shell", () => {
  assert.equal(getWhatsAppLayoutMode("/admin/whatsapp/conversations"), "fill");
  assert.equal(getWhatsAppLayoutMode("/admin/whatsapp/automations"), "scroll");
  assert.equal(getWhatsAppLayoutMode("/admin/whatsapp/flows"), "scroll");
});

test("interactive outbound routes pass the authenticated workspace explicitly to Supabase storage", () => {
  const replyRoutes = [
    "src/app/api/admin/whatsapp/reply/route.ts",
    "src/app/api/admin/whatsapp/reply/audio/route.ts",
    "src/app/api/admin/whatsapp/reply/media/route.ts",
    "src/app/api/admin/whatsapp/reply/saved-reply/route.ts",
  ];

  for (const route of replyRoutes) {
    assert.match(
      source(route),
      /const storeOptions = \{ url: supabaseUrl, serviceRoleKey, workspaceId: access\.workspaceId \};/,
      `${route} must not rely on AsyncLocalStorage surviving the auth await boundary`,
    );
  }

  assert.match(
    source("src/app/api/admin/whatsapp/flows/send/route.ts"),
    /createSupabaseWhatsAppStore\(\{ url: config\.url, serviceRoleKey: config\.key, workspaceId: access\.workspaceId \}\)/,
  );
});

test("automation builder and Properties inspector remain independently scrollable", () => {
  const css = source("src/app/admin/whatsapp/stage12-overlap-fixes.css");

  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace \.wg-cw-surface\s*\{[\s\S]*?overflow:\s*visible\s*!important/,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace \.wg-cw-surface > div\[class\*="min-h-\[calc\(100vh-5rem\)\]"\]\s*\{[\s\S]*?overflow:\s*visible\s*!important/,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace[^\{]*aside\[class\*="overflow-auto"\][^\{]*\{[\s\S]*?overflow-y:\s*auto\s*!important/,
  );
});

test("WhatsApp Flow builder does not clip its editor or Properties inspector", () => {
  const css = source("src/app/admin/whatsapp/stage12-overlap-fixes.css");
  const flowPage = source("src/app/admin/whatsapp/flows/page.tsx");

  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-flow-workspace \.wg-editor-surface\s*\{[\s\S]*?overflow:\s*visible\s*!important/,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-flow-workspace[^\{]*aside:last-child\s*\{[\s\S]*?overflow-y:\s*auto\s*!important/,
  );
  assert.match(flowPage, /wg-editor-surface/);
});