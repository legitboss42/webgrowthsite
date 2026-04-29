import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DEFAULT_AUTHOR_ID, DEFAULT_REVIEWER_ID } from "@/lib/authors";
import { warnOnPostQuality } from "@/lib/contentQuality";
import { LOW_CPU_EMERGENCY_MODE } from "@/lib/emergency";
import sitemapConfig from "@/lib/sitemap-config.json";

export const CATEGORY_ORDER = [
  "Series",
  "Case Study",
  "Strategy",
  "SEO",
  "Conversion",
  "Performance",
  "UX",
  "Automation",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number] | string;

export type PostFaqItem = {
  question: string;
  answer: string;
};

export type Post = {
  slug: string;
  title: string;
  seoTitle?: string;
  excerpt: string;
  date: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  category: Category;
  topic?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | string;
  isCornerstone?: boolean;
  checklistAvailable?: boolean;
  tags: string[];
  readTime: string;
  content: string;
  cover?: string;
  author?: string;
  reviewedBy?: string;
  keyTakeaways: string[];
  whatYouNeed: string[];
  commonMistakes: string[];
  steps: string[];
  relatedGuideSlugs: string[];
  faq: PostFaqItem[];
  ctaVariant?: "none" | "soft" | "service" | "consultation" | string;
  evidenceNote?: string;
  methodologyNote?: string;
};

const postsDirectory = path.join(process.cwd(), "content/blog");
let postsCache: Post[] | null = null;
let postsBySlugCache: Map<string, Post> | null = null;
export const NEW_POST_PRIORITY_SLUGS = [
  "ga4-meta-tiktok-clarity-setup-guide",
  "landing-page-wireframe-local-service-business",
  "website-redesign-cost-breakdown-nigeria",
  "how-to-audit-slow-wordpress-site",
  "google-business-profile-optimization-checklist",
  "conversion-audit-checklist-service-homepage",
  "small-business-website-launch-qa-checklist",
  "how-to-plan-website-copy-before-hiring-developer",
  "local-seo-basics-service-business-lagos",
  "website-platform-comparison-small-business",
];
const SERIES_SLUGS = new Set([
  "01-why-we-rebuilt-not-redesigned",
  "02-the-audit-that-created-the-roadmap",
  "03-seo-migration-without-losing-traffic",
  "04-writing-service-pages-that-convert",
  "05-premium-design-without-slow-pages",
  "06-nextjs-architecture-and-build-decisions",
  "07-launch-week-checklist-and-first-7-days",
  "08-results-mistakes-and-reusable-playbook",
]);
const APPROVED_BLOG_SLUGS = new Set(sitemapConfig.blogSlugs);

function resolveCategory(slug: string, category: unknown): Category {
  if (SERIES_SLUGS.has(slug)) return "Series";
  if (typeof category === "string" && category.trim().length) return category.trim();
  return "Strategy";
}

function getMarkdownFiles() {
  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.endsWith("-image-prompts.md") &&
        !entry.name.startsWith("_")
    )
    .map((entry) => entry.name);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFaqArray(value: unknown): PostFaqItem[] {
  if (!Array.isArray(value)) return [];

  const items: PostFaqItem[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === "object" &&
      "question" in item &&
      "answer" in item &&
      typeof (item as { question: unknown }).question === "string" &&
      typeof (item as { answer: unknown }).answer === "string"
    ) {
      const question = (item as { question: string }).question.trim();
      const answer = (item as { answer: string }).answer.trim();
      if (question && answer) {
        items.push({ question, answer });
      }
    }
  }

  return items;
}

function toSafeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length ? value.trim() : fallback;
}

function toSafeBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toDateString(value: unknown, fallback = new Date().toISOString().slice(0, 10)) {
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  return fallback;
}

function toTime(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function isPublicBlogSlug(slug: string) {
  if (!LOW_CPU_EMERGENCY_MODE) return true;
  return APPROVED_BLOG_SLUGS.has(slug);
}

export function getPosts(): Post[] {
  if (postsCache) return postsCache;

  const filenames = getMarkdownFiles();

  const posts = filenames.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(postsDirectory, filename);

    const file = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(file);
    const normalizedCategory = resolveCategory(slug, data.category);
    const tags = parseStringArray(data.tags);

    const keyTakeaways = parseStringArray(data.keyTakeaways);
    const whatYouNeed = parseStringArray(data.whatYouNeed);
    const commonMistakes = parseStringArray(data.commonMistakes);
    const steps = parseStringArray(data.steps);
    const relatedGuideSlugs = parseStringArray(data.relatedGuideSlugs);

    return {
      slug,
      title: toSafeString(data.title, slug.replace(/-/g, " ")),
      seoTitle: toSafeString(data.seoTitle) || undefined,
      excerpt: toSafeString(data.excerpt, "Practical guide from Web Growth."),
      date: toDateString(data.date ?? data.publishedAt),
      updatedAt: data.updatedAt ? toDateString(data.updatedAt) : undefined,
      lastReviewedAt: data.lastReviewedAt ? toDateString(data.lastReviewedAt) : undefined,
      category: normalizedCategory,
      topic: toSafeString(data.topic) || undefined,
      difficulty: toSafeString(data.difficulty) || undefined,
      isCornerstone: toSafeBool(data.isCornerstone, false),
      checklistAvailable: toSafeBool(data.checklistAvailable, false),
      tags,
      readTime: toSafeString(data.readTime || data.readingTime, "6 min read"),
      content,
      cover: toSafeString(data.cover) || undefined,
      author: toSafeString(data.author, DEFAULT_AUTHOR_ID),
      reviewedBy: toSafeString(data.reviewedBy, DEFAULT_REVIEWER_ID),
      keyTakeaways,
      whatYouNeed,
      commonMistakes,
      steps,
      relatedGuideSlugs,
      faq: parseFaqArray(data.faq),
      ctaVariant: toSafeString(data.ctaVariant) || undefined,
      evidenceNote: toSafeString(data.evidenceNote) || undefined,
      methodologyNote: toSafeString(data.methodologyNote) || undefined,
    } as Post;
  });

  const sorted = posts.sort((a, b) => {
    const diff = toTime(b.date) - toTime(a.date);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });

  warnOnPostQuality(sorted);

  postsCache = sorted;
  postsBySlugCache = new Map(sorted.map((post) => [post.slug, post]));

  return postsCache;
}

export function getPost(slug: string): Post | undefined {
  if (!postsBySlugCache) getPosts();
  return postsBySlugCache?.get(slug);
}

export function getPublicPosts(posts = getPosts()): Post[] {
  return posts.filter((post) => isPublicBlogSlug(post.slug));
}

export function getCornerstonePosts(posts = getPosts()): Post[] {
  return posts.filter((post) => post.isCornerstone);
}

export function getRelatedGuidesForPost(
  post: Post,
  posts = getPosts(),
  limit = 4
): Post[] {
  const publicPosts = posts.filter((candidate) => isPublicBlogSlug(candidate.slug));

  const relatedBySlug = publicPosts
    .filter((candidate) => post.relatedGuideSlugs.includes(candidate.slug))
    .slice(0, limit);

  if (relatedBySlug.length >= limit) return relatedBySlug;

  const existingSlugs = new Set(relatedBySlug.map((item) => item.slug));
  existingSlugs.add(post.slug);

  const topic = (post.topic || "").toLowerCase();
  const tagSet = new Set(post.tags.map((tag) => tag.toLowerCase()));

  const scored = publicPosts
    .filter((candidate) => !existingSlugs.has(candidate.slug))
    .map((candidate) => {
      let score = 0;
      if (topic && (candidate.topic || "").toLowerCase() === topic) score += 5;
      if ((candidate.category || "").toLowerCase() === (post.category || "").toLowerCase()) score += 2;
      for (const tag of candidate.tags) {
        if (tagSet.has(tag.toLowerCase())) score += 1;
      }
      if (candidate.isCornerstone) score += 1;
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || toTime(b.candidate.date) - toTime(a.candidate.date))
    .map((entry) => entry.candidate);

  return [...relatedBySlug, ...scored].slice(0, limit);
}
