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

// Mutation target: replacing the serial loop with unbounded Promise.all must allow unlimited concurrent uploads.
test("composer uploads selected files serially with per-file error context", () => {
  const source = readFileSync(composerPath, "utf8");

  assert.match(source, /for \(const file of files\)/);
  assert.doesNotMatch(source, /Promise\.all\([^)]*files/);
  assert.match(source, /`Unable to upload \$\{file\.name\}: \$\{reason\}`/);
});
