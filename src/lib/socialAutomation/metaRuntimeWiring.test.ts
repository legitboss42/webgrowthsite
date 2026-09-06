import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/lib/socialAutomation/publicationRunnerServer.ts"),
  "utf8"
);

test("runtime publisher refuses expired or reconnect-required Meta connections", () => {
  assert.match(source, /isMetaConnectionUsable/);
  assert.match(source, /access_expires_at/);
  assert.match(source, /reconnect_required/);
  assert.match(source, /accessExpiresAt/);
});
