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

function buildHook(post: Post) {
  const category = String(post.category || "").toLowerCase();
  const keyword = String(post.primaryKeyword || "").toLowerCase();
  const title = String(post.title || "").toLowerCase();

  if (category.includes("case study") || title.includes("rebuilt")) {
    return "The website wasn't ugly. It just wasn't selling.";
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
      post.searchIntent,
      post.excerpt,
      post.commonMistakes[0],
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
    `CTA: Read the full guide on webgrowth.info`,
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