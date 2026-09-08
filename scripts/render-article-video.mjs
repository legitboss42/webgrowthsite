import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";

import { buildKineticVideoProps } from "../src/lib/socialAutomation/kineticVideo.ts";

const slug = String(process.argv[2] || "").trim();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Provide a safe existing blog slug.");
  process.exit(1);
}

const root = process.cwd();
const blogPath = path.join(root, "content", "blog", `${slug}.md`);
const remotionDir = path.join(root, "out", "remotion");
const propsPath = path.join(remotionDir, "article-video-props.json");
const archivedPropsPath = path.join(remotionDir, `${slug}.article-video-props.json`);
const videoPath = path.join(root, "out", `${slug}.mp4`);

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

function articleSource(data, content) {
  return {
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
}

const markdown = await fs.readFile(blogPath, "utf8");
const { data, content } = matter(markdown);
const props = buildKineticVideoProps(articleSource(data, content), "META");

await fs.mkdir(remotionDir, { recursive: true });
await fs.mkdir(path.dirname(videoPath), { recursive: true });
await Promise.all([
  fs.writeFile(propsPath, JSON.stringify(props, null, 2)),
  fs.writeFile(archivedPropsPath, JSON.stringify(props, null, 2)),
]);

console.log(`[article-render] Rendering deterministic no-voice video for ${slug}`);
await run("npx", ["remotion", "render", "src/remotion/index.ts", "WebGrowthArticleVideo", path.relative(root, videoPath), "--props", path.relative(root, propsPath), "--codec", "h264", "--pixel-format", "yuv420p", "--muted", "--concurrency", "4"]);
console.log(`[article-render] Done: ${videoPath}`);
