import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function source(file: string) {
  return readFileSync(path.join(ROOT, file), "utf8");
}

test("automation builder and Properties inspector remain independently scrollable", () => {
  const css = source("src/app/admin/whatsapp/stage12-overlap-fixes.css");

  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace \.wg-cw-surface\s*\{[^}]*overflow:\s*visible\s*!important/s,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace \.wg-cw-surface > div\[class\*="min-h-\[calc\(100vh-5rem\)\]"\]\s*\{[^}]*overflow:\s*visible\s*!important/s,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-automation-workspace[^}]*aside\[class\*="overflow-auto"\][^{]*\{[^}]*overflow-y:\s*auto\s*!important/s,
  );
});

test("WhatsApp Flow builder does not clip its editor or Properties inspector", () => {
  const css = source("src/app/admin/whatsapp/stage12-overlap-fixes.css");
  const flowPage = source("src/app/admin/whatsapp/flows/page.tsx");

  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-flow-workspace \.wg-editor-surface\s*\{[^}]*overflow:\s*visible\s*!important/s,
  );
  assert.match(
    css,
    /\.wg-whatsapp-app \.wg-flow-workspace[^}]*aside:last-child\s*\{[^}]*overflow-y:\s*auto\s*!important/s,
  );
  assert.match(flowPage, /wg-editor-surface/);
});
