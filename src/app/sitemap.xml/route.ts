import { NextResponse } from "next/server";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE_URL = "https://webgrowth.info";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/portfolio",
  "/pricing",
  "/blog",
  "/services",
  "/contact",
  "/privacy",
  "/terms",
];

const SERVICE_ROUTES = [
  "/services/business-website-design",
  "/services/landing-page-design",
  "/services/website-redesign",
  "/services/ecommerce-website-design",
  "/services/website-maintenance",
  "/services/performance-optimisation",
  "/services/website-audit",
];

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
  const staticUrls: SitemapUrl[] = [...STATIC_ROUTES, ...SERVICE_ROUTES].map((path) => ({
    loc: `${BASE_URL}${path}`,
  }));

  const postUrls: SitemapUrl[] = safeGetPosts()
    .filter((post) => typeof post?.slug === "string" && post.slug.length > 0)
    .map((post) => ({
      loc: `${BASE_URL}/blog/${post.slug}`,
      lastmod: toValidDate(post.date),
    }));

  const urls: SitemapUrl[] = [...staticUrls, ...postUrls];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((item) => {
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
