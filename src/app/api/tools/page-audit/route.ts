import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  sanitizeText,
} from "@/lib/security";

type AuditMode = "homepage" | "adsense";

type AuditIssue = {
  severity: "high" | "medium" | "low";
  message: string;
};

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchFirst(pattern: RegExp, input: string) {
  const match = input.match(pattern);
  return match?.[1]?.trim() || "";
}

function countMatches(pattern: RegExp, input: string) {
  return (input.match(pattern) || []).length;
}

function extractTitle(html: string) {
  return matchFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
}

function extractMetaContent(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
    "i"
  );
  return matchFirst(pattern, html) || matchFirst(reversePattern, html);
}

function extractH1s(html: string) {
  return Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi))
    .map((match) => stripTags(match[1] || ""))
    .filter(Boolean);
}

function extractLinks(html: string) {
  return Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)).map(
    (match) => ({
      href: match[1]?.trim() || "",
      text: stripTags(match[2] || ""),
    })
  );
}

function extractButtons(html: string) {
  const buttonTexts = Array.from(html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)).map((match) =>
    stripTags(match[1] || "")
  );
  const anchorButtons = extractLinks(html)
    .filter((link) => link.text)
    .map((link) => link.text);
  return [...buttonTexts, ...anchorButtons].filter(Boolean);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function pickMainContent(html: string) {
  const main = matchFirst(/<main[^>]*>([\s\S]*?)<\/main>/i, html);
  const body = matchFirst(/<body[^>]*>([\s\S]*?)<\/body>/i, html);
  if (!main) return body || html;
  if (!body) return main || html;

  const mainTextLength = stripTags(main).length;
  const bodyTextLength = stripTags(body).length;

  // Prefer the fuller content extraction. Regex-only <main> capture can undercount
  // heavily nested app markup on some sites.
  return bodyTextLength > mainTextLength ? body : main;
}

function analyzePage(html: string, url: string, mode: AuditMode) {
  const title = extractTitle(html);
  const metaDescription = extractMetaContent(html, "description");
  const viewport = extractMetaContent(html, "viewport");
  const h1s = extractH1s(html);
  const links = extractLinks(html);
  const buttons = extractButtons(html);
  const mainContent = pickMainContent(html);
  const text = stripTags(mainContent);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const imageCount = countMatches(/<img\b/gi, html);
  const imagesMissingAlt = countMatches(/<img\b(?![^>]*\balt=)[^>]*>/gi, html);
  const headingsH2 = countMatches(/<h2\b/gi, html);

  const trustTargets = {
    about: links.some((link) => /\/about\/?$/i.test(link.href)),
    contact: links.some((link) => /\/contact\/?$/i.test(link.href)),
    privacy: links.some((link) => /\/privacy\/?$/i.test(link.href)),
    terms: links.some((link) => /\/terms\/?$/i.test(link.href)),
    editorial: links.some((link) => /\/editorial-policy\/?$/i.test(link.href)),
    disclaimer: links.some((link) => /\/disclaimer\/?$/i.test(link.href)),
  };

  const buttonTexts = uniqueStrings(buttons);
  const ctaMentions = buttonTexts.filter((text) =>
    /(contact|quote|review|get started|book|call|request|learn more|start)/i.test(text)
  );
  const proofMentions = (text.match(/(testimonial|case study|results|clients|trusted by|reviews?)/gi) || []).length;

  const issues: AuditIssue[] = [];

  if (!title) issues.push({ severity: "high", message: "Missing page title." });
  if (!metaDescription) issues.push({ severity: "high", message: "Missing meta description." });
  if (metaDescription && metaDescription.length > 165) {
    issues.push({ severity: "medium", message: "Meta description is longer than the usual search snippet range." });
  }
  if (!viewport) issues.push({ severity: "medium", message: "Missing viewport meta tag for mobile rendering." });
  if (h1s.length === 0) issues.push({ severity: "high", message: "Missing H1 heading." });
  if (h1s.length > 1) issues.push({ severity: "medium", message: "More than one H1 detected." });
  if (wordCount < 180) issues.push({ severity: "high", message: "Main content looks thin for a public trust-building page." });
  if (imageCount > 0 && imagesMissingAlt > 0) {
    issues.push({ severity: "low", message: `${imagesMissingAlt} image(s) appear to be missing alt text.` });
  }

  if (mode === "homepage") {
    if (wordCount < 250) {
      issues.push({ severity: "high", message: "Homepage copy is probably too light to explain the offer clearly." });
    }
    if (ctaMentions.length < 2) {
      issues.push({ severity: "medium", message: "The page does not show many obvious CTA labels." });
    }
    if (proofMentions < 1) {
      issues.push({ severity: "medium", message: "Little or no visible proof language detected." });
    }
    if (headingsH2 < 2) {
      issues.push({ severity: "low", message: "Very few supporting sections were detected below the main headline." });
    }
  }

  if (mode === "adsense") {
    if (!trustTargets.about || !trustTargets.contact || !trustTargets.privacy || !trustTargets.terms) {
      issues.push({ severity: "high", message: "One or more core trust/legal links were not detected from this page." });
    }
    if (wordCount < 300) {
      issues.push({ severity: "high", message: "Page depth may be too low for strong AdSense trust signals." });
    }
    if (/(lorem ipsum|coming soon|placeholder)/i.test(text)) {
      issues.push({ severity: "high", message: "Placeholder or unfinished content language detected." });
    }
    if (/(casino|betting|adult|torrent|hack)/i.test(text)) {
      issues.push({ severity: "high", message: "Sensitive content language detected. Review policy safety carefully." });
    }
  }

  const scoreBase = mode === "adsense" ? 100 : 100;
  const penalty = issues.reduce((sum, issue) => {
    if (issue.severity === "high") return sum + 18;
    if (issue.severity === "medium") return sum + 10;
    return sum + 5;
  }, 0);
  const score = Math.max(0, scoreBase - penalty);

  return {
    url: normalizeUrl(url),
    score,
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    h1s,
    headingCount: {
      h1: h1s.length,
      h2: headingsH2,
    },
    wordCount,
    ctas: ctaMentions.slice(0, 8),
    trustTargets,
    imageCount,
    imagesMissingAlt,
    proofMentions,
    issues,
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
  const rate = checkRateLimit(`page-audit:${ip}:${ua}`, 20);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const url = sanitizeText((body as { url?: string }).url, 300);
  const mode = ((body as { mode?: AuditMode }).mode || "homepage") as AuditMode;

  if (!url) {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only HTTP and HTTPS URLs are supported." }, { status: 400 });
  }

  try {
    const response = await fetch(parsed.toString(), {
      headers: { "User-Agent": "WebGrowthTools/1.0 page audit" },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch page. HTTP ${response.status}.` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const analysis = analyzePage(html, response.url || parsed.toString(), mode);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: "Unable to fetch and analyze this URL." }, { status: 400 });
  }
}
