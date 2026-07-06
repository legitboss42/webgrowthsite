import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SITE_URL, repoRoot } from "./config.mjs";
import { crawlSite } from "./crawler.mjs";
import { runMetadataChecks } from "./metadata-checker.mjs";
import { runCanonicalChecks } from "./canonical-checker.mjs";
import { checkRobots } from "./robots-checker.mjs";
import { checkSitemaps } from "./sitemap-checker.mjs";
import { runSchemaChecks } from "./schema-checker.mjs";
import { runPageSpeedAudit } from "./pagespeed-audit.mjs";
import { runLighthouseAudit } from "./lighthouse-audit.mjs";
import { runSearchConsoleAudit } from "./search-console.mjs";
import { writeReports } from "./report-generator.mjs";
import { sortIssues, writeJson } from "./utils.mjs";

async function loadEnvFile() {
  const envPath = path.join(repoRoot, ".env.local");
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {}
}

function readManualSearchConsoleSummary() {
  return {
    indexedPages: 38,
    notIndexedPages: 37,
    source: "Manual Search Console UI check for https://webgrowth.info/ on 2026-07-04",
  };
}

async function main() {
  await loadEnvFile();
  const cliUrl = process.argv[2];
  const siteUrl = cliUrl || DEFAULT_SITE_URL;
  const apiKey = process.env.PAGESPEED_API_KEY?.trim() || "";

  const crawl = await crawlSite(siteUrl);
  const robots = await checkRobots(siteUrl);
  const sitemap = await checkSitemaps(siteUrl);
  const pagespeed = await runPageSpeedAudit(siteUrl, apiKey);
  const lighthouse = await runLighthouseAudit(siteUrl);
  const searchConsole = await runSearchConsoleAudit();
  const schema = runSchemaChecks(crawl);

  const issues = sortIssues([
    ...runMetadataChecks(crawl),
    ...runCanonicalChecks(crawl),
    ...robots.issues,
    ...sitemap.issues,
    ...schema.issues,
    ...pagespeed.issues,
    ...lighthouse.issues,
    ...(searchConsole.issues || []),
  ]);

  const audit = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    crawl,
    robots,
    sitemap,
    pagespeed: pagespeed.summary ? pagespeed : { ...pagespeed, summary: {} },
    lighthouse,
    searchConsole,
    schema,
    issues,
    manualSearchConsole: readManualSearchConsoleSummary(),
  };

  const reportPaths = await writeReports(audit);
  await writeJson(path.join(repoRoot, "reports", "seo-audit-debug.json"), audit);

  console.log(`SEO audit complete for ${siteUrl}`);
  console.log(`Issues found: ${issues.length}`);
  console.log(`Final report: ${reportPaths.finalAuditPath}`);
  console.log(`Action checklist: ${reportPaths.actionChecklistPath}`);
  console.log(`Client summary: ${reportPaths.clientSummaryPath}`);
}

main().catch((error) => {
  console.error(`SEO audit failed: ${error.message}`);
  process.exit(1);
});
