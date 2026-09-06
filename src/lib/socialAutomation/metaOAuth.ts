import { randomUUID } from "crypto";

import { openCookiePayload, sealCookiePayload } from "../secureCookie";

export const META_OAUTH_STATE_COOKIE = "webgrowth_meta_oauth_state";
export const META_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

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

export function buildMetaAuthorizeUrl(input: {
  graphVersion: string;
  appId: string;
  redirectUri: string;
  state: string;
}) {
  const version = input.graphVersion.trim();
  if (!/^v\d+(?:\.\d+)?$/.test(version)) throw new Error("Invalid Meta Graph API version.");
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_PUBLISH_SCOPES.join(","));
  return url.toString();
}
