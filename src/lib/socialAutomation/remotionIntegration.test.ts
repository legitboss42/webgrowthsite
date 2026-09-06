import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootSource = fs.readFileSync(path.join(process.cwd(), "src/remotion/Root.tsx"), "utf8");
const metaPath = path.join(process.cwd(), "src/remotion/components/WebGrowthArticleVideo.tsx");
const tiktokPath = path.join(process.cwd(), "src/remotion/components/TikTokArticleVideo.tsx");
const articleRenderPath = path.join(process.cwd(), "scripts/render-article-video.mjs");
const socialRenderPath = path.join(process.cwd(), "scripts/render-social-article.mjs");

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

test("social renderer synthesizes a separate neutral TikTok voice track and output", () => {
  assert.equal(fs.existsSync(socialRenderPath), true);
  const source = fs.readFileSync(socialRenderPath, "utf8");
  assert.match(source, /NEUTRAL_TIKTOK_ENDING\s*=\s*"Save this idea for later\."/);
  assert.match(source, /tiktokVoiceName/);
  assert.match(source, /WebGrowthSocialTikTok/);
  assert.match(source, /tiktok\.mp4/);
  assert.match(source, /meta\.mp4/);
  assert.match(source, /caption:\s*""/);
  assert.match(source, /hashtags:\s*\[\]/);
});

test("Meta renderer treats per-article screenshot assets as optional", () => {
  const componentSource = fs.readFileSync(metaPath, "utf8");
  const rendererSource = fs.readFileSync(articleRenderPath, "utf8");
  assert.match(componentSource, /articleAssetsAvailable\??:\s*boolean/);
  assert.match(componentSource, /articleAssetsAvailable\s*&&\s*slug/);
  assert.match(rendererSource, /articleAssetsAvailable/);
  assert.match(rendererSource, /fs\.access/);
});
