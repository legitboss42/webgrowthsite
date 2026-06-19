import { NextResponse } from "next/server";
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

export function GET() {
  const generatedAt = new Date().toISOString();
  const urls: SitemapUrl[] = routeGovernance.routes
    .filter((route) => route.status === "INDEX" && route.sitemap)
    .map((route) => ({
      loc: absoluteUrl(route.path),
      lastmod: generatedAt,
    }));

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
