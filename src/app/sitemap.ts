import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE_URL = "https://webgrowth.info";

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
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/` },
    { url: `${BASE_URL}/about` },
    { url: `${BASE_URL}/portfolio` },
    { url: `${BASE_URL}/pricing` },
    { url: `${BASE_URL}/blog` },
    { url: `${BASE_URL}/services` },
    { url: `${BASE_URL}/contact` },
    { url: `${BASE_URL}/privacy` },
    { url: `${BASE_URL}/terms` },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/services/business-website-design` },
    { url: `${BASE_URL}/services/landing-page-design` },
    { url: `${BASE_URL}/services/website-redesign` },
    { url: `${BASE_URL}/services/ecommerce-website-design` },
    { url: `${BASE_URL}/services/website-maintenance` },
    { url: `${BASE_URL}/services/performance-optimisation` },
    { url: `${BASE_URL}/services/website-audit` },
  ];

  const posts = safeGetPosts();
  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((p) => typeof p?.slug === "string" && p.slug.length > 0)
    .map((p) => {
      const lastModified = toValidDate(p.date);
      return lastModified
        ? { url: `${BASE_URL}/blog/${p.slug}`, lastModified }
        : { url: `${BASE_URL}/blog/${p.slug}` };
    });

  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
