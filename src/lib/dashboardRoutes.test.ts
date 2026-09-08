import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app");
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

test("unified automation dashboard exposes every approved module route", async () => {
  await Promise.all(routes.map((route) => access(path.join(root, route))));
});

test("dashboard shell exposes all approved top-level modules", async () => {
  const shell = await readFile(path.resolve(root, "../components/dashboard/DashboardShell.tsx"), "utf8");
  for (const label of ["Overview", "Content Automation", "TikTok Publishing", "WhatsApp Business", "Media Library", "Connections", "Settings"]) {
    assert.match(shell, new RegExp(label));
  }
});
