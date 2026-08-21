import { absoluteUrl } from "@/lib/site";
import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const TIKTOK_AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_PHOTO_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/content/init/";
const TIKTOK_PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
const TIKTOK_STATE_COOKIE = "wg_tiktok_oauth_state";
const TIKTOK_CONNECTION_COOKIE = "wg_tiktok_connection";
const TIKTOK_TOKEN_COOKIE = "wg_tiktok_tokens";
const TIKTOK_DEFAULT_RETURN_PATH = "/connect/tiktok/";
const TIKTOK_CALLBACK_PATH = "/connect/tiktok/callback/";
const TIKTOK_SCOPE_MAP = {
  login: ["user.info.basic"],
  publishing: ["user.info.basic", "video.upload"],
} as const;
const TIKTOK_STATE_TTL_SECONDS = 10 * 60;
const TIKTOK_CONNECTION_TTL_SECONDS = 30 * 24 * 60 * 60;
const TIKTOK_CONNECTION_TTL_CAP_SECONDS = 90 * 24 * 60 * 60;

export type TikTokScopeMode = keyof typeof TIKTOK_SCOPE_MAP;

type TikTokStatePayload = {
  state: string;
  returnTo: string;
  issuedAt: number;
  scopeMode: TikTokScopeMode;
};

export type TikTokConnectionSummary = {
  openId: string;
  scope: string;
  connectedAt: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

export type TikTokConnectionRecord = TikTokConnectionSummary & {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
};

export type TikTokPublishStatus = {
  downloadedBytes?: number;
  failReason?: string;
  publiclyAvailablePostIds: Array<number | string>;
  status: string;
  uploadedBytes?: number;
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

type TikTokApiErrorPayload = {
  error?: {
    code?: string;
    log_id?: string;
    message?: string;
  };
};

type TikTokPhotoDraftResponse = {
  data?: {
    publish_id?: string;
  };
} & TikTokApiErrorPayload;

type TikTokPublishStatusResponse = {
  data?: {
    downloaded_bytes?: number;
    fail_reason?: string;
    publicaly_available_post_id?: Array<number | string>;
    status?: string;
    uploaded_bytes?: number;
  };
} & TikTokApiErrorPayload;

type TikTokCallbackResult =
  | { ok: true; summary: TikTokConnectionSummary; record: TikTokConnectionRecord }
  | { ok: false; message: string };

type TikTokRefreshResult =
  | { ok: true; summary: TikTokConnectionSummary; record: TikTokConnectionRecord }
  | { ok: false; message: string; needsReconnect?: boolean };

type TikTokPhotoDraftResult =
  | { ok: true; publishId: string }
  | { ok: false; message: string; code?: string };

type TikTokStatusResult =
  | { ok: true; status: TikTokPublishStatus }
  | { ok: false; message: string; code?: string };

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

function getTikTokTokenCookieSecret() {
  return (
    process.env.TIKTOK_TOKEN_COOKIE_SECRET?.trim() ||
    process.env.TIKTOK_CLIENT_SECRET?.trim() ||
    ""
  );
}

function getTikTokApiErrorMessage(
  payload: TikTokApiErrorPayload | TikTokTokenError | null,
  fallback: string
) {
  const errorCode =
    "error" in (payload || {}) && typeof payload?.error === "object"
      ? payload.error?.code
      : "error" in (payload || {})
        ? (payload as TikTokTokenError | null)?.error
        : undefined;
  const errorMessage =
    "error" in (payload || {}) && typeof payload?.error === "object"
      ? payload.error?.message
      : (payload as TikTokTokenError | null)?.error_description;

  return [errorCode, errorMessage].filter(Boolean).join(": ") || fallback;
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

export function normalizeTikTokScopeMode(value?: string | null): TikTokScopeMode {
  return value === "publishing" ? "publishing" : "login";
}

export function getTikTokRequiredScopes(scopeMode: TikTokScopeMode = "login") {
  return TIKTOK_SCOPE_MAP[scopeMode];
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

export function getTikTokTokenCookieName() {
  return TIKTOK_TOKEN_COOKIE;
}

export function isTikTokConfigured() {
  return Boolean(getTikTokClientKey() && getTikTokClientSecret());
}

export function buildTikTokStatePayload(returnTo?: string, scopeMode: TikTokScopeMode = "login") {
  return {
    state: crypto.randomUUID(),
    returnTo: normalizeReturnPath(returnTo),
    issuedAt: Date.now(),
    scopeMode,
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

export function serializeTikTokTokenCookie(record: TikTokConnectionRecord) {
  return sealCookiePayload(record, getTikTokTokenCookieSecret());
}

export function readTikTokTokenCookie(value: string | undefined) {
  return openCookiePayload<TikTokConnectionRecord>(value, getTikTokTokenCookieSecret());
}

export function getTikTokStateTtlSeconds() {
  return TIKTOK_STATE_TTL_SECONDS;
}

export function getTikTokConnectionTtlSeconds() {
  return TIKTOK_CONNECTION_TTL_SECONDS;
}

export function getTikTokConnectionMaxAgeSeconds(refreshExpiresIn?: number) {
  if (typeof refreshExpiresIn !== "number" || refreshExpiresIn <= 0) {
    return TIKTOK_CONNECTION_TTL_SECONDS;
  }

  return Math.min(Math.floor(refreshExpiresIn), TIKTOK_CONNECTION_TTL_CAP_SECONDS);
}

export function isTikTokTokenExpiringSoon(
  record: TikTokConnectionRecord,
  withinSeconds = 10 * 60
) {
  const expiresAtMs = new Date(record.expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return true;
  return expiresAtMs - Date.now() <= withinSeconds * 1000;
}

export function buildTikTokAuthorizeUrl(state: string, scopeMode: TikTokScopeMode = "login") {
  const url = new URL(TIKTOK_AUTHORIZE_URL);
  url.searchParams.set("client_key", getTikTokClientKey());
  url.searchParams.set("redirect_uri", getTikTokRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getTikTokRequiredScopes(scopeMode).join(","));
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

export async function exchangeTikTokCode(
  code: string,
  redirectUriOverride?: string
): Promise<TikTokCallbackResult> {
  const clientKey = getTikTokClientKey();
  const clientSecret = getTikTokClientSecret();
  const redirectUri = redirectUriOverride || getTikTokRedirectUri();

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
    return {
      ok: false,
      message: getTikTokApiErrorMessage(
        payload,
        "TikTok did not return a usable access token response."
      ),
    };
  }

  const connectedAt = new Date();
  const expiresIn = Math.max(0, payload.expires_in || 0);
  const refreshExpiresIn = Math.max(0, payload.refresh_expires_in || 0);
  const scope = payload.scope || getTikTokRequiredScopes("login").join(",");
  const summary: TikTokConnectionSummary = {
    openId: payload.open_id,
    scope,
    connectedAt: connectedAt.toISOString(),
    expiresIn,
    refreshExpiresIn,
  };
  const record: TikTokConnectionRecord = {
    ...summary,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type || "Bearer",
    expiresAt: new Date(connectedAt.getTime() + expiresIn * 1000).toISOString(),
    refreshExpiresAt: new Date(
      connectedAt.getTime() + refreshExpiresIn * 1000
    ).toISOString(),
  };

  return {
    ok: true,
    summary,
    record,
  };
}

export async function refreshTikTokTokens(
  record: TikTokConnectionRecord
): Promise<TikTokRefreshResult> {
  const clientKey = getTikTokClientKey();
  const clientSecret = getTikTokClientSecret();

  if (!clientKey || !clientSecret) {
    return {
      ok: false,
      message: "TikTok client credentials are missing.",
      needsReconnect: true,
    };
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: record.refreshToken,
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

  if (!response.ok || !payload?.access_token) {
    const message = getTikTokApiErrorMessage(
      payload,
      "TikTok rejected the token refresh request."
    );
    const normalized = message.toLowerCase();

    return {
      ok: false,
      message,
      needsReconnect:
        normalized.includes("invalid_grant") ||
        normalized.includes("invalid refresh token") ||
        normalized.includes("expired"),
    };
  }

  const refreshedAt = new Date();
  const expiresIn = Math.max(0, payload.expires_in || 0);
  const refreshExpiresIn = Math.max(
    0,
    payload.refresh_expires_in || record.refreshExpiresIn || 0
  );
  const scope = payload.scope || record.scope;
  const openId = payload.open_id || record.openId;
  const summary: TikTokConnectionSummary = {
    openId,
    scope,
    connectedAt: record.connectedAt,
    expiresIn,
    refreshExpiresIn,
  };
  const refreshedRecord: TikTokConnectionRecord = {
    ...summary,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || record.refreshToken,
    tokenType: payload.token_type || record.tokenType || "Bearer",
    expiresAt: new Date(refreshedAt.getTime() + expiresIn * 1000).toISOString(),
    refreshExpiresAt: new Date(
      refreshedAt.getTime() + refreshExpiresIn * 1000
    ).toISOString(),
  };

  return {
    ok: true,
    summary,
    record: refreshedRecord,
  };
}

export async function createTikTokPhotoDraft(options: {
  accessToken: string;
  description: string;
  photoCoverIndex: number;
  photoImages: string[];
  title: string;
}): Promise<TikTokPhotoDraftResult> {
  const response = await fetch(TIKTOK_PHOTO_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      media_type: "PHOTO",
      post_mode: "MEDIA_UPLOAD",
      post_info: {
        title: options.title,
        description: options.description,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: options.photoCoverIndex,
        photo_images: options.photoImages,
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as TikTokPhotoDraftResponse | null;
  const publishId = payload?.data?.publish_id;
  const errorCode = payload?.error?.code;

  if (!response.ok || !publishId || (errorCode && errorCode !== "ok")) {
    return {
      ok: false,
      code: errorCode,
      message: getTikTokApiErrorMessage(
        payload,
        "TikTok could not create the photo draft."
      ),
    };
  }

  return {
    ok: true,
    publishId,
  };
}

export async function fetchTikTokPublishStatus(options: {
  accessToken: string;
  publishId: string;
}): Promise<TikTokStatusResult> {
  const response = await fetch(TIKTOK_PUBLISH_STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      publish_id: options.publishId,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as TikTokPublishStatusResponse | null;
  const errorCode = payload?.error?.code;

  if (!response.ok || !payload?.data?.status || (errorCode && errorCode !== "ok")) {
    return {
      ok: false,
      code: errorCode,
      message: getTikTokApiErrorMessage(
        payload,
        "TikTok did not return a usable publish status."
      ),
    };
  }

  return {
    ok: true,
    status: {
      status: payload.data.status,
      failReason: payload.data.fail_reason,
      publiclyAvailablePostIds: payload.data.publicaly_available_post_id || [],
      uploadedBytes: payload.data.uploaded_bytes,
      downloadedBytes: payload.data.downloaded_bytes,
    },
  };
}
