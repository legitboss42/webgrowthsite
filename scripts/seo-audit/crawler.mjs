import { DEFAULT_PAGE_LIMIT } from "./config.mjs";
import {
  loadHtml,
  normalizeUrl,
  sameOrigin,
  textOrEmpty,
  toAbsoluteUrl,
  unique,
} from "./utils.mjs";

function extractJsonLd($) {
  const items = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      items.push({ valid: true, raw, parsed: JSON.parse(raw) });
    } catch (error) {
      items.push({ valid: false, raw, error: error.message });
    }
  });
  return items;
}

function extractLinks($, currentUrl, siteUrl) {
  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const absolute = toAbsoluteUrl(currentUrl, href);
    if (!absolute) return;
    if (!sameOrigin(siteUrl, absolute)) return;
    links.push(absolute);
  });
  return unique(links);
}

function extractImages($, currentUrl) {
  const images = [];
  $("img").each((_, el) => {
    images.push({
      src: toAbsoluteUrl(currentUrl, $(el).attr("src") || ""),
      alt: textOrEmpty($(el).attr("alt") || ""),
      width: textOrEmpty($(el).attr("width") || ""),
      height: textOrEmpty($(el).attr("height") || ""),
      loading: textOrEmpty($(el).attr("loading") || ""),
    });
  });
  return images;
}

function getCanonical($, currentUrl) {
  const href = $('link[rel="canonical"]').attr("href");
  return href ? toAbsoluteUrl(currentUrl, href) : null;
}

export async function crawlSite(siteUrl, options = {}) {
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;
  const queue = [normalizeUrl(siteUrl)];
  const visited = new Set();
  const pages = [];
  const incoming = new Map();

  while (queue.length && pages.length < pageLimit) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const response = await fetch(currentUrl, {
        redirect: "follow",
        headers: { "user-agent": "WebGrowth SEO Audit Bot/1.0" },
      });
      const html = await response.text();
      const $ = loadHtml(html);
      const links = extractLinks($, currentUrl, siteUrl);
      const title = textOrEmpty($("title").first().text());
      const metaDescription = textOrEmpty(
        $('meta[name="description"]').attr("content") || ""
      );
      const h1 = textOrEmpty($("h1").first().text());
      const robots = textOrEmpty($('meta[name="robots"]').attr("content") || "");
      const canon = getCanonical($, currentUrl);
      const text = textOrEmpty($("main").text() || $("body").text() || "");
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link) && pages.length + queue.length < pageLimit * 2) {
          queue.push(link);
        }
        incoming.set(link, (incoming.get(link) ?? 0) + 1);
      }

      pages.push({
        url: currentUrl,
        finalUrl: response.url ? normalizeUrl(response.url) : currentUrl,
        status: response.status,
        ok: response.ok,
        title,
        metaDescription,
        h1,
        robots,
        canonical: canon,
        links,
        images: extractImages($, currentUrl),
        jsonLd: extractJsonLd($),
        textSample: text.slice(0, 400),
        wordCount,
        hasMain: $("main").length > 0,
      });
    } catch (error) {
      pages.push({
        url: currentUrl,
        finalUrl: currentUrl,
        status: 0,
        ok: false,
        title: "",
        metaDescription: "",
        h1: "",
        robots: "",
        canonical: null,
        links: [],
        images: [],
        jsonLd: [],
        textSample: "",
        wordCount: 0,
        hasMain: false,
        error: error.message,
      });
    }
  }

  return { pages, incomingLinks: Object.fromEntries(incoming) };
}
