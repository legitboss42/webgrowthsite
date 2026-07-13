import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const governance = JSON.parse(
  await fs.readFile(path.join(root, "src/lib/route-governance.json"), "utf8")
);

function wordCount(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|~-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function internalLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\((\/[^)#?]+)(?:[?#][^)]*)?\)/g)].map(
    (match) => match[1]
  );
}

const rows = [];
for (const article of governance.articles.filter((item) => item.status === "INDEX")) {
  const file = path.join(root, "content/blog", `${article.slug}.md`);
  const parsed = matter(await fs.readFile(file, "utf8"));
  const links = internalLinks(parsed.content);
  const evidence = [parsed.data.evidenceNote, parsed.data.methodologyNote]
    .filter(Boolean)
    .join(" ");
  const numericClaims = (parsed.content.match(/\b\d+(?:\.\d+)?(?:%|x|×|k|m)?\b/gi) || []).length;
  const relatedLinks = new Set(links.filter((link) => link.startsWith("/blog/")));
  const declaredRelated = Array.isArray(parsed.data.relatedGuideSlugs)
    ? parsed.data.relatedGuideSlugs.length
    : 0;
  const genericTrust = /updated using observed implementation patterns|recurring project outcomes|execution quality improves when|sustained results depend|priority one is/i.test(
    `${parsed.data.evidenceNote || ""} ${parsed.data.methodologyNote || ""} ${(parsed.data.keyTakeaways || []).join(" ")}`
  );
  const words = wordCount(parsed.content);
  const automatedPass =
    words >= 700 &&
    !genericTrust &&
    Math.max(relatedLinks.size, declaredRelated) >= 2;

  rows.push({
    slug: article.slug,
    intent: parsed.data.searchIntent || "MISSING",
    words,
    evidence: evidence ? "Present - verify specificity" : "Missing",
    claimReview: numericClaims ? `${numericClaims} numeric references to review` : "No numeric references",
    screenshots: /!\[[^\]]*\]\([^)]*\)/.test(parsed.content) ? "Yes" : "No",
    links: Math.max(relatedLinks.size, declaredRelated),
    gsc: "Not verified in this run",
    overlap: "Governed intent retained; confirm with GSC when available",
    status: automatedPass ? "Automated checks pass" : "Editorial review required",
  });
}

const lines = [
  "# Indexed Content Quality Ledger",
  "",
  `Generated: ${new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date())}`,
  "",
  "Search Console fields remain explicitly unverified until authenticated account data is inspected. Word count and link fields are generated from the current Markdown source; evidence and claims still require human editorial judgment.",
  "",
  "| Article | Search intent | Words | Evidence | Claims | Images | Related blog links | GSC | Overlap | Rewrite status |",
  "|---|---|---:|---|---|---|---:|---|---|---|",
  ...rows.map(
    (row) =>
      `| [${row.slug}](/blog/${row.slug}/) | ${String(row.intent).replaceAll("|", "\\|")} | ${row.words} | ${row.evidence} | ${row.claimReview} | ${row.screenshots} | ${row.links} | ${row.gsc} | ${row.overlap} | ${row.status} |`
  ),
  "",
  "## Completion rule",
  "",
  "An article may be marked complete only after its search intent, overlap, evidence, claims, links, and rendered mobile/desktop presentation have been reviewed. Length is a review trigger, not an approval score.",
  "",
];

await fs.mkdir(path.join(root, "reports"), { recursive: true });
await fs.writeFile(path.join(root, "reports/content-quality-ledger.md"), lines.join("\n"));
console.log(`Content ledger generated for ${rows.length} indexed articles.`);
