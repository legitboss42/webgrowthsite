import path from "node:path";
import { execFileSync } from "node:child_process";

import { detectAddedBlogPaths } from "../src/lib/socialAutomation/gitDiff.ts";

const SAFE_SHA = /^[a-f0-9]{7,64}$/i;

let base = String(process.argv[2] || "").trim();
const head = String(process.argv[3] || "").trim();

if (!SAFE_SHA.test(head)) throw new Error("A valid head commit SHA is required.");

if (!base || /^0+$/.test(base)) {
  base = execFileSync("git", ["rev-parse", `${head}^`], {
    encoding: "utf8",
  }).trim();
}
if (!SAFE_SHA.test(base)) throw new Error("A valid base commit SHA is required.");

const nameStatus = execFileSync(
  "git",
  ["diff", "--name-status", base, head, "--", "content/blog"],
  { encoding: "utf8" }
);

for (const file of detectAddedBlogPaths(nameStatus)) {
  console.log(path.basename(file, ".md"));
}
