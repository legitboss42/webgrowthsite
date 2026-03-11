const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

type RateState = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateState>();

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

export function isAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    // Server-to-server or non-browser clients may omit origin.
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host.toLowerCase();
    const currentHost = (host || "").toLowerCase();

    if (originHost === currentHost) return true;
    if (originHost === "webgrowth.info" || originHost === "www.webgrowth.info") {
      return true;
    }
    if (process.env.NODE_ENV !== "production" && originHost.startsWith("localhost")) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function checkRateLimit(key: string, max = RATE_LIMIT_MAX) {
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

