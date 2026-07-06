import { createIssue } from "./utils.mjs";

export function runMetadataChecks(crawl) {
  const issues = [];
  const titleIssues = crawl.pages.filter(
    (page) => page.ok && (!page.title || page.title.length < 30 || page.title.length > 65)
  );
  const descriptionIssues = crawl.pages.filter(
    (page) =>
      page.ok &&
      (!page.metaDescription ||
        page.metaDescription.length < 70 ||
        page.metaDescription.length > 165)
  );
  const h1Issues = crawl.pages.filter((page) => page.ok && !page.h1);

  if (titleIssues.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Metadata",
        title: "Some pages have weak or missing title tags",
        details:
          "Title tags outside the usual 30-65 character range reduce click-through clarity and can weaken Google snippet control.",
        fix: "Tighten page titles so each one matches the primary intent and stays within a readable SERP length.",
        pages: titleIssues.map((page) => page.url),
        implementation:
          "Update page metadata inputs passed to buildPageMetadata() or the route-level metadata exports in src/app/*/page.tsx.",
      })
    );
  }

  if (descriptionIssues.length) {
    issues.push(
      createIssue({
        severity: "medium",
        category: "Metadata",
        title: "Some pages have weak or missing meta descriptions",
        details:
          "Missing or thin meta descriptions make snippets less persuasive and reduce click-through opportunities.",
        fix: "Write page-specific descriptions that reflect the visible content, outcome, and target user intent.",
        pages: descriptionIssues.map((page) => page.url),
        implementation:
          "Adjust description fields in buildPageMetadata() usage so each route has a unique summary.",
      })
    );
  }

  if (h1Issues.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Metadata",
        title: "Some pages are missing an H1",
        details:
          "Pages without a clear H1 weaken content hierarchy, accessibility, and query-to-page relevance.",
        fix: "Ensure every indexable page renders one visible, intent-matched H1 near the top of main content.",
        pages: h1Issues.map((page) => page.url),
        implementation: "Update page templates or route-level content components in src/components and src/app.",
      })
    );
  }

  return issues;
}
