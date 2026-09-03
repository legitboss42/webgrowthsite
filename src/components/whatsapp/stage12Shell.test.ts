import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { WHATSAPP_NAV_ITEMS } from "./nav";

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "src/app");
const WHATSAPP_APP_ROOT = path.join(APP_ROOT, "admin/whatsapp");
const WHATSAPP_COMPONENT_ROOT = path.join(ROOT, "src/components/whatsapp");

function routeToPage(route: string) {
  const clean = route.split("?")[0].split("#")[0].replace(/^\//, "").replace(/\/$/, "");
  return path.join(APP_ROOT, clean, "page.tsx");
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function whatsappSourceFiles() {
  return [...walk(WHATSAPP_APP_ROOT), ...walk(WHATSAPP_COMPONENT_ROOT)].filter((file) => /\.(?:tsx|ts)$/.test(file));
}

test("every live WhatsApp navigation item resolves to an App Router page", () => {
  const missing = WHATSAPP_NAV_ITEMS
    .filter((item) => item.status === "live")
    .map((item) => ({ label: item.label, href: item.href, file: routeToPage(item.href) }))
    .filter((item) => !existsSync(item.file));
  assert.deepEqual(missing, []);
});

test("literal internal WhatsApp links resolve to real pages", () => {
  const missing: Array<{ source: string; href: string }> = [];
  const hrefPattern = /href=(?:"|')(?<href>\/admin\/whatsapp\/[^"'#?]*\/?(?:\?[^"']*)?)(?:"|')/g;

  for (const file of whatsappSourceFiles()) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(hrefPattern)) {
      const href = match.groups?.href;
      if (!href || href.includes("${")) continue;
      if (!existsSync(routeToPage(href))) missing.push({ source: path.relative(ROOT, file), href });
    }
  }

  assert.deepEqual(missing, []);
});

test("WhatsApp frontend contains no exact placeholder links or javascript URLs", () => {
  const violations: string[] = [];
  for (const file of whatsappSourceFiles()) {
    const source = readFileSync(file, "utf8");
    if (/href=["']#["']/.test(source) || /href=["']["']/.test(source) || /javascript:/i.test(source)) {
      violations.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(violations, []);
});

test("Stage 12 shell keeps the redesign scoped to WhatsApp and uses the supplied app logo", () => {
  const shell = readFileSync(path.join(ROOT, "src/components/whatsapp/WhatsAppShell.tsx"), "utf8");
  const css = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12.css"), "utf8");
  const overrides = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12-overrides.css"), "utf8");
  assert.match(shell, /wg-whatsapp-app/);
  assert.match(shell, /stage12-app-logo\.svg/);
  assert.match(shell, /Mobile WhatsApp navigation/);
  assert.match(css, /^\.wg-whatsapp-app/m);
  assert.match(overrides, /^\.wg-whatsapp-app/m);
  assert.match(css, /max-width:\s*100vw/);
  assert.match(css, /overflow-x:\s*clip/);
});
