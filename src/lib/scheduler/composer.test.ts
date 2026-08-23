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

// Mutation target: removing the multiple attribute or reading only one FormData value must silently discard selected files.
test("composer accepts and reads multiple media files", () => {
  const source = readFileSync(composerPath, "utf8");

  assert.match(source, /<input[^>]*name="media"[^>]*multiple/);
  assert.match(source, /formData\.getAll\("media"\)/);
});

// UI-only contract: executable ordering/error behavior lives in composerFlow.test.ts.
test("composer delegates multiple media behavior to the tested flow orchestrator", () => {
  const source = readFileSync(composerPath, "utf8");

  assert.match(source, /runMediaPostComposer/);
});
