import fs from "fs";
import path from "path";

const root = process.cwd();
const sitemapPath = path.join(root, "src", "app", "sitemap.ts");
const servicesDir = path.join(root, "src", "app", "services");
const publicRobots = path.join(root, "public", "robots.txt");
const publicSitemap = path.join(root, "public", "sitemap.xml");

function fail(message) {
  console.error(`SITEMAP CHECK FAILED: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sitemapPath)) {
  fail("Missing src/app/sitemap.ts");
}

// Guard against stale static files
if (fs.existsSync(publicRobots)) {
  fail("public/robots.txt exists. Remove it to use the dynamic robots.ts");
}
if (fs.existsSync(publicSitemap)) {
  fail("public/sitemap.xml exists. Remove it to use the dynamic sitemap.ts");
}

// Extract service slugs from sitemap.ts
const sitemapSource = fs.readFileSync(sitemapPath, "utf8");
const serviceSlugMatches = [...sitemapSource.matchAll(/\/services\/([a-z0-9-]+)/g)];
const serviceSlugsFromSitemap = new Set(
  serviceSlugMatches.map((m) => m[1]).filter(Boolean)
);

// Extract service directory slugs from filesystem
if (!fs.existsSync(servicesDir)) {
  fail("Missing src/app/services directory");
}

const serviceSlugsFromFs = new Set(
  fs
    .readdirSync(servicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
);

const missingInSitemap = [...serviceSlugsFromFs].filter(
  (slug) => !serviceSlugsFromSitemap.has(slug)
);
const missingOnDisk = [...serviceSlugsFromSitemap].filter(
  (slug) => !serviceSlugsFromFs.has(slug)
);

if (missingInSitemap.length || missingOnDisk.length) {
  const details = [
    missingInSitemap.length
      ? `Missing in sitemap.ts: ${missingInSitemap.join(", ")}`
      : null,
    missingOnDisk.length
      ? `Missing on disk: ${missingOnDisk.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  fail(details || "Service slug mismatch");
}

console.log("Sitemap validation passed.");
