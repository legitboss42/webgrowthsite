import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

export const SCHEDULER_OAUTH_STATE_COOKIE = "wg_scheduler_oauth_state";
export type SchedulerAuthMode = "login" | "publishing";

type OAuthState = { state: string; returnTo: string; mode: SchedulerAuthMode; expiresAt: number };
const REGISTERED_TIKTOK_CALLBACK = "https://webgrowth.info/connect/tiktok/callback/";
const UNREGISTERED_SCHEDULER_CALLBACK = "https://webgrowth.info/api/scheduler/auth/callback/";

function usableRedirectUri(value?: string) {
  const redirectUri = value?.trim();
  return redirectUri && redirectUri !== UNREGISTERED_SCHEDULER_CALLBACK ? redirectUri : "";
}

export function schedulerRedirectUri() {
  return (
    usableRedirectUri(process.env.TIKTOK_SCHEDULER_REDIRECT_URI) ||
    usableRedirectUri(process.env.TIKTOK_REDIRECT_URI) ||
    REGISTERED_TIKTOK_CALLBACK
  );
}

export function normalizeSchedulerReturnPath(value?: string | null) {
  return value?.startsWith("/scheduler/") && !value.startsWith("//") ? value : "/scheduler/dashboard/";
}

export function buildSchedulerAuthorizeUrl(state: string, mode: SchedulerAuthMode) {
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY?.trim() || "");
  url.searchParams.set("redirect_uri", schedulerRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", mode === "publishing" ? "user.info.basic,video.publish" : "user.info.basic");
  url.searchParams.set("state", state);
  return url.toString();
}

export function createSchedulerOAuthState(returnTo: string, mode: SchedulerAuthMode, now = Date.now()) {
  const payload: OAuthState = {
    state: crypto.randomUUID(),
    returnTo: normalizeSchedulerReturnPath(returnTo),
    mode,
    expiresAt: now + 10 * 60 * 1000,
  };
  const secret = process.env.SCHEDULER_SESSION_SECRET?.trim() || "";
  return { payload, cookie: sealCookiePayload(payload, secret) };
}

export function readSchedulerOAuthState(value: string | undefined, now = Date.now()) {
  const secret = process.env.SCHEDULER_SESSION_SECRET?.trim() || "";
  const payload = openCookiePayload<OAuthState>(value, secret);
  return payload && now < payload.expiresAt ? payload : null;
}

export function getSchedulerCallbackRelay(requestUrl: URL, cookieHeader: string) {
  const cookieValue = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SCHEDULER_OAUTH_STATE_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const schedulerState = readSchedulerOAuthState(cookieValue);
  const returnedState = requestUrl.searchParams.get("state");
  if (!schedulerState || !returnedState || schedulerState.state !== returnedState) return null;

  const relayUrl = new URL(UNREGISTERED_SCHEDULER_CALLBACK, requestUrl.origin);
  for (const key of ["code", "state", "error", "error_description"]) {
    const value = requestUrl.searchParams.get(key);
    if (value) relayUrl.searchParams.set(key, value);
  }
  return relayUrl;
}
