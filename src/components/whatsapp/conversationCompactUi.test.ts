import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

test("workspace navigation lives beside the logo instead of a redundant WG block", () => {
  const shell = read("src/components/whatsapp/WhatsAppShell.tsx");
  const switcher = read("src/components/whatsapp/WorkspaceSwitcher.tsx");
  assert.match(shell, /<a href=\{href\}/);
  assert.match(shell, /wg-brand-workspace-control/);
  assert.doesNotMatch(shell, /Expand the sidebar to switch workspace/);
  assert.match(switcher, /workspaces\.length > 1/);
  assert.match(switcher, /Switch workspace/);
  assert.match(switcher, /window\.location\.assign\("\/admin\/whatsapp\/"\)/);
});

test("conversation lifecycle and lead filters are consolidated into one compact filter dock", () => {
  const dock = read("src/components/whatsapp/ConversationFilterDock.tsx");
  const layout = read("src/app/admin/whatsapp/layout.tsx");
  const css = read("src/app/admin/whatsapp/stage12-conversation-compact.css");
  assert.match(dock, /Lead type/);
  assert.match(dock, /Lifecycle/);
  assert.match(dock, /Apply filters/);
  assert.match(layout, /<ConversationFilterDock \/>/);
  assert.match(css, /nav\[aria-label="Lead filters"\]/);
  assert.match(css, /select\[name="lifecycle"\]/);
});

test("mobile conversation chrome is compact and desktop topbar is deliberately grouped", () => {
  const css = read("src/app/admin/whatsapp/stage12-conversation-compact.css");
  assert.match(css, /grid-template-columns: minmax\(13rem, 1fr\) auto auto/);
  assert.match(css, /section:has\(#whatsapp-composer-editor\)/);
  assert.match(css, /#whatsapp-composer-hint \{ display: none !important; \}/);
  assert.match(css, /min-height: 2\.85rem !important/);
});
