import type { Post } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import type { SocialArticle } from "./types";

const RESERVED_SLUGS = new Set(["_article-template"]);

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPublishableSocialArticle(post: Pick<Post, "slug" | "title">) {
  const slug = String(post?.slug || "").trim();
  const title = String(post?.title || "").trim();
  return Boolean(slug && title && !slug.startsWith("_") && !RESERVED_SLUGS.has(slug));
}

export function normalizeSocialArticle(post: Post): SocialArticle {
  if (!isPublishableSocialArticle(post)) {
    throw new Error("Article is not eligible for social automation.");
  }

  return {
    slug: post.slug.trim(),
    title: post.title.trim(),
    excerpt: String(post.excerpt || "").trim(),
    canonicalUrl: absoluteUrl(`/blog/${post.slug}/`),
    category: String(post.category || "Strategy").trim() || "Strategy",
    topic: String(post.topic || "").trim(),
    primaryKeyword: String(post.primaryKeyword || "").trim(),
    tags: cleanList(post.tags),
    cover: String(post.cover || "").trim(),
    keyTakeaways: cleanList(post.keyTakeaways),
    steps: cleanList(post.steps),
    commonMistakes: cleanList(post.commonMistakes),
    prose: stripMarkdown(String(post.content || "")),
  };
}
