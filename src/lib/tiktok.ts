import { absoluteUrl } from "@/lib/site";

const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_STATE_COOKIE = "wg_tiktok_oauth_state";
const TIKTOK_CONNECTION_COOKIE = "wg_tiktok_connection";
const TIKTOK_DEFAULT_RETURN_PATH = "/connect/tiktok/";
const TIKTOK_CALLBACK_PATH = "/connect/tiktok/callback/";
const TIKTOK_SCOPE_LIST = ["user.info.basic", "video.upload"] as const;
const TIKTOK_SCOPE_VALUE = TIKTOK_SCOPE_LIST.join(",");
const TIKTOK_STATE_TTL_SECONDS = 10 * 60;
const TIKTOK_CONNECTION_TTL_SECONDS = 24 * 60 * 60;

type TikTokStatePayload = {
  state: string;
  returnTo: string;
  issuedAt: number;
};

type TikTokConnectionSummary = {
  openId: string;
  scope: string;
  connectedAt: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

type TikTokTokenSuccess = {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

type TikTokTokenError = {
  error?: string;
  error_description?: string;
};

type TikTokTokenResponse = TikTokTokenSuccess & TikTokTokenError;

type TikTokCallbackResult =
  | { ok: true; summary: TikTokConnectionSummary }
  | { ok: false; message: string };

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseJsonCookie<T>(value: string | undefined): T | null {
  if (!value) return null;

  try {
    return JSON.parse(base64UrlDecode(value)) as T;
  } catch {
    return null;
  }
}

function serializeCookieValue(value: object) {
  return base64UrlEncode(JSON.stringify(value));
}

export function getTikTokClientKey() {
  return process.env.TIKTOK_CLIENT_KEY?.trim() || "";
}

function getTikTokClientSecret() {
  return process.env.TIKTOK_CLIENT_SECRET?.trim() || "";
}

export function getTikTokRedirectUri() {
  return process.env.TIKTOK_REDIRECT_URI?.trim() || absoluteUrl(TIKTOK_CALLBACK_PATH);
}

export function getTikTokRequiredScopes() {
  return TIKTOK_SCOPE_LIST;
}

export function getTikTokAuthorizePath() {
  return "/api/tiktok/authorize";
}

export function getTikTokConnectPath() {
  return TIKTOK_DEFAULT_RETURN_PATH;
}

export function getTikTokStateCookieName() {
  return TIKTOK_STATE_COOKIE;
}

export function getTikTokConnectionCookieName() {
  return TIKTOK_CONNECTION_COOKIE;
}

export function isTikTokConfigured() {
  return Boolean(getTikTokClientKey() && getTikTokClientSecret());
}

export function buildTikTokStatePayload(returnTo?: string) {
  return {
    state: crypto.randomUUID(),
    returnTo: normalizeReturnPath(returnTo),
    issuedAt: Date.now(),
  } satisfies TikTokStatePayload;
}

export function serializeTikTokStateCookie(payload: TikTokStatePayload) {
  return serializeCookieValue(payload);
}

export function readTikTokStateCookie(value: string | undefined) {
  return parseJsonCookie<TikTokStatePayload>(value);
}

export function serializeTikTokConnectionCookie(summary: TikTokConnectionSummary) {
  return serializeCookieValue(summary);
}

export function readTikTokConnectionCookie(value: string | undefined) {
  return parseJsonCookie<TikTokConnectionSummary>(value);
}

export function getTikTokStateTtlSeconds() {
  return TIKTOK_STATE_TTL_SECONDS;
}

export function getTikTokConnectionTtlSeconds() {
  return TIKTOK_CONNECTION_TTL_SECONDS;
}

export function buildTikTokAuthorizeUrl(state: string) {
  const url = new URL(TIKTOK_AUTHORIZE_URL);
  url.searchParams.set("client_key", getTikTokClientKey());
  url.searchParams.set("redirect_uri", getTikTokRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", TIKTOK_SCOPE_VALUE);
  url.searchParams.set("state", state);
  return url.toString();
}

export function normalizeReturnPath(value?: string | null) {
  if (!value) return TIKTOK_DEFAULT_RETURN_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return TIKTOK_DEFAULT_RETURN_PATH;
  return value;
}

export function maskOpenId(openId: string) {
  if (openId.length <= 8) return openId;
  return `${openId.slice(0, 4)}...${openId.slice(-4)}`;
}

export async function exchangeTikTokCode(code: string): Promise<TikTokCallbackResult> {
  const clientKey = getTikTokClientKey();
  const clientSecret = getTikTokClientSecret();
  const redirectUri = getTikTokRedirectUri();

  if (!clientKey || !clientSecret) {
    return {
      ok: false,
      message:
        "TikTok client credentials are not configured on the server yet. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET before testing the callback exchange.",
    };
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-store",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as TikTokTokenResponse | null;

  if (!response.ok || !payload?.open_id) {
    const message =
      payload?.error_description ||
      payload?.error ||
      "TikTok did not return a usable access token response.";

    return {
      ok: false,
      message,
    };
  }

  return {
    ok: true,
    summary: {
      openId: payload.open_id,
      scope: payload.scope || TIKTOK_SCOPE_VALUE,
      connectedAt: new Date().toISOString(),
      expiresIn: payload.expires_in,
      refreshExpiresIn: payload.refresh_expires_in,
    },
  };
}
