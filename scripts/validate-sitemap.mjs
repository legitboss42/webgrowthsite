import fs from "fs";
import path from "path";

const root = process.cwd();
const configPath = path.join(root, "src", "lib", "sitemap-config.json");
const publicRobots = path.join(root, "public", "robots.txt");
const publicSitemap = path.join(root, "public", "sitemap.xml");
const requiredRoutes = [
  path.join(root, "src", "app", "sitemap-index.xml", "route.ts"),
  path.join(root, "src", "app", "sitemap-pages.xml", "route.ts"),
  path.join(root, "src", "app", "sitemap-blog.xml", "route.ts"),
  path.join(root, "src", "app", "robots.ts"),
];

function fail(message) {
  console.error(`SITEMAP CHECK FAILED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  fail("Missing src/lib/sitemap-config.json");
}

if (fs.existsSync(publicRobots)) {
  fail("public/robots.txt exists. Remove it to use the dynamic robots.ts");
}

if (fs.existsSync(publicSitemap)) {
  fail("public/sitemap.xml exists. Remove it to use the dynamic sitemap route");
}

for (const routePath of requiredRoutes) {
  if (!fs.existsSync(routePath)) {
    fail(`Missing route file: ${path.relative(root, routePath)}`);
  }
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const pagePaths = Array.isArray(config.pagePaths) ? config.pagePaths : [];
const blogSlugs = Array.isArray(config.blogSlugs) ? config.blogSlugs : [];

if (!pagePaths.length) {
  fail("sitemap-config.json pagePaths is empty");
}

if (!blogSlugs.length) {
  fail("sitemap-config.json blogSlugs is empty");
}

const duplicatePagePaths = pagePaths.filter((path, index) => pagePaths.indexOf(path) !== index);
const duplicateBlogSlugs = blogSlugs.filter((slug, index) => blogSlugs.indexOf(slug) !== index);

if (duplicatePagePaths.length) {
  fail(`Duplicate page paths found: ${duplicatePagePaths.join(", ")}`);
}

if (duplicateBlogSlugs.length) {
  fail(`Duplicate blog slugs found: ${duplicateBlogSlugs.join(", ")}`);
}

if (pagePaths.some((entry) => /\/home\/?$/i.test(entry))) {
  fail("pagePaths contains /home or /home/");
}

if (
  pagePaths.some((entry) =>
    ["/sitemap-index.xml", "/sitemap-pages.xml", "/sitemap-blog.xml", "/sitemap.xml"].includes(entry)
  )
) {
  fail("pagePaths contains sitemap XML URLs");
}

console.log("Sitemap validation passed.");
