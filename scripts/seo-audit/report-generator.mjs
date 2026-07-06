import path from "node:path";
import { DEFAULT_REPORT_DIR, PRIORITY_PATHS, REQUIRED_TRUST_PATHS, RECOMMENDED_TRUST_PATHS } from "./config.mjs";
import { bucketIssues, bullets, ensureDir, sortIssues, truncate, writeText } from "./utils.mjs";

function formatPercent(value) {
  return value == null ? "Unavailable" : `${(value * 100).toFixed(1)}%`;
}

function formatScore(value) {
  return value == null ? "Unavailable" : `${Math.round(value * 100)}/100`;
}

function formatNumber(value) {
  return value == null ? "Unavailable" : `${value}`;
}

function formatSeconds(value) {
  return value == null ? "Unavailable" : `${value.toFixed(2)}s`;
}

function priorityList(issues) {
  const buckets = bucketIssues(issues);
  return [
    `Critical: ${buckets.critical.length}`,
    `High: ${buckets.high.length}`,
    `Medium: ${buckets.medium.length}`,
    `Low: ${buckets.low.length}`,
  ];
}

function topFixes(issues, count = 10) {
  return sortIssues(issues)
    .slice(0, count)
    .map((issue, index) => `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title} - ${issue.fix}`);
}

function buildImplementationSteps(issues) {
  return sortIssues(issues)
    .slice(0, 8)
    .map((issue, index) => `${index + 1}. ${issue.implementation || issue.fix}`);
}

function buildTrustChecklist(crawl) {
  const urlSet = new Set(crawl.pages.map((page) => page.finalUrl));
  return [
    ...REQUIRED_TRUST_PATHS.map((pathName) => ({
      path: pathName,
      required: true,
      present: urlSet.has(new URL(pathName, crawl.pages[0]?.url || "https://webgrowth.info").toString()),
    })),
    ...RECOMMENDED_TRUST_PATHS.map((pathName) => ({
      path: pathName,
      required: false,
      present: urlSet.has(new URL(pathName, crawl.pages[0]?.url || "https://webgrowth.info").toString()),
    })),
  ];
}

function buildAdSenseNotes(crawl) {
  const trust = buildTrustChecklist(crawl);
  const missingRequired = trust.filter((item) => item.required && !item.present);
  const thinPages = crawl.pages.filter((page) => page.ok && page.wordCount < 150);

  return {
    trust,
    missingRequired,
    thinPages,
  };
}

export async function writeReports(audit) {
  await ensureDir(DEFAULT_REPORT_DIR);

  const issues = sortIssues(audit.issues);
  const buckets = bucketIssues(issues);
  const adsense = buildAdSenseNotes(audit.crawl);
  const summaryLines = [
    `Target: ${audit.siteUrl}`,
    `Crawled pages: ${audit.crawl.pages.length}`,
    `Sitemap URLs: ${audit.sitemap.allEntries.length}`,
    `Lighthouse SEO: ${formatScore(audit.lighthouse.summary.seo)}`,
    `PageSpeed mobile performance: ${formatScore(audit.pagespeed.summary.mobilePerformance)}`,
    `Search Console configured: ${audit.searchConsole.configured ? "Yes" : "No"}`,
  ];

  const finalAudit = `# Final SEO Audit

## Audit summary
${bullets(summaryLines)}

## Priorities
${bullets(priorityList(issues))}

## Critical issues
${buckets.critical.length ? buckets.critical.map((issue) => `- ${issue.title}: ${issue.details}`).join("\n") : "- None detected in this run."}

## High priority issues
${buckets.high.length ? buckets.high.map((issue) => `- ${issue.title}: ${issue.details}`).join("\n") : "- None detected in this run."}

## Medium priority issues
${buckets.medium.length ? buckets.medium.map((issue) => `- ${issue.title}: ${issue.details}`).join("\n") : "- None detected in this run."}

## Low priority issues
${buckets.low.length ? buckets.low.map((issue) => `- ${issue.title}: ${issue.details}`).join("\n") : "- None detected in this run."}

## Technical SEO issues
${issues.filter((issue) => ["Metadata", "Canonical", "Robots", "Sitemap", "Schema", "Technical SEO"].includes(issue.category)).map((issue) => `- [${issue.severity}] ${issue.title}`).join("\n") || "- None."}

## Search Console feedback
- Property used: ${audit.searchConsole.siteUrl || "Unavailable"}
- Top pages by clicks:
${audit.searchConsole.topPages?.length ? audit.searchConsole.topPages.map((row) => `- ${row.page} | clicks ${row.clicks} | impressions ${row.impressions} | ctr ${formatPercent(row.ctr)} | position ${row.position.toFixed(1)}`).join("\n") : "- Unavailable or no rows."}
- Top queries by impressions:
${audit.searchConsole.topQueries?.length ? audit.searchConsole.topQueries.map((row) => `- ${row.query} | impressions ${row.impressions} | ctr ${formatPercent(row.ctr)} | position ${row.position.toFixed(1)}`).join("\n") : "- Unavailable or no rows."}
- Low CTR opportunities:
${audit.searchConsole.lowCtrOpportunities?.length ? audit.searchConsole.lowCtrOpportunities.map((row) => `- ${row.query} -> ${row.page} | impressions ${row.impressions} | ctr ${formatPercent(row.ctr)} | position ${row.position.toFixed(1)}`).join("\n") : "- None surfaced from this run."}
- Pages ranking positions 8-20:
${audit.searchConsole.pagesRanking8To20?.length ? audit.searchConsole.pagesRanking8To20.map((row) => `- ${row.query} -> ${row.page} | position ${row.position.toFixed(1)} | impressions ${row.impressions}`).join("\n") : "- None surfaced from this run."}
- Indexed pages where available: ${audit.manualSearchConsole?.indexedPages ?? "Unavailable from API; use Search Console UI for live index coverage totals."}
- Non-indexed pages where available: ${audit.manualSearchConsole?.notIndexedPages ?? "Unavailable from API; use Search Console UI for live index coverage totals."}

## Core Web Vitals
- Mobile PageSpeed score: ${formatScore(audit.pagespeed.summary.mobilePerformance)}
- Desktop PageSpeed score: ${formatScore(audit.pagespeed.summary.desktopPerformance)}
- Mobile SEO score: ${formatScore(audit.pagespeed.summary.mobileSeo)}
- Mobile LCP field data: ${formatSeconds(audit.pagespeed.coreWebVitals.mobileLcp)}
- Mobile INP field data: ${audit.pagespeed.coreWebVitals.mobileInp == null ? "Unavailable" : `${audit.pagespeed.coreWebVitals.mobileInp.toFixed(0)}ms`}
- Mobile CLS field data: ${formatNumber(audit.pagespeed.coreWebVitals.mobileCls)}

## Metadata issues
${issues.filter((issue) => issue.category === "Metadata").map((issue) => `- ${issue.title}`).join("\n") || "- None."}

## Canonical issues
${issues.filter((issue) => issue.category === "Canonical").map((issue) => `- ${issue.title}`).join("\n") || "- None."}

## Sitemap issues
${issues.filter((issue) => issue.category === "Sitemap").map((issue) => `- ${issue.title}`).join("\n") || "- None."}

## robots.txt issues
${issues.filter((issue) => issue.category === "Robots").map((issue) => `- ${issue.title}`).join("\n") || "- None."}

## Schema issues
${issues.filter((issue) => issue.category === "Schema").map((issue) => `- ${issue.title}`).join("\n") || "- None."}

## Internal linking issues
- Priority paths checked: ${PRIORITY_PATHS.join(", ")}
- Lowest incoming internal links:
${Object.entries(audit.crawl.incomingLinks).sort((a, b) => a[1] - b[1]).slice(0, 10).map(([url, count]) => `- ${url} | incoming links ${count}`).join("\n") || "- Unavailable."}

## Image optimization issues
- Pages with images missing alt text:
${audit.crawl.pages.filter((page) => page.images.some((image) => image.alt === "")).map((page) => `- ${page.url}`).join("\n") || "- None found in crawled pages."}

## AdSense readiness checks
- Required trust pages missing:
${adsense.missingRequired.length ? adsense.missingRequired.map((item) => `- ${item.path}`).join("\n") : "- None."}
- Recommended disclaimer page present: ${adsense.trust.find((item) => item.path === "/disclaimer/")?.present ? "Yes" : "No"}
- Thin crawled pages under ~150 words:
${adsense.thinPages.length ? adsense.thinPages.slice(0, 10).map((page) => `- ${page.url} | words ${page.wordCount}`).join("\n") : "- None flagged in the crawled sample."}

## CRO recommendations
- Strengthen CTA clarity on the pages with the highest impressions but low CTR.
- Add stronger internal CTA blocks from blog content into service and contact pages.
- Keep trust surfaces visible above the fold on homepage, service pages, and contact routes.
- Reduce friction on conversion routes by checking mobile forms, WhatsApp links, and proof blocks.

## Exact Next.js implementation steps
${buildImplementationSteps(issues).join("\n")}

## Final checklist
${topFixes(issues, 12).join("\n")}
`;

  const actionChecklist = `# Action Checklist

## First 10 SEO fixes to implement
${topFixes(issues, 10).join("\n")}

## Validation steps
1. Re-run \`npm run seo:audit:webgrowth\`.
2. Re-run \`npm run lint\`.
3. Re-run \`npx tsc --noEmit\`.
4. Re-run \`npm run build\`.
`;

  const clientSummary = `# Client Summary

The site has a working technical SEO foundation, but the biggest gains will come from fixing the highest-severity metadata, canonical, sitemap, and PageSpeed issues surfaced in this run. Search Console access is connected for \`${audit.searchConsole.siteUrl || "the configured property"}\`, which means future audits can pull live ranking data instead of relying only on crawl heuristics.

Top priorities right now:
${bullets(topFixes(issues, 5))}
`;

  await writeText(path.join(DEFAULT_REPORT_DIR, "final-seo-audit.md"), finalAudit);
  await writeText(path.join(DEFAULT_REPORT_DIR, "action-checklist.md"), actionChecklist);
  await writeText(path.join(DEFAULT_REPORT_DIR, "client-summary.md"), clientSummary);

  return {
    finalAuditPath: path.join(DEFAULT_REPORT_DIR, "final-seo-audit.md"),
    actionChecklistPath: path.join(DEFAULT_REPORT_DIR, "action-checklist.md"),
    clientSummaryPath: path.join(DEFAULT_REPORT_DIR, "client-summary.md"),
  };
}
