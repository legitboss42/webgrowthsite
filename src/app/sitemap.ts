import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPosts } from "@/lib/posts";

const DEFAULT_BASE_URL = "https://webgrowth.info";
const ALLOWED_HOSTS = new Set(["webgrowth.info", "www.webgrowth.info"]);

function getBaseUrl() {
  const requestHeaders = headers();
  const rawHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!rawHost) return DEFAULT_BASE_URL;

  const host = rawHost.toLowerCase().split(":")[0];
  if (!ALLOWED_HOSTS.has(host)) return DEFAULT_BASE_URL;

  return `https://${host}`;
}

function toValidDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function safeGetPosts() {
  try {
    const posts = getPosts();
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/about` },
    { url: `${baseUrl}/portfolio` },
    { url: `${baseUrl}/pricing` },
    { url: `${baseUrl}/blog` },
    { url: `${baseUrl}/services` },
    { url: `${baseUrl}/contact` },
    { url: `${baseUrl}/privacy` },
    { url: `${baseUrl}/terms` },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/services/business-website-design` },
    { url: `${baseUrl}/services/landing-page-design` },
    { url: `${baseUrl}/services/website-redesign` },
    { url: `${baseUrl}/services/ecommerce-website-design` },
    { url: `${baseUrl}/services/website-maintenance` },
    { url: `${baseUrl}/services/performance-optimisation` },
    { url: `${baseUrl}/services/website-audit` },
  ];

  const posts = safeGetPosts();
  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((p) => typeof p?.slug === "string" && p.slug.length > 0)
    .map((p) => {
      const lastModified = toValidDate(p.date);
      return lastModified
        ? { url: `${baseUrl}/blog/${p.slug}`, lastModified }
        : { url: `${baseUrl}/blog/${p.slug}` };
    });

  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
