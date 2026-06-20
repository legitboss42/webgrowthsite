import type { Post } from "@/lib/posts";

type WorkflowBrief = {
  headline: string;
  caption: string;
  talkingPoints: string[];
  carouselSlides: string[];
  videoShots: string[];
  hashtags: string[];
  internalLinkCount: number;
};

function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function extractInternalLinkCount(content: string) {
  const matches = content.match(/\]\((\/(?!images\/|resources\/))/g);
  return matches?.length || 0;
}

function buildHashtags(post: Post) {
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
    ...talkingPoints.slice(0, 3).map((point, index) => `Point ${index + 1}: ${clipText(point, 90)}`),
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
