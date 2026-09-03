import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { WHATSAPP_PLATFORM_SETTINGS_ROUTES, WHATSAPP_WORKSPACE_SETTINGS_ROUTES } from "@/lib/whatsapp/settingsNavigation";
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
  return [...walk(WHATSAPP_APP_ROOT), ...walk(WHATSAPP_COMPONENT_ROOT)]
    .filter((file) => /\.(?:tsx|ts)$/.test(file))
    .filter((file) => !/\.test\.(?:tsx|ts)$/.test(file));
}

test("every live WhatsApp navigation item resolves to an App Router page", () => {
  const missing = WHATSAPP_NAV_ITEMS
    .filter((item) => item.status === "live")
    .map((item) => ({ label: item.label, href: item.href, file: routeToPage(item.href) }))
    .filter((item) => !existsSync(item.file));
  assert.deepEqual(missing, []);
});

test("workspace and platform settings navigation resolves to real pages", () => {
  const missing = [...WHATSAPP_WORKSPACE_SETTINGS_ROUTES, ...WHATSAPP_PLATFORM_SETTINGS_ROUTES]
    .map((item) => ({ label: item.label, href: item.href, file: routeToPage(item.href) }))
    .filter((item) => !existsSync(item.file));
  assert.deepEqual(missing, []);
});

test("literal internal WhatsApp links resolve to real pages", () => {
  const missing: Array<{ source: string; href: string }> = [];
  const hrefPattern = /href=(?:"|')(\/admin\/whatsapp\/[^"'#?]*\/?(?:\?[^"']*)?)(?:"|')/g;

  for (const file of whatsappSourceFiles()) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(hrefPattern)) {
      const href = match[1];
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
  const workspaces = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12-workspaces.css"), "utf8");
  const chatwoot = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12-chatwoot.css"), "utf8");
  const polish = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/stage12-chatwoot-polish.css"), "utf8");
  assert.match(shell, /wg-whatsapp-app/);
  assert.match(shell, /\/images\/brand\/stage12-app-logo\.svg/);
  assert.equal(existsSync(path.join(ROOT, "public/images/brand/stage12-app-logo.svg")), true);
  assert.match(shell, /Mobile WhatsApp navigation/);
  assert.match(css, /^\.wg-whatsapp-app/m);
  assert.match(overrides, /^\.wg-whatsapp-app/m);
  assert.match(workspaces, /^\.wg-whatsapp-app/m);
  assert.match(chatwoot, /^\.wg-whatsapp-app/m);
  assert.match(polish, /^\.wg-whatsapp-app/m);
  assert.match(workspaces, /wg-inbox-workspace > div > section:first-of-type/);
  assert.match(chatwoot, /wg-inspector-rail/);
  assert.match(polish, /wg-report-tab/);
  assert.match(css, /max-width:\s*100vw/);
  assert.match(css, /overflow-x:\s*clip/);
});

test("corrective redesign uses shared app chrome across operational routes", () => {
  const chrome = readFileSync(path.join(ROOT, "src/components/whatsapp/WorkspaceChrome.tsx"), "utf8");
  assert.match(chrome, /WorkspaceToolbar/);
  assert.match(chrome, /WorkspaceRail/);
  assert.match(chrome, /WorkspaceStat/);
  assert.match(chrome, /WorkspaceSurface/);

  const structuralMarkers = [
    ["src/app/admin/whatsapp/conversations/page.tsx", "ReplyComposer"],
    ["src/app/admin/whatsapp/contacts/layout.tsx", "WorkspaceRail"],
    ["src/app/admin/whatsapp/automations/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/campaigns/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/flows/page.tsx", "wg-editor-surface"],
    ["src/app/admin/whatsapp/templates/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/analytics/layout.tsx", "wg-page-commandbar"],
    ["src/app/admin/whatsapp/team/layout.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/calls/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/quick-replies/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/phone-numbers/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/account/page.tsx", "WorkspaceToolbar"],
    ["src/app/admin/whatsapp/platform/settings/PlatformSettingsSection.tsx", "WorkspaceToolbar"],
  ] as const;

  for (const [file, marker] of structuralMarkers) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    assert.ok(source.includes(marker), `${file} is missing corrective redesign marker ${marker}`);
  }
});

test("corrective redesign branch is explicitly blocked from Vercel Git deployment", () => {
  const config = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8")) as {
    git?: { deploymentEnabled?: Record<string, boolean> };
  };
  assert.equal(config.git?.deploymentEnabled?.["stage12-visual-redesign-v2"], false);
});

test("major WhatsApp routes use dedicated app workspace frames", () => {
  const markers = [
    ["src/app/admin/whatsapp/conversations/layout.tsx", "wg-inbox-workspace"],
    ["src/app/admin/whatsapp/contacts/layout.tsx", "wg-crm-workspace"],
    ["src/app/admin/whatsapp/automations/layout.tsx", "wg-automation-workspace"],
    ["src/app/admin/whatsapp/campaigns/layout.tsx", "wg-campaign-workspace"],
    ["src/app/admin/whatsapp/flows/layout.tsx", "wg-flow-workspace"],
    ["src/app/admin/whatsapp/templates/layout.tsx", "wg-template-workspace"],
    ["src/app/admin/whatsapp/analytics/layout.tsx", "wg-analytics-workspace"],
    ["src/app/admin/whatsapp/team/layout.tsx", "wg-team-workspace"],
    ["src/app/admin/whatsapp/settings/layout.tsx", "wg-settings-workspace"],
    ["src/app/admin/whatsapp/calls/layout.tsx", "wg-calls-workspace"],
    ["src/app/admin/whatsapp/quick-replies/layout.tsx", "wg-replies-workspace"],
    ["src/app/admin/whatsapp/phone-numbers/layout.tsx", "wg-numbers-workspace"],
    ["src/app/admin/whatsapp/account/layout.tsx", "wg-account-workspace"],
  ] as const;

  for (const [file, marker] of markers) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    assert.ok(source.includes(marker), `${file} is missing ${marker}`);
  }
});

test("automation and Flow builders retain their functional multi-pane editing structures", () => {
  const automation = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/AutomationManager.tsx"), "utf8");
  const flow = readFileSync(path.join(ROOT, "src/app/admin/whatsapp/FlowManager.tsx"), "utf8");
  assert.ok(automation.includes("data-automation-action-path"));
  assert.ok(automation.includes("Properties"));
  assert.ok(flow.includes("lg:grid-cols-[240px_minmax(360px,1fr)_340px]"));
  assert.ok(flow.includes("Screens"));
  assert.ok(flow.includes("Sync Meta"));
});
