import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  sanitizeText,
} from "@/lib/security";

function parseLocs(xml: string) {
  return Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function parseSitemap(xml: string) {
  const compact = xml.trim();
  const mode = compact.includes("<sitemapindex")
    ? "sitemapindex"
    : compact.includes("<urlset")
      ? "urlset"
      : "unknown";
  const locs = parseLocs(compact);
  const issues: string[] = [];

  if (mode === "unknown") {
    issues.push("The XML does not look like a sitemap index or URL set.");
  }

  if (!locs.length) {
    issues.push("No <loc> entries were found.");
  }

  const duplicates = locs.filter((loc, index) => locs.indexOf(loc) !== index);
  if (duplicates.length) {
    issues.push(`Duplicate <loc> entries found: ${new Set(duplicates).size}.`);
  }

  const insecure = locs.filter((loc) => loc.startsWith("http://"));
  if (insecure.length) {
    issues.push(`Non-HTTPS URLs found: ${insecure.length}.`);
  }

  const invalid = locs.filter((loc) => {
    try {
      new URL(loc);
      return false;
    } catch {
      return true;
    }
  });
  if (invalid.length) {
    issues.push(`Invalid URL format found: ${invalid.length}.`);
  }

  return {
    ok: issues.length === 0,
    mode,
    urlCount: locs.length,
    issues,
    locSamples: locs.slice(0, 6),
  };
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }

  const ip = getClientIp(request);
  const ua = getUserAgent(request).slice(0, 80).toLowerCase();
  const rate = checkRateLimit(`sitemap-validator:${ip}:${ua}`, 25);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const url = sanitizeText((body as { url?: string }).url, 300);
  const xmlInput = sanitizeText((body as { xml?: string }).xml, 200000);

  let xml = xmlInput;

  if (!xml && url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Enter a valid sitemap URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only HTTP and HTTPS sitemap URLs are supported." }, { status: 400 });
    }

    try {
      const response = await fetch(parsed.toString(), {
        headers: { "User-Agent": "WebGrowthTools/1.0 sitemap validator" },
        cache: "no-store",
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Could not fetch sitemap. HTTP ${response.status}.` },
          { status: 400 }
        );
      }

      xml = await response.text();
    } catch {
      return NextResponse.json({ error: "Unable to fetch sitemap URL." }, { status: 400 });
    }
  }

  if (!xml.trim()) {
    return NextResponse.json({ error: "Provide a sitemap URL or XML content." }, { status: 400 });
  }

  return NextResponse.json(parseSitemap(xml));
}
