import test from "node:test";
import assert from "node:assert/strict";

import { detectAddedBlogPaths } from "./gitDiff";

test("selects only newly added publishable blog Markdown files", () => {
  const input = [
    "A\tcontent/blog/new-guide.md",
    "M\tcontent/blog/existing-guide.md",
    "R100\tcontent/blog/old.md\tcontent/blog/renamed.md",
    "D\tcontent/blog/deleted.md",
    "A\tcontent/blog/_article-template.md",
    "A\tcontent/blog/new-guide-image-prompts.md",
    "A\tsrc/app/page.tsx",
  ].join("\n");

  assert.deepEqual(detectAddedBlogPaths(input), ["content/blog/new-guide.md"]);
});
