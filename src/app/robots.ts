import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://webgrowth.info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/contact/thanks", "/thank-you/", "/mockup"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap-index.xml`,
  };
}
