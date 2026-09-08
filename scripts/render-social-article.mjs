import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";

import { buildKineticVideoProps } from "../src/lib/socialAutomation/kineticVideo.ts";

const FPS = 30;
const slug = String(process.argv[2] || "").trim();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Provide a safe blog slug, for example: npm run social:render -- seo-checklist");
  process.exit(1);
}

const root = process.cwd();
const socialDir = path.join(root, "out", "social", slug);
const remotionDir = path.join(root, "out", "remotion");
const blogPath = path.join(root, "content", "blog", `${slug}.md`);
const metaVideo = path.join(socialDir, "meta.mp4");
const tiktokVideo = path.join(socialDir, "tiktok.mp4");
const legacyMetaVideo = path.join(root, "out", `${slug}.mp4`);
const metaPropsPath = path.join(remotionDir, `${slug}.meta-social-props.json`);
const tiktokPropsPath = path.join(remotionDir, `${slug}.tiktok-social-props.json`);
const generatedPropsPath = path.join(remotionDir, "article-video-props.json");
const manifestPath = path.join(socialDir, "manifest.json");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`)));
  });
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

const markdown = await fs.readFile(blogPath, "utf8");
const { data, content } = matter(markdown);
const article = {
  slug,
  title: String(data.title || ""),
  excerpt: String(data.excerpt || ""),
  primaryKeyword: String(data.primaryKeyword || ""),
  category: String(data.category || ""),
  tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways.map(String) : [],
  steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
  commonMistakes: Array.isArray(data.commonMistakes) ? data.commonMistakes.map(String) : [],
  prose: stripMarkdown(content),
};
const metaProps = buildKineticVideoProps(article, "META");
const tiktokProps = buildKineticVideoProps(article, "TIKTOK");

await fs.mkdir(socialDir, { recursive: true });
await fs.mkdir(remotionDir, { recursive: true });
await Promise.all([
  fs.writeFile(metaPropsPath, JSON.stringify(metaProps, null, 2)),
  fs.writeFile(tiktokPropsPath, JSON.stringify(tiktokProps, null, 2)),
  fs.writeFile(generatedPropsPath, JSON.stringify(metaProps, null, 2)),
]);

for (const [composition, output, propsPath] of [
  ["WebGrowthSocialMeta", metaVideo, metaPropsPath],
  ["WebGrowthSocialTikTok", tiktokVideo, tiktokPropsPath],
]) {
  console.log(`[social-render] Rendering ${composition} for ${slug}`);
  await run("npx", ["remotion", "render", "src/remotion/index.ts", composition, path.relative(root, output), "--props", path.relative(root, propsPath), "--codec", "h264", "--pixel-format", "yuv420p", "--muted", "--concurrency", "2"]);
}

await fs.copyFile(metaVideo, legacyMetaVideo);
const manifest = {
  version: 1,
  slug,
  generatedAt: new Date().toISOString(),
  width: 1080,
  height: 1920,
  fps: FPS,
  meta: { path: path.relative(root, metaVideo).replaceAll("\\", "/"), branded: true },
  tiktok: { path: path.relative(root, tiktokVideo).replaceAll("\\", "/"), branded: false, promotionalNarration: false },
};
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`[social-render] Meta: ${metaVideo}`);
console.log(`[social-render] TikTok: ${tiktokVideo}`);
console.log(`[social-render] Manifest: ${manifestPath}`);
