import { createIssue } from "./utils.mjs";

function parseRobots(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  return {
    sitemaps: lines
      .filter((line) => /^sitemap:/i.test(line))
      .map((line) => line.split(":").slice(1).join(":").trim()),
    disallow: lines
      .filter((line) => /^disallow:/i.test(line))
      .map((line) => line.split(":").slice(1).join(":").trim()),
  };
}

export async function checkRobots(siteUrl) {
  const robotsUrl = new URL("/robots.txt", siteUrl).toString();
  const response = await fetch(robotsUrl);
  const text = await response.text();
  const parsed = parseRobots(text);
  const issues = [];

  if (!response.ok) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Robots",
        title: "robots.txt is missing or not publicly accessible",
        details: `The crawler received HTTP ${response.status} for ${robotsUrl}.`,
        fix: "Restore a public robots.txt response and point it at the preferred sitemap file.",
        pages: [robotsUrl],
        implementation: "Fix the robots route in src/app/robots.ts.",
      })
    );
  }

  if (!parsed.sitemaps.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Robots",
        title: "robots.txt does not declare a sitemap",
        details:
          "Google can still discover sitemaps elsewhere, but an explicit sitemap declaration removes ambiguity.",
        fix: "Include the live sitemap index in robots.txt.",
        pages: [robotsUrl],
        implementation: "Set sitemap in src/app/robots.ts to the preferred sitemap index URL.",
      })
    );
  }

  if (parsed.disallow.includes("/")) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Robots",
        title: "robots.txt blocks the full site",
        details: "A global Disallow directive can wipe out organic visibility.",
        fix: "Allow the main site to be crawled and only block sensitive routes.",
        pages: [robotsUrl],
        implementation: "Review the disallow list in src/app/robots.ts.",
      })
    );
  }

  return { robotsUrl, status: response.status, text, parsed, issues };
}
