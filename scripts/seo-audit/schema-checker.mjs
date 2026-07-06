import { createIssue } from "./utils.mjs";

function flattenJsonLd(node) {
  if (Array.isArray(node)) return node.flatMap(flattenJsonLd);
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node["@graph"])) return node["@graph"].flatMap(flattenJsonLd);
  return [node];
}

export function runSchemaChecks(crawl) {
  const issues = [];
  const invalid = [];
  const missing = [];
  const types = new Map();

  for (const page of crawl.pages) {
    if (!page.ok) continue;
    if (!page.jsonLd.length) {
      missing.push(page.url);
      continue;
    }
    for (const item of page.jsonLd) {
      if (!item.valid) {
        invalid.push(page.url);
        continue;
      }
      for (const entry of flattenJsonLd(item.parsed)) {
        const type = entry?.["@type"];
        if (!type) continue;
        const values = Array.isArray(type) ? type : [type];
        for (const value of values) {
          types.set(value, (types.get(value) ?? 0) + 1);
        }
      }
    }
  }

  if (invalid.length) {
    issues.push(
      createIssue({
        severity: "high",
        category: "Schema",
        title: "Some JSON-LD blocks are invalid",
        details:
          "Broken structured data prevents Google from using rich-result hints and weakens trust signals.",
        fix: "Validate every JSON-LD block and ensure it matches visible page content.",
        pages: [...new Set(invalid)],
        implementation:
          "Review StructuredData usage and the schema helpers in src/lib/seo.ts.",
      })
    );
  }

  if (missing.length) {
    issues.push(
      createIssue({
        severity: "medium",
        category: "Schema",
        title: "Some pages have no JSON-LD schema",
        details:
          "Not every page needs rich schema, but key landing pages should expose clear organization and page-level context.",
        fix: "Add appropriate schema to high-value service, about, and content pages where it supports the visible content.",
        pages: missing.slice(0, 12),
        implementation: "Use shared helpers from src/lib/seo.ts and page-level StructuredData components.",
      })
    );
  }

  return { issues, types: Object.fromEntries(types) };
}
