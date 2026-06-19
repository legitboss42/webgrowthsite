import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const governancePath = path.join(root, "src", "lib", "route-governance.json");
const contentDirectory = path.join(root, "content", "blog");
const appDirectory = path.join(root, "src", "app");
const requiredRoutes = [
  "src/app/sitemap-index.xml/route.ts",
  "src/app/sitemap-pages.xml/route.ts",
  "src/app/sitemap-blog.xml/route.ts",
  "src/app/robots.ts",
];
const validStatuses = new Set(["INDEX", "NOINDEX", "REDIRECT", "REMOVE"]);

function fail(message) {
  throw new Error(`SITEMAP CHECK FAILED: ${message}`);
}

function walk(directory, filename, results = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, filename, results);
    if (entry.isFile() && entry.name === filename) results.push(absolute);
  }
  return results;
}

function pageFileToRoute(file) {
  const relative = path.relative(appDirectory, file).replace(/\\/g, "/");
  if (relative === "page.tsx") return "/";
  const route = relative.replace(/\/page\.tsx$/, "");
  return `/${route}/`;
}

if (!fs.existsSync(governancePath)) fail("Missing src/lib/route-governance.json");
for (const relative of requiredRoutes) {
  if (!fs.existsSync(path.join(root, relative))) fail(`Missing route file: ${relative}`);
}

const governance = JSON.parse(fs.readFileSync(governancePath, "utf8"));
const routes = Array.isArray(governance.routes) ? governance.routes : [];
const articles = Array.isArray(governance.articles) ? governance.articles : [];
const routePaths = routes.map((route) => route.path);
const articleSlugs = articles.map((article) => article.slug);

if (new Set(routePaths).size !== routePaths.length) fail("Duplicate governed route paths found");
if (new Set(articleSlugs).size !== articleSlugs.length) fail("Duplicate governed article slugs found");

for (const entry of [...routes, ...articles]) {
  if (!validStatuses.has(entry.status)) fail(`Invalid status on ${entry.path || entry.slug}`);
  if (entry.status === "INDEX" && entry.sitemap !== true) {
    fail(`Indexed entry is excluded from sitemap: ${entry.path || entry.slug}`);
  }
  if (entry.status !== "INDEX" && entry.sitemap !== false) {
    fail(`Non-index entry is included in sitemap: ${entry.path || entry.slug}`);
  }
  if (entry.status === "REDIRECT" && !entry.destination) {
    fail(`Redirect has no destination: ${entry.path || entry.slug}`);
  }
}

const markdownSlugs = fs
  .readdirSync(contentDirectory, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      !entry.name.startsWith("_") &&
      !entry.name.endsWith("-image-prompts.md")
  )
  .map((entry) => entry.name.replace(/\.md$/, ""));

for (const slug of markdownSlugs) {
  if (!articleSlugs.includes(slug)) fail(`Ungoverned article: ${slug}`);
}
for (const article of articles) {
  if (!markdownSlugs.includes(article.slug)) fail(`Governed article file missing: ${article.slug}`);
}

const indexedArticles = articles.filter((article) => article.status === "INDEX");
const indexedArticleSlugs = new Set(indexedArticles.map((article) => article.slug));
const seenTitles = new Map();
const seenSeoTitles = new Map();
const seenKeywords = new Map();

for (const article of indexedArticles) {
  const filePath = path.join(contentDirectory, `${article.slug}.md`);
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const requiredTextFields = [
    "title",
    "seoTitle",
    "excerpt",
    "primaryKeyword",
    "searchIntent",
    "cover",
    "coverAlt",
    "author",
    "reviewedBy",
  ];

  for (const field of requiredTextFields) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      fail(`Indexed article ${article.slug} is missing ${field}`);
    }
  }
  if (!data.updatedAt && !data.lastReviewedAt) {
    fail(`Indexed article ${article.slug} needs updatedAt or lastReviewedAt`);
  }
  if (!Array.isArray(data.faq) || data.faq.length < 2) {
    fail(`Indexed article ${article.slug} needs at least 2 visible FAQs`);
  }
  if (!Array.isArray(data.relatedGuideSlugs) || data.relatedGuideSlugs.length < 2) {
    fail(`Indexed article ${article.slug} needs at least 2 related guides`);
  }
  for (const relatedSlug of data.relatedGuideSlugs) {
    if (!indexedArticleSlugs.has(relatedSlug)) {
      fail(`Indexed article ${article.slug} links to non-indexed guide ${relatedSlug}`);
    }
  }

  const cover = data.cover.trim();
  if (cover.toLowerCase().endsWith(".svg")) {
    fail(`Indexed article ${article.slug} uses an SVG cover`);
  }
  const coverPath = path.join(root, "public", cover.replace(/^\//, ""));
  if (!fs.existsSync(coverPath)) fail(`Cover file missing for ${article.slug}: ${cover}`);

  const internalLinks = [...content.matchAll(/\]\((\/[A-Za-z0-9_?&=.#\/-]+)\)/g)].map(
    (match) => match[1]
  );
  if (new Set(internalLinks).size < 3) {
    fail(`Indexed article ${article.slug} needs at least 3 contextual internal links`);
  }
  if (!internalLinks.some((href) => href.startsWith("/services/"))) {
    fail(`Indexed article ${article.slug} needs a contextual service link`);
  }

  for (const [label, value, seen] of [
    ["title", data.title, seenTitles],
    ["SEO title", data.seoTitle, seenSeoTitles],
    ["primary keyword", data.primaryKeyword.toLowerCase(), seenKeywords],
  ]) {
    const duplicate = seen.get(value);
    if (duplicate) fail(`Duplicate ${label}: ${article.slug} and ${duplicate}`);
    seen.set(value, article.slug);
  }
}

const governedPageRoutes = new Set(routes.map((route) => route.path));
for (const file of walk(appDirectory, "page.tsx")) {
  const route = pageFileToRoute(file);
  if (route === "/blog/[slug]/") continue;
  if (!governedPageRoutes.has(route)) fail(`Ungoverned App Router page: ${route}`);
}

const indexedDestinations = new Set([
  ...routes.filter((route) => route.status === "INDEX" || route.status === "NOINDEX").map((route) => route.path),
  ...articles.filter((article) => article.status === "INDEX").map((article) => `/blog/${article.slug}/`),
  "/sitemap-index.xml",
]);
for (const route of routes.filter((entry) => entry.status === "REDIRECT")) {
  if (!indexedDestinations.has(route.destination)) {
    fail(`Redirect destination is not governed: ${route.path} -> ${route.destination}`);
  }
}
for (const article of articles.filter((entry) => entry.status === "REDIRECT")) {
  if (!indexedDestinations.has(article.destination)) {
    fail(`Article redirect destination is not indexed: ${article.slug} -> ${article.destination}`);
  }
}

console.log("Sitemap validation passed.");
console.log(`Governed routes: ${routes.length}`);
console.log(`Indexed pages: ${routes.filter((route) => route.status === "INDEX").length}`);
console.log(`Indexed articles: ${indexedArticles.length}`);
