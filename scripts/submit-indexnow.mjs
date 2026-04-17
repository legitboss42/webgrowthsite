import fs from "fs";
import path from "path";

const SITE_URL = "https://webgrowth.info";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = "6ad51f64602a4ce3809d6559a469a62c";
const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const STATIC_URLS = [
  "/",
  "/about",
  "/launch",
  "/get-started",
  "/portfolio",
  "/pricing",
  "/faq",
  "/blog",
  "/services",
  "/contact",
  "/privacy",
  "/terms",
  "/services/business-website-design",
  "/services/landing-page-design",
  "/services/website-redesign",
  "/services/ecommerce-website-design",
  "/services/website-maintenance",
  "/services/performance-optimisation",
  "/services/website-audit",
  "/services/email-marketing-setup-strategy",
  "/services/search-engine-optimisation",
  "/services/google-my-business-setup-optimisation",
  "/services/booking-platform-setup-integration",
  "/services/crm-system-setup-configuration",
  "/services/marketing-automation-build-implementation",
  "/services/analytics-tracking-setup",
  "/services/domain-registration-hosting-guidance",
  "/services/lead-magnet-strategy-build",
];

function getBlogUrls() {
  const postsDirectory = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(postsDirectory)) return [];

  return fs
    .readdirSync(postsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.endsWith("-image-prompts.md") &&
        !entry.name.startsWith("_")
    )
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .filter(Boolean)
    .map((slug) => `/blog/${slug}`);
}

function getCliUrls() {
  return process.argv
    .slice(2)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (/^https?:\/\//i.test(value)) return value;
      return new URL(value, SITE_URL).toString();
    });
}

function getUrlsToSubmit() {
  const cliUrls = getCliUrls();
  if (cliUrls.length) return cliUrls;

  const urls = [...STATIC_URLS, ...getBlogUrls()].map((value) => new URL(value, SITE_URL).toString());
  return Array.from(new Set(urls));
}

async function submitIndexNow() {
  const urls = getUrlsToSubmit();
  const payload = {
    host: "webgrowth.info",
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls,
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IndexNow submission failed with ${response.status}: ${text}`);
  }

  console.log(`Submitted ${urls.length} URL(s) to IndexNow.`);
  urls.forEach((url) => console.log(url));
}

submitIndexNow().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
