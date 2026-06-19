import { NextResponse } from "next/server";
import { getPosts, type Post } from "@/lib/posts";
import routeGovernance from "@/lib/route-governance.json";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toValidDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function safeGetPosts() {
  try {
    const posts = getPosts();
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export function GET() {
  const postMap = new Map(
    safeGetPosts().map((post) => [post.slug, post] as const)
  );

  const blogUrls: SitemapUrl[] = routeGovernance.articles
    .filter((article) => article.status === "INDEX" && article.sitemap)
    .map((article) => postMap.get(article.slug))
    .filter((post): post is Post => Boolean(post && typeof post.slug === "string"))
    .map((post) => ({
      loc: absoluteUrl(`/blog/${post.slug}/`),
      lastmod: toValidDate(post.updatedAt || post.lastReviewedAt || post.date),
    }));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...blogUrls.map((item) => {
      const parts = [`  <url>`, `    <loc>${escapeXml(item.loc)}</loc>`];
      if (item.lastmod) {
        parts.push(`    <lastmod>${item.lastmod}</lastmod>`);
      }
      parts.push("  </url>");
      return parts.join("\n");
    }),
    "</urlset>",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
