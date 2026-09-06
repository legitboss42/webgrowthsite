import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootSource = fs.readFileSync(path.join(process.cwd(), "src/remotion/Root.tsx"), "utf8");
const tiktokPath = path.join(process.cwd(), "src/remotion/components/TikTokArticleVideo.tsx");

test("registers dedicated Meta and TikTok social compositions", () => {
  assert.match(rootSource, /id="WebGrowthSocialMeta"/);
  assert.match(rootSource, /id="WebGrowthSocialTikTok"/);
  assert.match(rootSource, /TikTokArticleVideo/);
});

test("TikTok composition source contains no promotional Web Growth overlay", () => {
  assert.equal(fs.existsSync(tiktokPath), true);
  const source = fs.readFileSync(tiktokPath, "utf8");
  assert.doesNotMatch(source, /webgrowth\.info/i);
  assert.doesNotMatch(source, /WEB GROWTH/);
  assert.doesNotMatch(source, /MrWebGrowth/);
});
