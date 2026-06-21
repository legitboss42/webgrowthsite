import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";
import { EdgeTTS, createSRT, createVTT } from "edge-tts-universal";

const VIDEO_FPS = 30;
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const AUDIO_END_PADDING_SECONDS = 1;

const TTS_VOICE = "en-US-BrianMultilingualNeural";
const TTS_RATE = "-8%";
const TTS_VOLUME = "+0%";
const TTS_PITCH = "+0Hz";

const slug = process.argv[2];

if (!slug) {
  console.error("Missing article slug.");
  console.error("Example: node scripts/render-article-video.mjs 01-why-we-rebuilt-not-redesigned");
  process.exit(1);
}

const root = process.cwd();
const blogPath = path.join(root, "content", "blog", `${slug}.md`);
const outDir = path.join(root, "out", "remotion");
const publicDir = path.join(root, "public");
const publicAudioPath = path.join(publicDir, "article-voice.mp3");
const archivedAudioPath = path.join(outDir, `${slug}.mp3`);
const videoPath = path.join(root, "out", `${slug}.mp4`);
const videoOutputArg = path.join("out", `${slug}.mp4`);
const propsPath = path.join(outDir, "article-video-props.json");
const archivedPropsPath = path.join(outDir, `${slug}.article-video-props.json`);
const srtPath = path.join(outDir, "article-voice.srt");
const archivedSrtPath = path.join(outDir, `${slug}.srt`);
const vttPath = path.join(outDir, "article-voice.vtt");
const archivedVttPath = path.join(outDir, `${slug}.vtt`);

function clipText(value, maxLength) {
  const trimmed = String(value || "").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function toArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function firstAvailable(...values) {
  return values.find((value) => typeof value === "string" && value.trim().length)?.trim() || "";
}

function run(command, args) {
  const quoteArg = (value) =>
    /\s/.test(value) ? `"${String(value).replace(/"/g, '\\"')}"` : value;
  const commandLine = [command, ...args].map(quoteArg).join(" ");

  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
            cwd: root,
            stdio: "inherit",
          })
        : spawn(command, args, {
            cwd: root,
            shell: false,
            stdio: "inherit",
          });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandLine} failed with code ${code}`));
    });
  });
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/^---[\s\S]*?---/, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/`{1,3}[^`]+`{1,3}/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function extractArticleSentences(content) {
  const prose = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "---")
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("!["))
    .filter((line) => !line.startsWith("[LEAD|"))
    .filter((line) => !/^\d+\.\s/.test(line))
    .filter((line) => !/^[-*+]\s/.test(line))
    .join(" ");

  return stripMarkdown(prose)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .map((sentence) => sentence.replace(/^["'([{]+|[)\]}"']+$/g, "").trim())
    .filter((sentence) => sentence.length >= 24)
    .filter((sentence) => !sentence.startsWith("LEAD|"));
}

function normalizeSpacing(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function toSentence(value) {
  const trimmed = normalizeSpacing(
    String(value || "")
      .replace(/^Apply:\s*/i, "")
      .replace(/^Avoid:\s*/i, "Avoid ")
      .replace(/^The term\s+/i, "")
      .replace(/\s*[:;]\s*/g, ". ")
  );

  if (!trimmed) return "";

  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function simplifyForSpeech(value) {
  return toSentence(value)
    .replace(/\butilize\b/gi, "use")
    .replace(/\btherefore\b/gi, "so")
    .replace(/\bhowever\b/gi, "but")
    .replace(/\bprior to\b/gi, "before")
    .replace(/\bapproximately\b/gi, "about")
    .replace(/\bconversion path\b/gi, "path to action")
    .replace(/\buser experience\b/gi, "experience")
    .replace(/\bcosmetic redesign\b/gi, "visual refresh")
    .replace(/\bwebsite strategy\b/gi, "website plan")
    .replace(/^The problem is not /i, "The problem wasn't ")
    .replace(
      /^If the answer to most of these was no, the project became a rebuild\.$/i,
      "When the answer kept coming back no, this stopped being a redesign job."
    )
    .replace(
      /^For this project, the honest answer was no on almost every line\.$/i,
      "For this project, the honest answer was no almost everywhere."
    )
    .replace(
      /^It was a systems rebuild across five layers\.$/i,
      "This turned into a full systems rebuild."
    );
}

function toSpokenLine(value, fallback) {
  const sentence = simplifyForSpeech(value || fallback);
  return clipText(sentence, 140);
}

function findSentence(sentences, patterns, fallback) {
  const match = sentences.find((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  );

  return match || fallback;
}

function buildHook(post, sentences) {
  const title = String(post.title || "").toLowerCase();
  const keyword = String(post.primaryKeyword || "").toLowerCase();

  if (title.includes("rebuilt") || title.includes("redesigned")) {
    return "The website looked good. That wasn't the problem.";
  }

  if (keyword.includes("seo") || title.includes("seo")) {
    return "Most SEO problems start before Google ever sees the page.";
  }

  if (keyword.includes("landing page") || title.includes("landing page")) {
    return "A landing page is not a pretty flyer. It has one job.";
  }

  if (keyword.includes("conversion") || title.includes("conversion")) {
    return "More traffic will not fix a page that cannot convert.";
  }

  if (keyword.includes("website") || title.includes("website")) {
    return "Most websites do not need a redesign. They need a better plan.";
  }

  return firstAvailable(
    sentences[0],
    `Most people get ${post.primaryKeyword || "their website strategy"} wrong.`
  );
}

function buildHashtags(post) {
  const candidates = [
    post.primaryKeyword,
    post.category,
    post.topic,
    ...(post.tags || []).slice(0, 3),
    "web growth",
  ];

  const hashtags = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const normalized = String(candidate || "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .toLowerCase();

    if (!normalized) continue;

    const tag = `#${normalized.replace(/\s+/g, "")}`;
    if (seen.has(tag)) continue;

    seen.add(tag);
    hashtags.push(tag);

    if (hashtags.length === 6) break;
  }

  return hashtags;
}

function splitIntoShortLines(value) {
  const sentence = normalizeSpacing(value);
  if (!sentence) return [];

  const hardSplits = sentence
    .replace(/\bbut\b/gi, ". But")
    .replace(/\bso\b/gi, ". So")
    .replace(/\bbecause\b/gi, ". Because")
    .replace(/\bthen\b/gi, ". Then")
    .split(/(?<=[.!?])\s+/)
    .map((line) => normalizeSpacing(line))
    .filter(Boolean);

  const result = [];

  for (const line of hardSplits) {
    const words = line.split(/\s+/);

    if (words.length <= 12) {
      result.push(line);
      continue;
    }

    for (let index = 0; index < words.length; index += 10) {
      const chunk = words.slice(index, index + 10).join(" ");
      result.push(toSentence(chunk));
    }
  }

  return result;
}

function makeScene(kicker, spokenLines, onScreenText, visualDirection) {
  const cleanedLines = spokenLines
    .flatMap((line) => splitIntoShortLines(line))
    .map((line) => clipText(line, 120))
    .filter(Boolean)
    .slice(0, 3);

  const safeLines = cleanedLines.length ? cleanedLines : ["This is where the strategy changed."];

  const narration = safeLines.join(" ");
  const estimatedDuration = estimateSpeechDuration(narration);

  return {
    kicker,
    spokenLines: safeLines,
    narration,
    onScreenText: clipText(onScreenText, 72),
    visualDirection,
    durationInSeconds: Number(estimatedDuration.toFixed(3)),
  };
}

function buildVideoScript(post, content) {
  const sentences = extractArticleSentences(content);
  const commonMistakes = toArray(post.commonMistakes);
  const steps = toArray(post.steps);
  const keyTakeaways = toArray(post.keyTakeaways);
  const hashtags = buildHashtags(post);

  const hookLine = toSpokenLine(
    buildHook(post, sentences),
    "The website looked good. That wasn't the problem."
  );

  const problemLine = toSpokenLine(
    findSentence(
      sentences,
      [/leaking revenue/i, /under the surface/i, /real issue/i, /problem is not/i],
      firstAvailable(
        commonMistakes[0] ? `The mistake was ${commonMistakes[0].toLowerCase()}` : "",
        post.excerpt,
        "The real problem was underneath the design."
      )
    ),
    "The real problem was underneath the design."
  );

  const decisionLine = toSpokenLine(
    findSentence(
      sentences,
      [/not a redesign/i, /that made the decision simple/i, /\ba rebuild\b/i],
      firstAvailable(
        "That made the decision simple. Not a redesign. A rebuild.",
        keyTakeaways[0],
        "Not a redesign. A rebuild."
      )
    ),
    "Not a redesign. A rebuild."
  );

  const fixLine = toSpokenLine(
    findSentence(
      sentences,
      [/reduces decision friction/i, /systems rebuild/i, /strategy layer/i, /it was a systems rebuild/i],
      firstAvailable(
        steps[0],
        keyTakeaways[1],
        "We fixed the structure, the message, and the next step first."
      )
    ),
    "We fixed the structure, the message, and the next step first."
  );

  const proofLine = toSpokenLine(
    findSentence(
      sentences,
      [/sales asset/i, /business outcomes/i, /qualified enquiries/i, /conversion is what turns/i],
      firstAvailable(
        keyTakeaways[2],
        "That is what turns a website into a sales asset."
      )
    ),
    "That is what turns a website into a sales asset."
  );

  const ctaLine = "Want the full breakdown? Read the guide on Web Growth.";

  const scenes = [
    makeScene(
      "Hook",
      [hookLine, "That changed the whole project."],
      hookLine,
      "Bold hook scene with premium motion."
    ),
    makeScene(
      "Problem",
      ["At first glance, the site looked fine.", problemLine],
      "The real problem was underneath.",
      "Funnel problem scene with drop-off motion."
    ),
    makeScene(
      "Decision",
      [decisionLine],
      "This needed a rebuild, not a refresh.",
      "Blueprint and decision cards scene."
    ),
    makeScene(
      "Fix",
      [fixLine],
      "The message came first.",
      "Strategy cards scene with message, structure, proof, and CTA."
    ),
    makeScene(
      "Why it worked",
      [proofLine],
      "Strategy gave the design a job to do.",
      "Before and after scene with proof highlights."
    ),
    makeScene(
      "Read more",
      [ctaLine],
      "Read the full guide on webgrowth.info",
      "CTA scene with Web Growth branding."
    ),
  ];

  return {
    title: clipText(hookLine, 88),
    caption: [
      clipText(hookLine, 110),
      "Read the full guide on webgrowth.info.",
      hashtags.join(" "),
    ]
      .filter(Boolean)
      .join("\n"),
    hashtags,
    scenes,
  };
}

function subtitleTimeToSeconds(value) {
  const match = value.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;

  const [, hours, minutes, seconds, milliseconds] = match;

  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(milliseconds) / 1000
  );
}

function parseSrtToSubtitles(srt) {
  return srt
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\r?\n/).filter(Boolean);
      const timingLine = lines.find((line) => line.includes("-->"));

      if (!timingLine) return null;

      const [startRaw, endRaw] = timingLine.split("-->").map((item) => item.trim());
      const text = lines
        .filter((line) => !line.includes("-->") && !/^\d+$/.test(line.trim()))
        .join(" ")
        .trim();

      if (!text) return null;

      return {
        start: subtitleTimeToSeconds(startRaw),
        end: subtitleTimeToSeconds(endRaw),
        text,
      };
    })
    .filter(Boolean);
}

function tokenizeForTiming(value) {
  return normalizeSpacing(value)
    .replace(/[.,!?;:()[\]"]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function estimateSpeechDuration(text) {
  const words = tokenizeForTiming(text).length;
  return Math.max(1.4, words / 2.6);
}

function applySubtitleTimingToScenes(scenes, subtitles) {
  if (!subtitles.length) {
    let cursor = 0;

    return scenes.map((scene) => {
      const durationInSeconds = estimateSpeechDuration(scene.narration);
      const startTimeInSeconds = cursor;
      const endTimeInSeconds = startTimeInSeconds + durationInSeconds;
      cursor = endTimeInSeconds;

      return {
        ...scene,
        startTimeInSeconds,
        endTimeInSeconds,
        durationInSeconds,
      };
    });
  }

  const matchedRanges = [];
  let cueIndex = 0;

  for (const scene of scenes) {
    const tokenCount = Math.max(1, tokenizeForTiming(scene.narration).length);
    const matched = subtitles.slice(cueIndex, cueIndex + tokenCount);
    cueIndex += matched.length;

    matchedRanges.push({
      scene,
      start: matched[0]?.start ?? null,
      end: matched[matched.length - 1]?.end ?? null,
    });
  }

  return matchedRanges.map((entry, index) => {
    const startTimeInSeconds =
      index === 0 ? 0 : entry.start ?? matchedRanges[index - 1].end ?? 0;
    const nextStart = matchedRanges[index + 1]?.start ?? null;
    const fallbackEnd =
      entry.end ?? startTimeInSeconds + estimateSpeechDuration(entry.scene.narration);
    const endTimeInSeconds = Math.max(
      fallbackEnd,
      nextStart ?? fallbackEnd,
      startTimeInSeconds + 0.8
    );

    return {
      ...entry.scene,
      startTimeInSeconds,
      endTimeInSeconds,
      durationInSeconds: Number((endTimeInSeconds - startTimeInSeconds).toFixed(3)),
    };
  });
}

async function main() {
  const markdown = await fs.readFile(blogPath, "utf8");
  const { data, content } = matter(markdown);

  const script = buildVideoScript(data, content);
  const narration = script.scenes.map((scene) => scene.narration).join(" ");

  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });

  console.log("Generating voice...");
  const tts = new EdgeTTS(narration, TTS_VOICE, {
    rate: TTS_RATE,
    volume: TTS_VOLUME,
    pitch: TTS_PITCH,
  });

  const result = await tts.synthesize();
  const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
  const srt = createSRT(result.subtitle);
  const vtt = createVTT(result.subtitle);
  const subtitles = parseSrtToSubtitles(srt);
  const scenes = applySubtitleTimingToScenes(script.scenes, subtitles);
  const lastSubtitleEnd = subtitles.reduce((max, cue) => Math.max(max, cue.end), 0);
  const durationInSeconds = Number(
    Math.max(
      lastSubtitleEnd + AUDIO_END_PADDING_SECONDS,
      scenes[scenes.length - 1]?.endTimeInSeconds ?? 0,
      1
    ).toFixed(3)
  );

  const props = {
    ...script,
    audioSrc: "article-voice.mp3",
    durationInSeconds,
    durationInFrames: Math.ceil(durationInSeconds * VIDEO_FPS),
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    slug,
    scenes,
    subtitles,
  };

  await fs.writeFile(publicAudioPath, audioBuffer);
  await fs.writeFile(archivedAudioPath, audioBuffer);
  await fs.writeFile(srtPath, srt);
  await fs.writeFile(archivedSrtPath, srt);
  await fs.writeFile(vttPath, vtt);
  await fs.writeFile(archivedVttPath, vtt);
  await fs.writeFile(propsPath, JSON.stringify(props, null, 2));
  await fs.writeFile(archivedPropsPath, JSON.stringify(props, null, 2));

  console.log("Video script:");
  for (const scene of scenes) {
    console.log(`- ${scene.kicker}: ${scene.narration}`);
  }

  console.log("Rendering video...");
  await run("npx", [
    "remotion",
    "render",
    "src/remotion/index.ts",
    "WebGrowthArticleVideo",
    videoOutputArg,
    "--props",
    "out/remotion/article-video-props.json",
  ]);

  console.log(`Done: ${videoPath}`);
}

await main();