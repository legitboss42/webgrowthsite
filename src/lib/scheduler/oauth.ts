import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

export const SCHEDULER_OAUTH_STATE_COOKIE = "wg_scheduler_oauth_state";
export type SchedulerAuthMode = "login" | "publishing";

type OAuthState = { state: string; returnTo: string; mode: SchedulerAuthMode; expiresAt: number };

export function schedulerRedirectUri() {
  return process.env.TIKTOK_SCHEDULER_REDIRECT_URI?.trim() || "https://webgrowth.info/api/scheduler/auth/callback/";
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
