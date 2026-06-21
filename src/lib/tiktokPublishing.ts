import type { Post } from "@/lib/posts";

export type WorkflowBrief = {
  headline: string;
  caption: string;
  talkingPoints: string[];
  carouselSlides: string[];
  videoShots: string[];
  hashtags: string[];
  internalLinkCount: number;
};

export type TikTokPhotoSlide = {
  bodyLines: string[];
  eyebrow: string;
  footer: string;
  headline: string;
};

export type TikTokVideoScene = {
  durationInSeconds: number;
  kicker: string;
  narration: string;
  onScreenText: string;
  visualDirection: string;
  spokenLines?: string[];
  startTimeInSeconds?: number;
  endTimeInSeconds?: number;
};

export type TikTokVideoScript = {
  aspectRatio: "9:16";
  durationInSeconds: number;
  scenes: TikTokVideoScene[];
  title: string;
  caption: string;
  hashtags: string[];
};

function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function clipText(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) return trimmed;

  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function extractInternalLinkCount(content: string) {
  const matches = content.match(/\]\((\/(?!images\/|resources\/))/g);
  return matches?.length || 0;
}

function firstAvailable(...values: Array<string | undefined | null>) {
  return values.find((value) => typeof value === "string" && value.trim().length)?.trim() || "";
}

function toSentence(value: string) {
  const trimmed = value
    .trim()
    .replace(/^Apply:\s*/i, "")
    .replace(/^Avoid:\s*/i, "Avoid ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s*[:;]\s*/g, ". ");

  if (!trimmed) return "";

  const sentence = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;

  return sentence
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

function stripMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/`{1,3}[^`]+`{1,3}/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\r/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function extractArticleSentences(content: string) {
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
    .filter((sentence) => sentence.length >= 24)
    .filter((sentence) => !sentence.startsWith("LEAD|"));
}

function findSentence(sentences: string[], patterns: RegExp[], fallback: string) {
  const match = sentences.find((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  );

  return match || fallback;
}

function buildHook(post: Post, sentences?: string[]) {
  const category = String(post.category || "").toLowerCase();
  const keyword = String(post.primaryKeyword || "").toLowerCase();
  const title = String(post.title || "").toLowerCase();

  if (category.includes("case study") || title.includes("rebuilt") || title.includes("redesigned")) {
    return findSentence(
      sentences || [],
      [/fail before design starts/i, /looked good/i, /not the problem/i],
      "The website looked good. That wasn't the problem."
    );
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
    return "Most websites don't need a redesign. They need a strategy.";
  }

  return `Most people get ${post.primaryKeyword || "their website strategy"} wrong.`;
}

function buildProblemLine(post: Post, fallback: string) {
  return clipText(
    firstAvailable(
      post.commonMistakes[0] ? `The mistake was ${post.commonMistakes[0].toLowerCase()}` : "",
      post.excerpt,
      fallback
    ),
    86
  );
}

function buildSolutionLine(post: Post, fallback: string) {
  return clipText(
    firstAvailable(
      post.keyTakeaways[0],
      post.steps[0],
      post.methodologyNote,
      post.evidenceNote,
      fallback
    ),
    86
  );
}

function buildSecondSolutionLine(post: Post, fallback: string) {
  return clipText(
    firstAvailable(
      post.keyTakeaways[1],
      post.steps[1],
      post.commonMistakes[0] ? `Avoid: ${post.commonMistakes[0]}` : "",
      fallback
    ),
    86
  );
}

export function buildHashtags(post: Post) {
  const candidates = [
    post.primaryKeyword,
    post.category,
    post.topic || "",
    ...post.tags.slice(0, 3),
    "web growth",
  ];

  const seen = new Set<string>();
  const hashtags: string[] = [];

  for (const candidate of candidates) {
    const normalized = candidate.replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
    if (!normalized) continue;

    const tag = `#${normalized.replace(/\s+/g, "")}`;
    if (seen.has(tag)) continue;

    seen.add(tag);
    hashtags.push(tag);

    if (hashtags.length === 6) break;
  }

  return hashtags;
}

export function buildTikTokWorkflowBrief(post: Post): WorkflowBrief {
  const supportPoints = [
    ...post.keyTakeaways,
    ...post.steps,
    ...post.commonMistakes.map((item) => `Avoid: ${item}`),
  ]
    .map((item) => sentenceCase(item))
    .filter(Boolean);

  const talkingPoints = supportPoints.slice(0, 4);
  const excerpt = clipText(post.excerpt, 180);
  const hashtags = buildHashtags(post);

  const caption = [
    clipText(buildHook(post), 110),
    talkingPoints[0] ? clipText(talkingPoints[0], 90) : null,
    "Read the full guide on webgrowth.info",
    hashtags.join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const carouselSlides = [
    buildHook(post),
    buildProblemLine(post, excerpt),
    buildSolutionLine(post, "Fix the message, structure, and next step first."),
    "Read the full guide on Web Growth",
  ].map((item) => clipText(item, 90));

  const videoShots = [
    `Hook: ${clipText(buildHook(post), 80)}`,
    `Problem: ${buildProblemLine(post, excerpt)}`,
    `Fix: ${buildSolutionLine(post, "Show the reader exactly what to do next.")}`,
    "CTA: Read the full guide on webgrowth.info",
  ];

  return {
    headline: clipText(buildHook(post), 80),
    caption,
    talkingPoints,
    carouselSlides,
    videoShots,
    hashtags,
    internalLinkCount: extractInternalLinkCount(post.content),
  };
}

export function buildTikTokPhotoSlides(post: Post) {
  const workflowBrief = buildTikTokWorkflowBrief(post);

  const problemLine = buildProblemLine(
    post,
    "The page looked fine, but it was not guiding visitors toward action."
  );

  const solutionLine = buildSolutionLine(
    post,
    "Fix the message, structure, and conversion path before changing visuals."
  );

  const secondSolutionLine = buildSecondSolutionLine(
    post,
    "Make the next step obvious, useful, and easy to take."
  );

  const proofLine = clipText(
    firstAvailable(
      post.methodologyNote,
      post.evidenceNote,
      post.steps[2],
      "A better website starts with the user journey, not decoration."
    ),
    86
  );

  const slides: TikTokPhotoSlide[] = [
    {
      eyebrow: "Website lesson",
      headline: clipText(buildHook(post), 74),
      bodyLines: [
        clipText("Before changing the design, check what the page is actually doing.", 88),
        clipText("Pretty pages still fail when the message is unclear.", 88),
      ],
      footer: "webgrowth.info",
    },
    {
      eyebrow: "The real problem",
      headline: clipText("Traffic was not the main issue.", 74),
      bodyLines: [
        problemLine,
        clipText("Visitors need direction, proof, and a clear reason to act.", 88),
      ],
      footer: "Slide 2 of 4",
    },
    {
      eyebrow: "The fix",
      headline: clipText("Strategy came before design.", 74),
      bodyLines: [solutionLine, secondSolutionLine],
      footer: "Slide 3 of 4",
    },
    {
      eyebrow: "Full breakdown",
      headline: clipText("Want the complete website strategy?", 74),
      bodyLines: [
        proofLine,
        clipText("Read the full guide on webgrowth.info", 88),
      ],
      footer: workflowBrief.hashtags.slice(0, 2).join(" ") || "Web Growth",
    },
  ];

  return slides;
}

export function buildTikTokPhotoDraftContent(post: Post) {
  const workflowBrief = buildTikTokWorkflowBrief(post);

  return {
    title: clipText(workflowBrief.headline, 88),
    description: clipText(workflowBrief.caption, 350),
    slides: buildTikTokPhotoSlides(post),
  };
}

function estimateSpeechDuration(text: string) {
  const words = toSentence(text)
    .replace(/[.,!?;:()[\]"]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1.5, words / 2.6);
}

export function buildTikTokVideoScript(post: Post): TikTokVideoScript {
  const workflowBrief = buildTikTokWorkflowBrief(post);
  const sentences = extractArticleSentences(post.content);

  const hookLine = toSentence(buildHook(post, sentences));
  const problemLine = toSentence(
    findSentence(
      sentences,
      [/leaking revenue/i, /under the surface/i, /real issue/i, /problem is not/i],
      firstAvailable(
        post.commonMistakes[0] ? `The mistake was ${post.commonMistakes[0].toLowerCase()}` : "",
        post.excerpt,
        "The real problem was underneath the design."
      )
    )
  );
  const rebuildLine = toSentence(
    findSentence(
      sentences,
      [/not a redesign/i, /that made the decision simple/i, /\ba rebuild\b/i],
      firstAvailable(
        "That made the decision simple. Not a redesign. A rebuild.",
        "Not a redesign. A rebuild.",
        post.keyTakeaways[0]
      )
    )
  );
  const strategyLine = toSentence(
    findSentence(
      sentences,
      [/reduces decision friction/i, /systems rebuild/i, /strategy layer/i, /it was a systems rebuild/i],
      firstAvailable(
        "We fixed the structure, the message, and the next step first.",
        post.keyTakeaways[1],
        "We fixed the message, the structure, and the next step first."
      )
    )
  );
  const proofLine = toSentence(
    findSentence(
      sentences,
      [/sales asset/i, /business outcomes/i, /qualified enquiries/i, /conversion is what turns/i],
      firstAvailable(
        "That is what turns a website into a sales asset.",
        post.keyTakeaways[2],
        "That is what turns a website into a sales asset."
      )
    )
  );
  const ctaLine = "If you want the full breakdown, read the guide on Web Growth.";

  const scenes: TikTokVideoScene[] = [
    {
      kicker: "Hook",
      spokenLines: [hookLine],
      narration: hookLine,
      onScreenText: clipText(hookLine, 72),
      visualDirection:
        "Dark premium background. Large bold text enters quickly. Subtle website wireframe moves behind the text.",
      durationInSeconds: estimateSpeechDuration(hookLine),
    },
    {
      kicker: "Problem",
      spokenLines: [problemLine],
      narration: problemLine,
      onScreenText: clipText("The real problem was underneath.", 72),
      visualDirection:
        "Show a simple funnel graphic with visitors dropping off before enquiry. Add slow zoom and warning accent.",
      durationInSeconds: estimateSpeechDuration(problemLine),
    },
    {
      kicker: "Decision",
      spokenLines: [rebuildLine],
      narration: rebuildLine,
      onScreenText: clipText("This needed a rebuild, not a refresh.", 72),
      visualDirection:
        "Animate three cards: Message, Structure, CTA. Cards lock into place like a website blueprint.",
      durationInSeconds: estimateSpeechDuration(rebuildLine),
    },
    {
      kicker: "Why it worked",
      spokenLines: [strategyLine, proofLine],
      narration: `${strategyLine} ${proofLine}`,
      onScreenText: clipText("Strategy gave the design a job to do.", 72),
      visualDirection:
        "Before and after layout blocks slide across the screen. Highlight proof, CTA, and service section.",
      durationInSeconds: estimateSpeechDuration(
        `${strategyLine} ${proofLine}`
      ),
    },
    {
      kicker: "CTA",
      spokenLines: [ctaLine],
      narration: ctaLine,
      onScreenText: "Read the full guide on webgrowth.info",
      visualDirection:
        "End card with Web Growth branding, domain, and a clean call to action.",
      durationInSeconds: estimateSpeechDuration(ctaLine),
    },
  ];

  return {
    aspectRatio: "9:16",
    durationInSeconds: scenes.reduce((total, scene) => total + scene.durationInSeconds, 0),
    scenes,
    title: clipText(workflowBrief.headline, 88),
    caption: clipText(workflowBrief.caption, 350),
    hashtags: workflowBrief.hashtags,
  };
}
