import { createIssue } from "./utils.mjs";

async function fetchPsi(siteUrl, strategy, apiKey) {
  const url = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  url.searchParams.set("url", siteUrl);
  url.searchParams.append("category", "performance");
  url.searchParams.append("category", "seo");
  url.searchParams.append("category", "accessibility");
  url.searchParams.append("category", "best-practices");
  url.searchParams.set("strategy", strategy);
  if (apiKey) url.searchParams.set("key", apiKey);
  const response = await fetch(url.toString());
  const json = await response.json();
  return { response, json };
}

function metricValue(metric) {
  return metric?.percentile ? metric.percentile / 1000 : null;
}

function auditRef(audits, key) {
  const audit = audits?.[key];
  if (!audit) return null;
  return {
    score: audit.score,
    value: audit.displayValue || audit.numericValue || null,
    title: audit.title,
  };
}

export async function runPageSpeedAudit(siteUrl, apiKey) {
  const mobile = await fetchPsi(siteUrl, "mobile", apiKey);
  const desktop = await fetchPsi(siteUrl, "desktop", apiKey);
  const issues = [];

  const mobileScore = mobile.json?.lighthouseResult?.categories?.performance?.score ?? null;
  const desktopScore = desktop.json?.lighthouseResult?.categories?.performance?.score ?? null;

  if (mobileScore != null && mobileScore < 0.5) {
    issues.push(
      createIssue({
        severity: "critical",
        category: "Core Web Vitals",
        title: "Mobile PageSpeed performance is poor",
        details: `The mobile PageSpeed performance score is ${Math.round(mobileScore * 100)}/100.`,
        fix: "Reduce render-blocking work, trim JavaScript, optimize above-the-fold media, and simplify costly UI effects.",
        pages: [siteUrl],
        implementation:
          "Review client components, image delivery, script loading, and animation cost in the App Router pages.",
      })
    );
  }

  return {
    mobile,
    desktop,
    coreWebVitals: {
      mobileLcp: metricValue(mobile.json?.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS),
      mobileInp: metricValue(mobile.json?.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT),
      mobileCls:
        mobile.json?.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
          ? mobile.json.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
          : null,
    },
    summary: {
      mobilePerformance: mobileScore,
      desktopPerformance: desktopScore,
      mobileSeo: mobile.json?.lighthouseResult?.categories?.seo?.score ?? null,
      desktopSeo: desktop.json?.lighthouseResult?.categories?.seo?.score ?? null,
      audits: {
        mobileLcp: auditRef(mobile.json?.lighthouseResult?.audits, "largest-contentful-paint"),
        mobileTbt: auditRef(mobile.json?.lighthouseResult?.audits, "total-blocking-time"),
        mobileSpeedIndex: auditRef(mobile.json?.lighthouseResult?.audits, "speed-index"),
        desktopLcp: auditRef(desktop.json?.lighthouseResult?.audits, "largest-contentful-paint"),
      },
    },
    issues,
  };
}
