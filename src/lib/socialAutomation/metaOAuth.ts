import { randomUUID } from "crypto";

import { openCookiePayload, sealCookiePayload } from "../secureCookie";

export const META_OAUTH_STATE_COOKIE = "webgrowth_meta_oauth_state";
export const META_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
export const META_PENDING_CONNECTION_COOKIE = "webgrowth_meta_pending_connection";
export const META_PENDING_CONNECTION_MAX_AGE_SECONDS = 10 * 60;

export const META_PUBLISH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

type MetaOAuthStatePayload = {
  state: string;
  createdAt: number;
  returnTo: string;
};

type MetaPendingConnectionPayload = {
  userAccessToken: string;
  expiresAt: string | null;
  createdAt: number;
};

function safeReturnTo(value: string) {
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return "/admin/content-automation/";
  }
  return candidate;
}

export function createMetaOAuthState(secret: string, returnTo: string, nowMs = Date.now()) {
  const payload: MetaOAuthStatePayload = {
    state: randomUUID(),
    createdAt: nowMs,
    returnTo: safeReturnTo(returnTo),
  };
  return {
    state: payload.state,
    cookieValue: sealCookiePayload(payload, secret),
  };
}

export function readMetaOAuthState(
  cookieValue: string | undefined,
  secret: string,
  nowMs = Date.now()
): MetaOAuthStatePayload | null {
  const payload = openCookiePayload<MetaOAuthStatePayload>(cookieValue, secret);
  if (!payload) return null;
  if (typeof payload.state !== "string" || payload.state.length < 16) return null;
  if (!Number.isFinite(payload.createdAt)) return null;
  const age = nowMs - payload.createdAt;
  if (age < -60_000 || age > META_OAUTH_STATE_MAX_AGE_SECONDS * 1000) return null;
  return {
    state: payload.state,
    createdAt: payload.createdAt,
    returnTo: safeReturnTo(payload.returnTo),
  };
}

export function createMetaPendingConnection(
  secret: string,
  input: { userAccessToken: string; expiresAt?: string | null },
  nowMs = Date.now()
) {
  const token = input.userAccessToken.trim();
  if (!token) throw new Error("Meta pending user access token is missing.");
  const payload: MetaPendingConnectionPayload = {
    userAccessToken: token,
    expiresAt: input.expiresAt?.trim() || null,
    createdAt: nowMs,
  };
  return { cookieValue: sealCookiePayload(payload, secret) };
}

export function readMetaPendingConnection(
  cookieValue: string | undefined,
  secret: string,
  nowMs = Date.now()
): MetaPendingConnectionPayload | null {
  const payload = openCookiePayload<MetaPendingConnectionPayload>(cookieValue, secret);
  if (!payload) return null;
  if (typeof payload.userAccessToken !== "string" || !payload.userAccessToken.trim()) return null;
  if (payload.expiresAt !== null && typeof payload.expiresAt !== "string") return null;
  if (!Number.isFinite(payload.createdAt)) return null;
  const age = nowMs - payload.createdAt;
  if (age < -60_000 || age > META_PENDING_CONNECTION_MAX_AGE_SECONDS * 1000) return null;
  return {
    userAccessToken: payload.userAccessToken,
    expiresAt: payload.expiresAt,
    createdAt: payload.createdAt,
  };
}

export function buildMetaSdkLoginOptions(configId: string) {
  const value = configId.trim();
  if (!value) throw new Error("META_LOGIN_CONFIG_ID is not configured.");
  return {
    config_id: value,
    response_type: "code" as const,
    override_default_response_type: true as const,
  };
}

export function buildMetaAuthorizeUrl(input: {
  graphVersion: string;
  appId: string;
  redirectUri: string;
  state: string;
  configId?: string;
}) {
  const version = input.graphVersion.trim();
  if (!/^v\d+(?:\.\d+)?$/.test(version)) throw new Error("Invalid Meta Graph API version.");
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");

  const configId = input.configId?.trim();
  if (configId) {
    url.searchParams.set("config_id", configId);
    url.searchParams.set("override_default_response_type", "true");
  } else {
    url.searchParams.set("scope", META_PUBLISH_SCOPES.join(","));
  }

  return url.toString();
}