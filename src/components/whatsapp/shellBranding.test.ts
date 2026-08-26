import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Guards a failure mode that neither the build nor any unit test catches.
 *
 * `next/image` throws at render time when `quality` is not one of the values listed in
 * `images.qualities`. The console pages are server-rendered on demand, so the throw never
 * happens during `next build` — it happens on the first real request, and React swallows
 * it into the Suspense fallback. The whole console then serves nothing but its loading
 * screen while every gate stays green. That is exactly what happened with `quality={80}`.
 *
 * Scoped to the WhatsApp console on purpose: the config is global, but this suite should
 * only be able to fail on code this work owns.
 */
const ROOT = path.resolve(__dirname, "../../..");

const WHATSAPP_DIRS = [
  "src/app/admin/whatsapp",
  "src/components/whatsapp",
  "src/lib/whatsapp",
  "src/app/api/admin/whatsapp",
];

function collectFiles(dir: string): string[] {
  const absolute = path.join(ROOT, dir);
  let entries: string[];
  try {
    entries = readdirSync(absolute);
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const relative = `${dir}/${entry}`;
    if (statSync(path.join(ROOT, relative)).isDirectory()) return collectFiles(relative);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [relative] : [];
  });
}

function getConfiguredQualities(): number[] {
  const config = readFileSync(path.join(ROOT, "next.config.mjs"), "utf8");
  const match = config.match(/qualities:\s*\[([^\]]*)\]/);
  assert.ok(match, "next.config.mjs must declare images.qualities");
  return match[1]
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

test("every next/image quality in the WhatsApp console is allowed by next.config.mjs", () => {
  const allowed = getConfiguredQualities();
  assert.ok(allowed.length > 0, "expected at least one configured quality");

  const offenders: string[] = [];
  for (const file of WHATSAPP_DIRS.flatMap(collectFiles)) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    for (const match of source.matchAll(/quality=\{(\d+)\}/g)) {
      const quality = Number(match[1]);
      if (!allowed.includes(quality)) offenders.push(`${file} uses quality={${quality}}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `next/image would throw at request time. Allowed: ${allowed.join(", ")}`,
  );
});

test("the console shell renders the project's own wordmark, not a substitute", () => {
  const shell = readFileSync(path.join(ROOT, "src/components/whatsapp/WhatsAppShell.tsx"), "utf8");

  // The one official asset, used by the public header and footer too.
  const references = [...shell.matchAll(/\/images\/brand\/web-growth-logo\.webp/g)];
  assert.equal(references.length, 2, "expected the sidebar and the mobile header wordmark");

  // Desktop keeps the sidebar mark; a phone only sees the header one, so both must exist.
  assert.match(shell, /className="h-5 w-auto"/);
  assert.match(shell, /className="h-4 w-auto"/);

  // `w-auto` on both is what stops the 6.75:1 wordmark from being stretched.
  const heights = [...shell.matchAll(/className="h-\d+ w-auto"/g)];
  assert.equal(heights.length, 2, "every logo must be sized by height with an automatic width");

  // Both marks are links to the console root and are named for assistive tech.
  const labels = [...shell.matchAll(/aria-label="Web Growth WhatsApp console"/g)];
  assert.equal(labels.length, 2);
});
