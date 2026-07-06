import { load } from "cheerio";
import { createIssue, unique } from "./utils.mjs";

async function fetchXml(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { response, text };
}

function parseLocs(xml) {
  const $ = load(xml, { xmlMode: true });
  return $("loc")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
}

export async function checkSitemaps(siteUrl) {
  const indexUrl = new URL("/sitemap-index.xml", siteUrl).toString();
  const indexResult = await fetchXml(indexUrl);
  const sitemapUrls = parseLocs(indexResult.text);
  const childMaps = [];
  const issues = [];

  if (!indexResult.response.ok) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Sitemap",
        title: "Sitemap index is missing or failing",
        details: `The crawler received HTTP ${indexResult.response.status} for ${indexUrl}.`,
        fix: "Restore a valid sitemap index response.",
        pages: [indexUrl],
        implementation: "Fix src/app/sitemap-index.xml/route.ts or the deployment route handling.",
      })
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    const child = await fetchXml(sitemapUrl);
    childMaps.push({
      url: sitemapUrl,
      status: child.response.status,
      entries: parseLocs(child.text),
    });
  }

  const allEntries = unique(childMaps.flatMap((map) => map.entries));

  if (!sitemapUrls.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Sitemap",
        title: "Sitemap index has no child sitemaps",
        details: "The sitemap index should point to at least the primary page and blog sitemaps.",
        fix: "Emit the child sitemap URLs from the sitemap index route.",
        pages: [indexUrl],
        implementation: "Review src/app/sitemap-index.xml/route.ts.",
      })
    );
  }

  const brokenChildren = childMaps.filter((map) => map.status >= 400);
  if (brokenChildren.length) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Sitemap",
        title: "One or more child sitemaps are failing",
        details:
          "Broken child sitemaps reduce index discovery and can hide valid URLs from Google.",
        fix: "Restore each failing child sitemap and verify it returns valid XML.",
        pages: brokenChildren.map((map) => `${map.url} (${map.status})`),
        implementation: "Fix the underlying sitemap routes and any route-governance data feeding them.",
      })
    );
  }

  return {
    indexUrl,
    status: indexResult.response.status,
    sitemapUrls,
    childMaps,
    allEntries,
    issues,
  };
}
