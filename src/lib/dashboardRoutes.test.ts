import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app");
const sourceRoot = path.resolve(root, "..");
const routes = [
  "dashboard/page.tsx",
  "dashboard/content/page.tsx",
  "dashboard/content/articles/page.tsx",
  "dashboard/content/history/page.tsx",
  "dashboard/tiktok/page.tsx",
  "dashboard/tiktok/new/page.tsx",
  "dashboard/tiktok/drafts/page.tsx",
  "dashboard/tiktok/scheduled/page.tsx",
  "dashboard/tiktok/published/page.tsx",
  "dashboard/tiktok/attention/page.tsx",
  "dashboard/whatsapp/page.tsx",
  "dashboard/media/page.tsx",
  "dashboard/connections/page.tsx",
  "dashboard/settings/page.tsx",
];

const directlyRenderedPrivateSurfaces = [
  "app/dashboard/page.tsx",
  "app/dashboard/content/page.tsx",
  "app/dashboard/content/articles/page.tsx",
  "app/dashboard/content/history/page.tsx",
  "app/dashboard/tiktok/page.tsx",
  "app/dashboard/tiktok/new/page.tsx",
  "app/dashboard/whatsapp/page.tsx",
  "app/dashboard/media/page.tsx",
  "app/dashboard/connections/page.tsx",
  "app/dashboard/settings/page.tsx",
  "components/dashboard/TikTokQueueView.tsx",
];

test("unified automation dashboard exposes every approved module route", async () => {
  await Promise.all(routes.map((route) => access(path.join(root, route))));
});

test("dashboard shell exposes all approved top-level modules", async () => {
  const shell = await readFile(path.resolve(root, "../components/dashboard/DashboardShell.tsx"), "utf8");
  for (const label of ["Overview", "Content Automation", "TikTok Publishing", "WhatsApp Business", "Media Library", "Connections", "Settings"]) {
    assert.match(shell, new RegExp(label));
  }
});

test("private dashboard server surfaces enforce auth before reading child data", async () => {
  await Promise.all(directlyRenderedPrivateSurfaces.map(async (file) => {
    const text = await readFile(path.resolve(sourceRoot, file), "utf8");
    assert.match(text, /requireWebGrowthDashboardSession/,
      `${file} must enforce the canonical session inside the rendered child boundary`);
    assert.doesNotMatch(text, /readWebGrowthSessionFromCookieStore\([^\n]+\)!/,
      `${file} must not rely on a parent layout plus a non-null assertion`);
  }));
});

test("Content Automation dashboard subroutes preserve the admin-only boundary", async () => {
  for (const file of ["app/dashboard/content/articles/page.tsx", "app/dashboard/content/history/page.tsx"]) {
    const text = await readFile(path.resolve(sourceRoot, file), "utf8");
    assert.match(text, /requireContentAutomationDashboardAdmin/,
      `${file} must reject ordinary unified workspace identities`);
  }
});
