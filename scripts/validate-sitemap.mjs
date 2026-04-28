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

const expectedPagePaths = [
  "/",
  "/about/",
  "/contact/",
  "/portfolio/",
  "/pricing/",
  "/faq/",
  "/services/",
  "/local-business/",
  "/ecommerce/",
  "/website-design-lagos/",
  "/services/business-website-design/",
  "/services/landing-page-design/",
  "/services/website-redesign/",
  "/services/ecommerce-website-design/",
  "/services/performance-optimisation/",
  "/services/website-audit/",
];

const expectedBlogSlugs = [
  "homepage-structure-that-converts-visitors-into-customers",
  "why-your-website-isnt-getting-leads",
  "high-converting-landing-pages-guide",
  "how-to-build-a-small-business-website-that-converts",
  "high-converting-service-page",
  "website-redesign-cost-breakdown-nigeria",
  "how-to-audit-slow-wordpress-site",
  "conversion-audit-checklist-service-homepage",
  "small-business-website-redesign-checklist",
  "04-writing-service-pages-that-convert",
  "05-premium-design-without-slow-pages",
  "03-seo-migration-without-losing-traffic",
];

const forbiddenPagePaths = new Set([
  "/editorial-policy/",
  "/launch/",
  "/website-build/",
  "/hosting-offer/",
  "/get-started/",
  "/privacy/",
  "/terms/",
  "/website-design-united-kingdom/",
  "/web-design-for-real-estate-lagos/",
  "/services/email-marketing-setup-strategy/",
  "/services/search-engine-optimisation/",
  "/services/google-my-business-setup-optimisation/",
  "/services/booking-platform-setup-integration/",
  "/services/crm-system-setup-configuration/",
  "/services/marketing-automation-build-implementation/",
  "/services/analytics-tracking-setup/",
  "/services/domain-registration-hosting-guidance/",
  "/services/lead-magnet-strategy-build/",
  "/services/website-maintenance/",
  "/home",
  "/home/",
  "/sitemap.xml",
  "/sitemap-index.xml",
  "/sitemap-index.xml/",
  "/sitemap-pages.xml",
  "/sitemap-blog.xml",
]);

const forbiddenBlogSlugs = new Set([
  "ga4-meta-tiktok-clarity-setup-guide",
  "website-platform-comparison-small-business",
  "how-to-plan-website-copy-before-hiring-developer",
  "small-business-website-launch-ga-checklist",
  "local-seo-basics-service-business-lagos",
  "google-business-profile-optimization-checklist",
  "landing-page-wireframe-local-service-business",
  "website-tracking-setup-for-small-businesses",
  "08-results-mistakes-and-reusable-playbook",
  "07-launch-week-checklist-and-first-7-days",
  "06-nextjs-architecture-and-build-decisions",
  "02-the-audit-that-created-the-roadmap",
  "01-why-we-rebuilt-not-redesigned",
  "jluxe-website-redesign-series-announcement",
  "website-launch-checklist-for-small-businesses",
  "email-automation-architecture",
  "jluxe-medical-aesthetics-case-study",
  "stop-using-cheap-hosting",
  "email-marketing-for-small-business",
  "local-seo-for-small-business-google-maps-ranking-guide",
  "small-business-website-seo-checklist",
  "how-to-make-your-website-load-fast",
  "namecheap-domain-and-hosting-guide",
  "best-web-hosting-for-small-business-websites",
]);

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

const duplicatePagePaths = pagePaths.filter((entry, index) => pagePaths.indexOf(entry) !== index);
const duplicateBlogSlugs = blogSlugs.filter((entry, index) => blogSlugs.indexOf(entry) !== index);

if (duplicatePagePaths.length) {
  fail(`Duplicate page paths found: ${duplicatePagePaths.join(", ")}`);
}

if (duplicateBlogSlugs.length) {
  fail(`Duplicate blog slugs found: ${duplicateBlogSlugs.join(", ")}`);
}

if (pagePaths.some((entry) => /\/home\/?$/i.test(entry))) {
  fail("pagePaths contains /home or /home/");
}

if (pagePaths.length !== expectedPagePaths.length) {
  fail(`pagePaths must contain exactly ${expectedPagePaths.length} entries, found ${pagePaths.length}`);
}

if (blogSlugs.length !== expectedBlogSlugs.length) {
  fail(`blogSlugs must contain exactly ${expectedBlogSlugs.length} entries, found ${blogSlugs.length}`);
}

if (
  pagePaths.some((entry) =>
    ["/sitemap-index.xml", "/sitemap-pages.xml", "/sitemap-blog.xml", "/sitemap.xml"].includes(entry)
  )
) {
  fail("pagePaths contains sitemap XML URLs");
}

if (pagePaths.some((entry) => forbiddenPagePaths.has(entry))) {
  fail("pagePaths contains forbidden URLs");
}

if (blogSlugs.some((entry) => forbiddenBlogSlugs.has(entry))) {
  fail("blogSlugs contains forbidden URLs");
}

if (JSON.stringify(pagePaths) !== JSON.stringify(expectedPagePaths)) {
  fail("pagePaths does not match the required 16-URL allowlist");
}

if (JSON.stringify(blogSlugs) !== JSON.stringify(expectedBlogSlugs)) {
  fail("blogSlugs does not match the required 12-URL allowlist");
}

console.log("Sitemap validation passed.");
