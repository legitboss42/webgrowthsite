import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";
import { absoluteUrl } from "@/lib/site";

/**
 * Google sign-in sessions for the admin areas.
 *
 * Deliberately no `import "server-only"`: `server-only` is resolved by the Next
 * bundler and is not installed as a package, so importing it here crashes every
 * test that reaches this module under `tsx`. The module this one sits beside,
 * src/lib/internalUtilityAuth.ts, has the same shape and the same omission — the
 * sealing secret is read from the environment at call time and is never exported,
 * so a stray client import would fail closed rather than leak a value.
 */

const GOOGLE_AUTH_COOKIE = "wg_google_auth";
const GOOGLE_OAUTH_STATE_COOKIE = "wg_google_oauth_state";
const GOOGLE_AUTH_TTL_SECONDS = 12 * 60 * 60;
const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;
const DEFAULT_ADMIN_GOOGLE_EMAIL = "vickysaintbrown02@gmail.com";

export type GoogleAuthSession = {
  version: 1;
  provider: "google";
  userId: string;
  email: string;
  fullName: string | null;
  issuedAt: number;
  expiresAt: number;
};

export type GoogleUserIdentity = {
  userId: string;
  email: string;
  fullName?: string | null;
};

export type GoogleOAuthState = {
  version: 1;
  state: string;
  next: string;
  loginHint: string | null;
  issuedAt: number;
  expiresAt: number;
};

function getGoogleAuthSecret() {
  return (
    process.env.GOOGLE_AUTH_SESSION_SECRET?.trim() ||
    process.env.INTERNAL_TOOL_SESSION_SECRET?.trim() ||
    ""
  );
}

function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || "";
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || absoluteUrl("/api/auth/google/callback/");

  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function getGoogleAuthCookieName() {
  return GOOGLE_AUTH_COOKIE;
}

export function getGoogleOAuthStateCookieName() {
  return GOOGLE_OAUTH_STATE_COOKIE;
}

export function getGoogleAuthTtlSeconds() {
  return GOOGLE_AUTH_TTL_SECONDS;
}

export function getGoogleOAuthStateTtlSeconds() {
  return GOOGLE_OAUTH_STATE_TTL_SECONDS;
}

export function getDefaultAdminGoogleEmail() {
  return DEFAULT_ADMIN_GOOGLE_EMAIL;
}

export function getConfiguredGoogleAdminEmails() {
  const configured = (process.env.GOOGLE_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  return [DEFAULT_ADMIN_GOOGLE_EMAIL];
}

export function isAllowedGoogleAdminEmail(email: string | null | undefined) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getConfiguredGoogleAdminEmails().includes(normalized);
}

export function isGoogleAuthConfigured() {
  return Boolean(getGoogleAuthSecret() && getGoogleOAuthConfig());
}

export function sanitizeGoogleAuthNext(value: string | null | undefined, fallback = "/") {
  const next = (value || "").trim();
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

export function buildGoogleAuthStartPath(nextPath: string, loginHint?: string | null) {
  const params = new URLSearchParams();
  params.set("next", sanitizeGoogleAuthNext(nextPath));
  const hint = (loginHint || "").trim();
  if (hint) params.set("login_hint", hint);
  return `/api/auth/google/start/?${params.toString()}`;
}

export function createGoogleAuthSessionValue(
  identity: GoogleUserIdentity,
  issuedAt = Date.now(),
  ttlSeconds = GOOGLE_AUTH_TTL_SECONDS,
) {
  const secret = getGoogleAuthSecret();
  const email = identity.email.trim().toLowerCase();
  const fullName = identity.fullName?.trim() || null;

  return sealCookiePayload(
    {
      version: 1,
      provider: "google",
      userId: identity.userId,
      email,
      fullName,
      issuedAt,
      expiresAt: issuedAt + ttlSeconds * 1000,
    } satisfies GoogleAuthSession,
    secret,
  );
}

export function createGoogleOAuthStateValue(
  input: { state: string; next: string; loginHint?: string | null },
  issuedAt = Date.now(),
  ttlSeconds = GOOGLE_OAUTH_STATE_TTL_SECONDS,
) {
  const secret = getGoogleAuthSecret();

  return sealCookiePayload(
    {
      version: 1,
      state: input.state,
      next: sanitizeGoogleAuthNext(input.next),
      loginHint: input.loginHint?.trim() || null,
      issuedAt,
      expiresAt: issuedAt + ttlSeconds * 1000,
    } satisfies GoogleOAuthState,
    secret,
  );
}

export function readGoogleAuthSession(value: string | undefined, now = Date.now()) {
  const secret = getGoogleAuthSecret();
  const payload = openCookiePayload<GoogleAuthSession>(value, secret);
  if (!payload || payload.version !== 1 || payload.provider !== "google") return null;
  if (!payload.email?.trim() || now >= payload.expiresAt) return null;
  return payload;
}

export function readGoogleOAuthState(value: string | undefined, now = Date.now()) {
  const secret = getGoogleAuthSecret();
  const payload = openCookiePayload<GoogleOAuthState>(value, secret);
  if (!payload || payload.version !== 1 || !payload.state?.trim() || !payload.next?.trim()) return null;
  if (now >= payload.expiresAt) return null;
  return payload;
}

export function readGoogleAuthSessionFromCookieStore(cookieStore: {
  get(name: string): { value?: string } | undefined;
}) {
  return readGoogleAuthSession(cookieStore.get(GOOGLE_AUTH_COOKIE)?.value);
}

export function isGoogleAdminSession(session: GoogleAuthSession | null | undefined) {
  if (!session) return false;
  return isAllowedGoogleAdminEmail(session.email);
}

export function buildGoogleAuthorizationUrl(input: {
  state: string;
  next: string;
  loginHint?: string | null;
}) {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth client configuration is missing.");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "select_account");
  const hint = input.loginHint?.trim();
  if (hint) url.searchParams.set("login_hint", hint);
  return url.toString();
}

export function getGoogleOAuthRedirectUri() {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth client configuration is missing.");
  return config.redirectUri;
}

export async function exchangeGoogleCodeForIdentity(code: string) {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth client configuration is missing.");

  const tokenBody = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
    cache: "no-store",
  });
  const tokenPayload = (await tokenResponse.json().catch(() => null)) as
    | { access_token?: string; error?: string; error_description?: string }
    | null;

  if (!tokenResponse.ok || !tokenPayload?.access_token) {
    throw new Error("Google code exchange failed.");
  }

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    cache: "no-store",
  });
  const userPayload = (await userResponse.json().catch(() => null)) as
    | {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
      }
    | null;

  if (!userResponse.ok || !userPayload?.sub || !userPayload.email?.trim() || userPayload.email_verified !== true) {
    throw new Error("Google did not return a verified email address.");
  }

  return {
    userId: userPayload.sub,
    email: userPayload.email.trim().toLowerCase(),
    fullName: userPayload.name?.trim() || null,
  } satisfies GoogleUserIdentity;
}
