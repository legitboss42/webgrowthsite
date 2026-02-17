import type { MetadataRoute } from "next";
import { headers } from "next/headers";

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

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
