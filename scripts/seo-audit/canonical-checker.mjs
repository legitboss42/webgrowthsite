import { createIssue, normalizeUrl } from "./utils.mjs";

export function runCanonicalChecks(crawl) {
  const issues = [];
  const missing = crawl.pages.filter((page) => page.ok && !page.canonical);
  const mismatched = crawl.pages.filter(
    (page) =>
      page.ok &&
      page.canonical &&
      normalizeUrl(page.canonical) !== normalizeUrl(page.finalUrl)
  );

  if (missing.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Canonical",
        title: "Some pages are missing self-canonical tags",
        details:
          "Missing canonicals increase the risk of duplicate URL handling problems and weaker indexing signals.",
        fix: "Ensure every indexable page emits a canonical URL through shared metadata helpers.",
        pages: missing.map((page) => page.url),
        implementation:
          "Use buildPageMetadata() or route-level alternates.canonical values consistently in src/app.",
      })
    );
  }

  if (mismatched.length) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Canonical",
        title: "Some canonical tags do not match the crawled URL",
        details:
          "Canonical mismatches can consolidate rankings into the wrong URL or prevent the intended page from indexing well.",
        fix: "Review each mismatched canonical and align it with the preferred live URL or apply redirects intentionally.",
        pages: mismatched.map((page) => `${page.url} -> ${page.canonical}`),
        implementation:
          "Cross-check absoluteUrl() usage, route metadata paths, and any redirect logic in src/lib/site.ts and src/app routes.",
      })
    );
  }

  return issues;
}
