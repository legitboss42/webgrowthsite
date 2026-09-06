import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { EdgeTTS, createVTT } from "edge-tts-universal";

const FPS = 30;
const TTS_VOICE = "en-US-BrianMultilingualNeural";
const TTS_OPTIONS = { rate: "-8%", volume: "+0%", pitch: "+0Hz" };
const NEUTRAL_TIKTOK_ENDING = "Save this idea for later.";

const slug = String(process.argv[2] || "").trim();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Provide a safe blog slug, for example: node scripts/render-social-article.mjs seo-checklist");
  process.exit(1);
}

const root = process.cwd();
const socialDir = path.join(root, "out", "social", slug);
const remotionDir = path.join(root, "out", "remotion");
const generatedPropsPath = path.join(remotionDir, "article-video-props.json");
const legacyMetaVideo = path.join(root, "out", `${slug}.mp4`);
const metaVideo = path.join(socialDir, "meta.mp4");
const tiktokVideo = path.join(socialDir, "tiktok.mp4");
const publicVoiceDir = path.join(root, "public", "remotion-social");
const tiktokVoiceName = `remotion-social/${slug}-tiktok.mp3`;
const tiktokVoicePath = path.join(root, "public", tiktokVoiceName);
const tiktokPropsPath = path.join(remotionDir, `${slug}.tiktok-social-props.json`);
const manifestPath = path.join(socialDir, "manifest.json");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function timestampSeconds(value) {
  const match = String(value).match(/(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function parseVtt(vtt) {
  const cues = [];
  const blocks = String(vtt).replace(/\r/g, "").split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes(" --> "));
    if (timingIndex < 0) continue;
    const [startText, endText] = lines[timingIndex].split(" --> ");
    const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    cues.push({
      start: timestampSeconds(startText),
      end: timestampSeconds(endText.split(/\s+/)[0]),
      text,
    });
  }
  return cues.filter((cue) => cue.end > cue.start);
}

function neutralizeTikTokProps(baseProps, subtitles) {
  const scenes = Array.isArray(baseProps.scenes)
    ? baseProps.scenes.map((scene) => ({ ...scene, spokenLines: Array.isArray(scene.spokenLines) ? [...scene.spokenLines] : [] }))
    : [];
  if (scenes.length === 0) throw new Error("Generated article props contain no scenes.");

  const finalScene = scenes[scenes.length - 1];
  finalScene.kicker = "Keep this";
  finalScene.spokenLines = [NEUTRAL_TIKTOK_ENDING];
  finalScene.narration = NEUTRAL_TIKTOK_ENDING;
  finalScene.onScreenText = NEUTRAL_TIKTOK_ENDING;
  finalScene.visualDirection = "Neutral educational save-for-later ending without promotional overlays.";

  const subtitleEnd = subtitles.reduce((max, cue) => Math.max(max, cue.end), 0);
  const finalStart = Number(finalScene.startTimeInSeconds) || Math.max(0, subtitleEnd - 2);
  const finalEnd = Math.max(finalStart + 0.8, subtitleEnd + 0.55);
  finalScene.startTimeInSeconds = finalStart;
  finalScene.endTimeInSeconds = finalEnd;
  finalScene.durationInSeconds = finalEnd - finalStart;

  const durationInSeconds = Math.max(finalEnd + 0.5, subtitleEnd + 0.8, 1);
  return {
    ...baseProps,
    caption: "",
    hashtags: [],
    audioSrc: tiktokVoiceName,
    scenes,
    subtitles,
    durationInSeconds,
    durationInFrames: Math.ceil(durationInSeconds * FPS),
    slug,
  };
}

await fs.mkdir(socialDir, { recursive: true });
await fs.mkdir(remotionDir, { recursive: true });
await fs.mkdir(publicVoiceDir, { recursive: true });

console.log(`[social-render] Rendering branded Meta source for ${slug}`);
await run(process.execPath, ["scripts/render-article-video.mjs", slug]);
await fs.copyFile(legacyMetaVideo, metaVideo);

const baseProps = JSON.parse(await fs.readFile(generatedPropsPath, "utf8"));
const scenes = Array.isArray(baseProps.scenes) ? baseProps.scenes.map((scene) => ({ ...scene })) : [];
if (scenes.length === 0) throw new Error("Generated Meta props contain no scenes.");
scenes[scenes.length - 1] = {
  ...scenes[scenes.length - 1],
  kicker: "Keep this",
  spokenLines: [NEUTRAL_TIKTOK_ENDING],
  narration: NEUTRAL_TIKTOK_ENDING,
  onScreenText: NEUTRAL_TIKTOK_ENDING,
  visualDirection: "Neutral educational save-for-later ending without promotional overlays.",
};
const neutralNarration = scenes.map((scene) => String(scene.narration || "").trim()).filter(Boolean).join(" ");

console.log(`[social-render] Synthesizing neutral TikTok narration for ${slug}`);
const tts = new EdgeTTS(neutralNarration, TTS_VOICE, TTS_OPTIONS);
const speech = await tts.synthesize();
await fs.writeFile(tiktokVoicePath, Buffer.from(await speech.audio.arrayBuffer()));
const subtitles = parseVtt(createVTT(speech.subtitle));
if (subtitles.length === 0) throw new Error("TikTok voice synthesis returned no subtitle timing.");

const tiktokProps = neutralizeTikTokProps(baseProps, subtitles);
await fs.writeFile(tiktokPropsPath, JSON.stringify(tiktokProps, null, 2));

console.log(`[social-render] Rendering TikTok-safe video for ${slug}`);
await run("npx", [
  "remotion",
  "render",
  "src/remotion/index.ts",
  "WebGrowthSocialTikTok",
  path.relative(root, tiktokVideo),
  "--props",
  path.relative(root, tiktokPropsPath),
  "--codec",
  "h264",
  "--pixel-format",
  "yuv420p",
]);

const manifest = {
  version: 1,
  slug,
  generatedAt: new Date().toISOString(),
  width: 1080,
  height: 1920,
  fps: FPS,
  meta: { path: path.relative(root, metaVideo).replaceAll("\\", "/"), branded: true },
  tiktok: {
    path: path.relative(root, tiktokVideo).replaceAll("\\", "/"),
    branded: false,
    promotionalNarration: false,
  },
};
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`[social-render] Meta: ${metaVideo}`);
console.log(`[social-render] TikTok: ${tiktokVideo}`);
console.log(`[social-render] Manifest: ${manifestPath}`);
