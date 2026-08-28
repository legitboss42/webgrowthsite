import { createClient } from "@supabase/supabase-js";
import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

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
const GOOGLE_AUTH_TTL_SECONDS = 12 * 60 * 60;
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

function getGoogleAuthSecret() {
  return (
    process.env.GOOGLE_AUTH_SESSION_SECRET?.trim() ||
    process.env.INTERNAL_TOOL_SESSION_SECRET?.trim() ||
    ""
  );
}

function getSupabasePublicConfig() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getGoogleAuthCookieName() {
  return GOOGLE_AUTH_COOKIE;
}

export function getGoogleAuthTtlSeconds() {
  return GOOGLE_AUTH_TTL_SECONDS;
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
  return Boolean(getGoogleAuthSecret() && getSupabasePublicConfig());
}

/**
 * Whether the *browser* can start Google sign-in.
 *
 * Deliberately stricter than isGoogleAuthConfigured(): that one accepts the
 * server-only SUPABASE_URL, but the sign-in button and the callback both run in the
 * browser and can only see the NEXT_PUBLIC_* pair. Checking those specifically stops
 * the gate offering a button that could only ever throw.
 */
export function isGoogleBrowserSignInConfigured() {
  return Boolean(
    getGoogleAuthSecret() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function sanitizeGoogleAuthNext(value: string | null | undefined, fallback = "/") {
  const next = (value || "").trim();
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
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

export function readGoogleAuthSession(value: string | undefined, now = Date.now()) {
  const secret = getGoogleAuthSecret();
  const payload = openCookiePayload<GoogleAuthSession>(value, secret);
  if (!payload || payload.version !== 1 || payload.provider !== "google") return null;
  if (!payload.email?.trim() || now >= payload.expiresAt) return null;
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

export function createSupabaseAuthClient() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Supabase public auth configuration is missing.");
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
