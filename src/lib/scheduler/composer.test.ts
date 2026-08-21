import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composerPath = new URL("../../components/scheduler/NewPostComposer.tsx", import.meta.url);

test("composer uses an explicit client submit handler for preview creation", () => {
  const source = readFileSync(composerPath, "utf8");

  assert.match(source, /onSubmit=/);
  assert.match(source, /preventDefault\(\)/);
  assert.match(source, /new FormData/);
  assert.doesNotMatch(source, /<form action=\{submit\}/);
});
