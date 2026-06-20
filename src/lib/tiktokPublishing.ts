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
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function extractInternalLinkCount(content: string) {
  const matches = content.match(/\]\((\/(?!images\/|resources\/))/g);
  return matches?.length || 0;
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
  const caption = [
    clipText(`${post.title}: ${excerpt}`, 190),
    talkingPoints[0] ? `1. ${clipText(talkingPoints[0], 70)}` : null,
    talkingPoints[1] ? `2. ${clipText(talkingPoints[1], 70)}` : null,
    "Read the full guide on webgrowth.info",
  ]
    .filter(Boolean)
    .join("\n");

  const carouselSlides = [
    post.title,
    post.searchIntent || `What ${post.primaryKeyword} actually needs`,
    ...talkingPoints.slice(0, 3),
    "Full checklist on Web Growth",
  ].map((item) => clipText(item, 90));

  const videoShots = [
    `Hook: ${clipText(post.title, 80)}`,
    `Problem: ${clipText(excerpt, 90)}`,
    ...talkingPoints
      .slice(0, 3)
      .map((point, index) => `Point ${index + 1}: ${clipText(point, 90)}`),
    "CTA: point viewers to the full article and related service page",
  ];

  return {
    headline: clipText(post.title, 80),
    caption,
    talkingPoints,
    carouselSlides,
    videoShots,
    hashtags: buildHashtags(post),
    internalLinkCount: extractInternalLinkCount(post.content),
  };
}

export function buildTikTokPhotoSlides(post: Post) {
  const workflowBrief = buildTikTokWorkflowBrief(post);
  const firstTakeaway =
    workflowBrief.talkingPoints[0] ||
    post.keyTakeaways[0] ||
    post.excerpt;
  const secondTakeaway =
    workflowBrief.talkingPoints[1] ||
    post.keyTakeaways[1] ||
    post.searchIntent;
  const thirdTakeaway =
    workflowBrief.talkingPoints[2] ||
    post.commonMistakes[0] ||
    "Make the next step obvious to the reader.";

  const slides: TikTokPhotoSlide[] = [
    {
      eyebrow: sentenceCase(post.category || "Web Growth guide"),
      headline: clipText(post.title, 72),
      bodyLines: [
        clipText(post.searchIntent || post.excerpt, 88),
        clipText(post.primaryKeyword || "Clear strategy beats generic publishing.", 88),
      ],
      footer: "webgrowth.info",
    },
    {
      eyebrow: "What matters first",
      headline: clipText(firstTakeaway, 78),
      bodyLines: [
        clipText(secondTakeaway, 86),
        clipText(thirdTakeaway, 86),
      ],
      footer: "Save this as your checklist",
    },
    {
      eyebrow: "Use this before you post",
      headline: clipText(post.commonMistakes[0] || "Do not publish generic filler.", 78),
      bodyLines: [
        clipText(post.commonMistakes[1] || "Add proof, examples, and a clear next step.", 86),
        clipText(
          post.methodologyNote ||
            post.evidenceNote ||
            "Ground every claim in visible evidence.",
          86
        ),
      ],
      footer: "Edit inside TikTok after inbox delivery",
    },
    {
      eyebrow: "Full guide on Web Growth",
      headline: clipText(
        "Read the article, then use the service link that matches the task.",
        78
      ),
      bodyLines: workflowBrief.hashtags.slice(0, 4),
      footer: "Draft created from approved Web Growth content",
    },
  ];

  return slides;
}

export function buildTikTokPhotoDraftContent(post: Post) {
  const workflowBrief = buildTikTokWorkflowBrief(post);

  return {
    title: clipText(post.title, 88),
    description: clipText(
      [
        post.excerpt,
        workflowBrief.talkingPoints[0],
        workflowBrief.talkingPoints[1],
        workflowBrief.hashtags.join(" "),
        "Full guide: Web Growth",
      ]
        .filter(Boolean)
        .join(" "),
      350
    ),
    slides: buildTikTokPhotoSlides(post),
  };
}
