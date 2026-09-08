import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relative: string) { return readFile(path.join(src, relative), "utf8"); }

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
