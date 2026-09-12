import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relative: string) { return readFile(path.join(src, relative), "utf8"); }
async function exists(relative: string) {
  try {
    await access(path.join(src, relative));
    return true;
  } catch {
    return false;
  }
}

test("unified sign-in offers Google and workspace password for the shared dashboard", async () => {
  const page = await source("app/sign-in/page.tsx");
  assert.match(page, /buildGoogleAuthStartPath/);
  assert.match(page, /WorkspacePasswordSignIn/);
  assert.match(page, /\/dashboard\//);
});

test("legacy product entrances point users toward the unified account", async () => {
  const [scheduler, content, whatsapp] = await Promise.all([
    source("app/scheduler/sign-in/page.tsx"),
    source("app/admin/content-automation/page.tsx"),
    source("app/admin/whatsapp/layout.tsx"),
  ]);
  assert.match(scheduler, /\/sign-in\//);
  assert.match(content, /\/sign-in\//);
  assert.match(whatsapp, /\/sign-in\//);
});

test("Content Automation receives the shared site header without enabling public chrome on every admin console", async () => {
  const [chrome, layout] = await Promise.all([
    source("components/SiteChrome.tsx"),
    source("app/layout.tsx"),
  ]);
  assert.match(chrome, /SiteHeaderOnly/);
  assert.match(chrome, /\/admin\/content-automation/);
  assert.match(layout, /<SiteHeaderOnly>[\s\S]*<Header\s*\/>[\s\S]*<\/SiteHeaderOnly>/);
});

test("dashboard routes use internal app chrome instead of the public site header and footer", async () => {
  const chrome = await source("components/SiteChrome.tsx");
  assert.match(chrome, /pathname === "\/dashboard" \|\| pathname\.startsWith\("\/dashboard\/"\)/);
});

test("dashboard shell constrains mobile width while keeping module navigation horizontally scrollable", async () => {
  const shell = await source("components/dashboard/DashboardShell.tsx");
  assert.match(shell, /overflow-x-hidden/);
  assert.match(shell, /w-full min-w-0/);
  assert.match(shell, /max-w-full/);
  assert.match(shell, /overflow-x-auto/);
  assert.match(shell, /break-words/);
});

test("public header links to the dashboard when signed out and replaces that CTA with an account icon after sign-in", async () => {
  const header = await source("components/Header.tsx");
  assert.match(header, /\/api\/auth\/session\//);
  assert.match(header, />Dashboard</);
  assert.match(header, /Open account/);
  assert.match(header, /\/dashboard\//);
});

test("header session endpoint exposes only safe account display state", async () => {
  const routePath = "app/api/auth/session/route.ts";
  assert.equal(await exists(routePath), true, "expected a canonical header session endpoint");
  const route = await source(routePath);
  assert.match(route, /readWebGrowthSessionFromCookieStore/);
  assert.match(route, /authenticated/);
  assert.match(route, /displayName/);
  assert.doesNotMatch(route, /schedulerUserId|tiktokOpenId|workspaceId|workspaceRole/);
});
