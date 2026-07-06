import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

export function normalizeUrl(input) {
  const url = new URL(input);
  if (!url.pathname) url.pathname = "/";
  if (!url.pathname.endsWith("/") && !/\.[^/]+$/.test(url.pathname)) {
    url.pathname = `${url.pathname}/`;
  }
  url.hash = "";
  return url.toString();
}

export function sameOrigin(baseUrl, candidate) {
  return new URL(candidate).origin === new URL(baseUrl).origin;
}

export function toAbsoluteUrl(baseUrl, href) {
  try {
    return normalizeUrl(new URL(href, baseUrl).toString());
  } catch {
    return null;
  }
}

export function loadHtml(html) {
  return load(html, { xmlMode: false, decodeEntities: false });
}

export async function fetchText(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  return { response, text };
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, "utf8");
}

export function scoreToLabel(score) {
  if (score == null) return "Unavailable";
  if (score >= 0.9) return "Good";
  if (score >= 0.5) return "Needs work";
  return "Poor";
}

export function severityFromImpact(impact) {
  if (impact >= 90) return "critical";
  if (impact >= 70) return "high";
  if (impact >= 40) return "medium";
  return "low";
}

export function unique(values) {
  return [...new Set(values)];
}

export function textOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createIssue({
  severity = "medium",
  category,
  title,
  details,
  fix,
  pages = [],
  implementation = "",
}) {
  return { severity, category, title, details, fix, pages, implementation };
}

export function sortIssues(issues) {
  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...issues].sort((a, b) => {
    const diff = (weights[b.severity] ?? 0) - (weights[a.severity] ?? 0);
    if (diff) return diff;
    return a.title.localeCompare(b.title);
  });
}

export function bucketIssues(issues) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical"),
    high: issues.filter((issue) => issue.severity === "high"),
    medium: issues.filter((issue) => issue.severity === "medium"),
    low: issues.filter((issue) => issue.severity === "low"),
  };
}

export function bullets(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function truncate(text, length = 140) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
