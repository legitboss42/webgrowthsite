import type { SocialRenderProfile } from "./types";

export const KINETIC_VIDEO_FPS = 30;
export const KINETIC_MIN_SECONDS = 12;
export const KINETIC_MAX_SECONDS = 18;

export type KineticAudioMode = "none" | "voice" | "soundtrack";
export type KineticBeatRole =
  | "hook"
  | "problem"
  | "insight"
  | "action"
  | "takeaway"
  | "ending";

export type KineticArticleSource = {
  slug: string;
  title: string;
  excerpt?: string;
  primaryKeyword?: string;
  category?: string;
  tags?: string[];
  keyTakeaways?: string[];
  steps?: string[];
  commonMistakes?: string[];
  prose?: string;
};

export type KineticVideoBeat = {
  role: KineticBeatRole;
  label: string;
  text: string;
  highlight: string;
  startFrame: number;
  endFrame: number;
  revealFrames: number;
  holdFrames: number;
};

export type KineticBranding = {
  name: string;
  tagline: string;
  url: string;
};

export type KineticVideoProps = {
  title: string;
  slug: string;
  profile: SocialRenderProfile;
  audioMode: KineticAudioMode;
  audioSrc?: string;
  beats: KineticVideoBeat[];
  branding: KineticBranding | null;
  caption: string;
  hashtags: string[];
  subtitles: [];
  durationInSeconds: number;
  durationInFrames: number;
  previewMode?: boolean;
};

const PROMOTIONAL_PATTERN =
  /\b(?:web\s*growth|webgrowth\.info|read (?:the )?(?:full )?guide|visit (?:our|the) (?:site|website))\b/gi;

function normalize(value: unknown) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function words(value: string) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function sentence(value: string) {
  const clean = normalize(value).replace(/^[-:;,]+|[-:;,]+$/g, "").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function shorten(value: string, maximumWords = 12) {
  const clean = sentence(value);
  const tokens = words(clean);
  if (tokens.length <= maximumWords) return clean;
  const clipped = tokens.slice(0, maximumWords);
  while (clipped.length > 3 && /^(?:and|or|to|what|the|a|an|of|for|with)[,.!?]*$/i.test(clipped.at(-1) || "")) {
    clipped.pop();
  }
  return `${clipped.join(" ").replace(/[,.!?]+$/, "")}.`;
}

function firstUseful(values: Array<unknown>, fallback: string) {
  for (const value of values) {
    const clean = normalize(value);
    if (words(clean).length >= 3) return clean;
  }
  return fallback;
}

function proseSentences(prose: string) {
  return normalize(prose)
    .split(/(?<=[.!?])\s+/)
    .map((value) => normalize(value))
    .filter((value) => words(value).length >= 4);
}

function hookFromTitle(title: string, primaryKeyword: string) {
  const cleanTitle = normalize(title).replace(/,?\s+and what to .+$/i, "");
  if (/^why\s+/i.test(cleanTitle)) {
    const subject = cleanTitle.replace(/^why\s+/i, "").replace(/\bis not\b/i, "isn't");
    return shorten(`${subject}? Start with the hidden friction.`, 11);
  }
  if (/^how to\s+/i.test(cleanTitle)) {
    return shorten(`${cleanTitle.replace(/^how to\s+/i, "")} starts with one decision.`, 11);
  }
  return shorten(firstUseful([cleanTitle, primaryKeyword], "One small fix changes the result."), 11);
}

function problemFromSource(article: KineticArticleSource, prose: string[]) {
  const mistake = firstUseful(
    [article.commonMistakes?.[0], article.excerpt, prose[1], prose[0]],
    "The visible symptom is rarely the whole problem."
  )
    .replace(/^using\s+/i, "Using ")
    .replace(/^failing to\s+/i, "Failing to ");
  return shorten(mistake, 12);
}

function insightFromSource(article: KineticArticleSource, prose: string[]) {
  const normalizedTitle = normalize(article.title).replace(/[.!?]+$/, "").toLowerCase();
  const articleSentences = prose.filter(
    (sentence) => normalize(sentence).replace(/[.!?]+$/, "").toLowerCase() !== normalizedTitle
  );
  return shorten(
    firstUseful(
      [
        articleSentences[0],
        article.keyTakeaways?.[0],
        articleSentences.find((value) => /\b(?:issue|because|often|instead|rather)\b/i.test(value)),
      ],
      "The useful signal is hiding beneath the surface."
    ),
    12
  );
}

function actionFromSource(article: KineticArticleSource) {
  const step = firstUseful(
    [article.steps?.[0], article.keyTakeaways?.[1]],
    "Fix the clearest source of friction first."
  );
  return shorten(step.replace(/^check\s+/i, "Start by checking ").replace(/^review\s+/i, "Start by reviewing "), 12);
}

function takeawayFromSource(article: KineticArticleSource) {
  return shorten(
    firstUseful(
      [article.keyTakeaways?.[2], article.keyTakeaways?.[1], article.steps?.[1]],
      "A focused diagnosis makes the next decision easier."
    ),
    12
  );
}

function neutralize(value: string) {
  const clean = normalize(value).replace(PROMOTIONAL_PATTERN, "").replace(/\s+/g, " ").trim();
  return shorten(clean, 12) || "Keep the useful idea, then test it yourself.";
}

function highlightFor(text: string) {
  const tokens = words(text).map((token) => token.replace(/^[^a-z0-9]+/gi, ""));
  return tokens.slice(Math.max(0, tokens.length - 3)).join(" ");
}

function beatDurationFrames(text: string, role: KineticBeatRole) {
  const wordCount = words(text).length;
  const revealSeconds = text.length / (role === "hook" ? 25 : 29);
  const holdSeconds = role === "ending" ? 1.7 : 0.8 + wordCount * 0.075;
  const minimum = role === "hook" ? 1.9 : role === "ending" ? 2.25 : 2;
  const maximum = role === "hook" ? 2.6 : role === "ending" ? 2.8 : 3;
  return Math.round(Math.min(maximum, Math.max(minimum, revealSeconds + holdSeconds)) * KINETIC_VIDEO_FPS);
}

function buildTimedBeats(
  source: Array<Pick<KineticVideoBeat, "role" | "label" | "text">>
): KineticVideoBeat[] {
  let cursor = 0;
  const beats = source.map((beat) => {
    const durationFrames = beatDurationFrames(beat.text, beat.role);
    const revealFrames = Math.min(
      durationFrames - Math.round(KINETIC_VIDEO_FPS * 0.65),
      Math.max(12, Math.round((beat.text.length / (beat.role === "hook" ? 25 : 29)) * KINETIC_VIDEO_FPS))
    );
    const timed: KineticVideoBeat = {
      ...beat,
      highlight: highlightFor(beat.text),
      startFrame: cursor,
      endFrame: cursor + durationFrames,
      revealFrames,
      holdFrames: durationFrames - revealFrames,
    };
    cursor = timed.endFrame;
    return timed;
  });

  const minimumFrames = KINETIC_MIN_SECONDS * KINETIC_VIDEO_FPS;
  if (cursor < minimumFrames) {
    extendLastBeat(beats, minimumFrames - cursor);
  }
  return beats;
}

function extendLastBeat(beats: KineticVideoBeat[], extension: number) {
  const last = beats.at(-1);
  if (!last || extension <= 0) return;
  last.endFrame += extension;
  last.holdFrames += extension;
}

function hashtags(article: KineticArticleSource) {
  const seen = new Set<string>();
  return [article.primaryKeyword, article.category, ...(article.tags || [])]
    .map((value) => normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean)
    .map((value) => `#${value}`)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 5);
}

export function buildKineticVideoProps(
  article: KineticArticleSource,
  profile: SocialRenderProfile
): KineticVideoProps {
  const prose = proseSentences(article.prose || "");
  const raw = [
    { role: "hook" as const, label: "Notice this", text: hookFromTitle(article.title, article.primaryKeyword || "") },
    { role: "problem" as const, label: "The problem", text: problemFromSource(article, prose) },
    { role: "insight" as const, label: "What is happening", text: insightFromSource(article, prose) },
    { role: "action" as const, label: "Do this first", text: actionFromSource(article) },
    { role: "takeaway" as const, label: "The takeaway", text: takeawayFromSource(article) },
    {
      role: "ending" as const,
      label: profile === "META" ? "Keep learning" : "Keep this",
      text: profile === "META" ? "Read the guide on webgrowth.info." : "Save this idea for later.",
    },
  ];
  const safe = profile === "TIKTOK"
    ? raw.map((beat) => ({ ...beat, text: beat.role === "ending" ? beat.text : neutralize(beat.text) }))
    : raw;
  const beats = buildTimedBeats(safe);
  const timedFrames = beats.at(-1)?.endFrame ?? KINETIC_MIN_SECONDS * KINETIC_VIDEO_FPS;
  const durationInSeconds = Number((timedFrames / KINETIC_VIDEO_FPS).toFixed(3));
  const durationInFrames = Math.ceil(durationInSeconds * KINETIC_VIDEO_FPS);
  extendLastBeat(beats, durationInFrames - timedFrames);

  if (durationInSeconds > KINETIC_MAX_SECONDS) {
    throw new Error("Kinetic video timing exceeded the configured short-form maximum.");
  }

  return {
    title: beats[0]?.text || shorten(article.title, 11),
    slug: normalize(article.slug),
    profile,
    audioMode: "none",
    beats,
    branding:
      profile === "META"
        ? { name: "WEB GROWTH", tagline: "Build. Grow. Monetize.", url: "webgrowth.info" }
        : null,
    caption: profile === "META" ? "Read the full guide on webgrowth.info." : "",
    hashtags: profile === "META" ? hashtags(article) : [],
    subtitles: [],
    durationInSeconds,
    durationInFrames,
  };
}
