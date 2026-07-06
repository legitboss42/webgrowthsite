import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "../..");

export const DEFAULT_SITE_URL = "https://webgrowth.info/";
export const DEFAULT_REPORT_DIR = path.join(repoRoot, "reports");
export const DEFAULT_PAGE_LIMIT = 40;

export const REQUIRED_TRUST_PATHS = [
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/editorial-policy/",
];

export const RECOMMENDED_TRUST_PATHS = ["/disclaimer/"];

export const PRIORITY_PATHS = [
  "/",
  "/about/",
  "/contact/",
  "/services/",
  "/portfolio/",
  "/pricing/",
  "/blog/",
];

