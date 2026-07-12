import { google } from "googleapis";
import { createIssue } from "./utils.mjs";

function envValue(name) {
  const raw = process.env[name]?.trim() || "";
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function topRows(rows, mapper, limit = 10) {
  return (rows || []).slice(0, limit).map(mapper);
}

export async function runSearchConsoleAudit() {
  const clientEmail = envValue("GOOGLE_CLIENT_EMAIL");
  const privateKey = envValue("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const siteUrl = envValue("GSC_SITE_URL");

  if (!clientEmail || !privateKey || !siteUrl) {
    return {
      configured: false,
      issues: [
        createIssue({
          severity: "critical",
          category: "Search Console",
          title: "Search Console credentials are not fully configured",
          details:
            "GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GSC_SITE_URL are required for Search Console API access.",
          fix: "Complete the service-account setup and save the values in .env.local.",
          pages: [],
          implementation: "Configure Search Console credentials in the local environment and re-run the audit.",
        }),
      ],
    };
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  const searchconsole = google.searchconsole({ version: "v1", auth });
  const issues = [];

  try {
    const [pageResponse, queryResponse, queryPageResponse] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          dimensions: ["page"],
          rowLimit: 25,
        },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          dimensions: ["query"],
          rowLimit: 25,
        },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          dimensions: ["query", "page"],
          rowLimit: 100,
        },
      }),
    ]);

    const queryPageRows = queryPageResponse.data.rows || [];
    const lowCtrRows = queryPageRows
      .filter((row) => row.impressions >= 20 && row.position <= 20 && row.ctr < 0.03)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);
    const strikingDistanceRows = queryPageRows
      .filter((row) => row.position >= 8 && row.position <= 20)
      .sort((a, b) => a.position - b.position)
      .slice(0, 10);

    if (!pageResponse.data.rows?.length) {
      issues.push(
        createIssue({
          severity: "medium",
          category: "Search Console",
          title: "Search Console is connected but has little or no page data",
          details:
            "The API call succeeded, but there were no page-level search analytics rows for the selected date range.",
          fix: "Keep the property connected, submit fresh sitemaps, and give Google time to collect data.",
          pages: [siteUrl],
          implementation: "Re-run the audit after the site has more Search Console history.",
        })
      );
    }

    return {
      configured: true,
      siteUrl,
      issues,
      topPages: topRows(pageResponse.data.rows, (row) => ({
        page: row.keys?.[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      topQueries: topRows(queryResponse.data.rows, (row) => ({
        query: row.keys?.[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      lowCtrOpportunities: lowCtrRows.map((row) => ({
        query: row.keys?.[0],
        page: row.keys?.[1],
        ctr: row.ctr,
        impressions: row.impressions,
        position: row.position,
      })),
      pagesRanking8To20: strikingDistanceRows.map((row) => ({
        query: row.keys?.[0],
        page: row.keys?.[1],
        position: row.position,
        impressions: row.impressions,
        clicks: row.clicks,
      })),
    };
  } catch (error) {
    return {
      configured: true,
      failed: true,
      issues: [
        createIssue({
          severity: "critical",
          category: "Search Console",
          title: "Search Console API request failed",
          details: error.message,
          fix: "Verify the service account key is valid, the property URL matches GSC_SITE_URL, and the service account has access in Search Console.",
          pages: [siteUrl],
          implementation: "Double-check the Search Console property user list and the .env.local credentials.",
        }),
      ],
    };
  }
}
