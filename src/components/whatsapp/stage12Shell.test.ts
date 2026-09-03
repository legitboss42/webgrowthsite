import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { WHATSAPP_NAV_ITEMS } from "./nav";

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "src/app");

function routeToPage(route: string) {
  const clean = route.split("?")[0].replace(/^\//, "").replace(/\/$/, "");
  return path.join(APP_ROOT, clean, "page.tsx");
}

test("every live WhatsApp navigation item resolves to an App Router page", () => {
  const missing = WHATSAPP_NAV_ITEMS
    .filter((item) => item.status === "live")
    .map((item) => ({ label: item.label, href: item.href, file: routeToPage(item.href) }))
    .filter((item) => !existsSync(item.file));
  assert.deepEqual(missing, []);
});

test("Stage 12 shell keeps the redesign scoped to WhatsApp and uses the supplied app logo", () => {
  const shell = readFileSync(path.join(ROOT, "src/components/whatsapp/WhatsAppShell.tsx"), "utf8");
  const css = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12.css"), "utf8");
  assert.match(shell, /wg-whatsapp-app/);
  assert.match(shell, /stage12-app-logo\.svg/);
  assert.match(shell, /Mobile WhatsApp navigation/);
  assert.match(css, /^\.wg-whatsapp-app/m);
  assert.match(css, /max-width:\s*100vw/);
  assert.match(css, /overflow-x:\s*clip/);
});

test("Stage 12 shell does not introduce placeholder navigation", () => {
  const shell = readFileSync(path.join(ROOT, "src/components/whatsapp/WhatsAppShell.tsx"), "utf8");
  assert.doesNotMatch(shell, /href=["']#["']/);
  assert.doesNotMatch(shell, /javascript:/i);
});
