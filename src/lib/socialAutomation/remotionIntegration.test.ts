import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootSource = fs.readFileSync(path.join(process.cwd(), "src/remotion/Root.tsx"), "utf8");
const tiktokPath = path.join(process.cwd(), "src/remotion/components/TikTokArticleVideo.tsx");
const articleRenderPath = path.join(process.cwd(), "scripts/render-article-video.mjs");
const socialRenderPath = path.join(process.cwd(), "scripts/render-social-article.mjs");
const kineticPath = path.join(process.cwd(), "src/remotion/components/KineticArticleVideo.tsx");
const typewriterPath = path.join(process.cwd(), "src/remotion/components/KineticTypewriterText.tsx");
const backgroundPath = path.join(process.cwd(), "src/remotion/components/AtmosphericBackground.tsx");

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

test("social renderer defaults to deterministic no-voice Meta and TikTok output", () => {
  assert.equal(fs.existsSync(socialRenderPath), true);
  const source = fs.readFileSync(socialRenderPath, "utf8");
  assert.match(source, /WebGrowthSocialTikTok/);
  assert.match(source, /tiktok\.mp4/);
  assert.match(source, /meta\.mp4/);
  assert.match(source, /["']--muted["']/);
  assert.doesNotMatch(source, /new EdgeTTS/);
  assert.doesNotMatch(source, /createVTT/);
});

test("shared kinetic renderer is procedural, frame-driven, and conditionally renders audio", () => {
  assert.equal(fs.existsSync(kineticPath), true);
  assert.equal(fs.existsSync(typewriterPath), true);
  assert.equal(fs.existsSync(backgroundPath), true);
  const componentSource = fs.readFileSync(kineticPath, "utf8");
  const typewriterSource = fs.readFileSync(typewriterPath, "utf8");
  const rendererSource = fs.readFileSync(articleRenderPath, "utf8");
  assert.match(componentSource, /audioMode\s*!==\s*["']none["']/);
  assert.match(componentSource, /audioSrc/);
  assert.match(typewriterSource, /useCurrentFrame/);
  assert.doesNotMatch(typewriterSource, /setTimeout/);
  assert.doesNotMatch(rendererSource, /new EdgeTTS/);
});
