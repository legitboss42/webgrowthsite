const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const AUTOMATION_UA_PATTERN =
  /(bot|crawler|spider|curl|wget|python|scrapy|httpclient|axios|go-http-client|node-fetch|phantom|selenium|playwright|headless)/i;

type RateState = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateState>();
let cleanupCounter = 0;

function nowMs() {
  return Date.now();
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "unknown";
}

function isAllowedHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "webgrowth.info" || normalized === "www.webgrowth.info") return true;
  if (process.env.NODE_ENV !== "production" && normalized.startsWith("localhost")) return true;
  return false;
}

function hostFromHeaderOrUrl(value: string) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

export function getUserAgent(req: Request) {
  return (req.headers.get("user-agent") || "").trim();
}

export function isLikelyAutomationRequest(req: Request) {
  const userAgent = getUserAgent(req);
  if (!userAgent) return process.env.NODE_ENV === "production";
  return AUTOMATION_UA_PATTERN.test(userAgent);
}

export function hasJsonContentType(req: Request) {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  return contentType.includes("application/json");
}

export function isAllowedOrigin(req: Request, options?: { allowMissingOrigin?: boolean }) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  const allowMissingOrigin =
    options?.allowMissingOrigin ?? process.env.NODE_ENV !== "production";

  if (!origin) {
    if (allowMissingOrigin) {
      // Server-to-server or non-browser clients may omit origin.
      return true;
    }

    if (!referer) return false;

    const refererHost = hostFromHeaderOrUrl(referer);
    const currentHost = (host || "").toLowerCase();
    if (refererHost === currentHost) return true;
    return isAllowedHost(refererHost);
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const currentHost = (host || "").toLowerCase();

    if (originHost === currentHost) return true;
    if (isAllowedHost(originHost)) return true;
  } catch {
    return false;
  }

  return false;
}

export function checkRateLimit(key: string, max = RATE_LIMIT_MAX) {
  cleanupCounter += 1;
  if (cleanupCounter % 200 === 0) {
    const currentNow = nowMs();
    for (const [entryKey, entryValue] of rateStore.entries()) {
      if (currentNow >= entryValue.resetAt) {
        rateStore.delete(entryKey);
      }
    }
  }

  const current = rateStore.get(key);
  const currentNow = nowMs();

  if (!current || currentNow >= current.resetAt) {
    rateStore.set(key, { count: 1, resetAt: currentNow + RATE_WINDOW_MS });
    return { ok: true };
  }

  if (current.count >= max) {
    return { ok: false, retryAfterMs: current.resetAt - currentNow };
  }

  current.count += 1;
  rateStore.set(key, current);
  return { ok: true };
}

export function sanitizeText(value: unknown, maxLen = 500) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.slice(0, maxLen);
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
