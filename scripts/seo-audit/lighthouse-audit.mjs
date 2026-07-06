import lighthouse from "lighthouse";
import fs from "node:fs/promises";
import path from "node:path";
import * as chromeLauncher from "chrome-launcher";
import { repoRoot } from "./config.mjs";
import { createIssue } from "./utils.mjs";

export async function runLighthouseAudit(siteUrl) {
  const userDataDir = path.join(repoRoot, ".codex-temp", "lighthouse-profile");
  await fs.mkdir(userDataDir, { recursive: true });
  const chrome = await chromeLauncher.launch({
    userDataDir,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const runnerResult = await lighthouse(siteUrl, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance", "seo", "accessibility", "best-practices"],
    });

    const lhr = runnerResult?.lhr;
    const performance = lhr?.categories?.performance?.score ?? null;
    const seo = lhr?.categories?.seo?.score ?? null;
    const issues = [];

    if (seo != null && seo < 0.9) {
      issues.push(
        createIssue({
          severity: seo < 0.7 ? "high" : "medium",
          category: "Technical SEO",
          title: "Lighthouse SEO checks are not clean",
          details: `Lighthouse SEO score is ${Math.round(seo * 100)}/100.`,
          fix: "Review the failing Lighthouse SEO audits and resolve the route-level issues they point to.",
          pages: [siteUrl],
          implementation: "Run the new audit script locally after metadata, canonical, and crawl fixes.",
        })
      );
    }

    return {
      lhr,
      summary: { performance, seo },
      issues,
    };
  } finally {
    await chrome.kill();
  }
}
