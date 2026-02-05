import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://webgrowth.info";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/portfolio`, lastModified: now },
    { url: `${base}/pricing`, lastModified: now },
    { url: `${base}/blog`, lastModified: now },
    { url: `${base}/services`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/services/business-website-design`, lastModified: now },
    { url: `${base}/services/landing-page-design`, lastModified: now },
    { url: `${base}/services/website-redesign`, lastModified: now },
    { url: `${base}/services/ecommerce-website-design`, lastModified: now },
    { url: `${base}/services/website-maintenance`, lastModified: now },
    { url: `${base}/services/performance-optimisation`, lastModified: now },
    { url: `${base}/services/website-audit`, lastModified: now },
  ];

  const posts = getPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
  }));

  return [...staticRoutes, ...serviceRoutes, ...postRoutes];
}
