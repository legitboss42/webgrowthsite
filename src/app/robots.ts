import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://webgrowth.info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/get-started",
          "/hosting-offer",
          "/launch",
          "/website-build",
          "/internal/",
          "/connect/tiktok",
          "/contact/thanks",
          "/thank-you/",
          "/mockup",
        ],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap-index.xml`,
  };
}
