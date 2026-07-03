import { timingSafeEqual } from "crypto";
import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const INTERNAL_UTILITY_COOKIE = "wg_internal_utility";
const INTERNAL_UTILITY_TTL_SECONDS = 12 * 60 * 60;
const DEFAULT_LOCAL_PASSPHRASE = "webgrowth-local-tts";

type InternalUtilitySession = {
  scope: "internal-utility";
  issuedAt: number;
  expiresAt: number;
};

function getConfiguredPassphrase() {
  const configured = process.env.INTERNAL_TOOL_PASSPHRASE?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_PASSPHRASE : "";
}

function getUtilityCookieSecret() {
  return (
    process.env.INTERNAL_TOOL_SESSION_SECRET?.trim() ||
    process.env.INTERNAL_TOOL_PASSPHRASE?.trim() ||
    (process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_PASSPHRASE : "")
  );
}

export function getInternalUtilityCookieName() {
  return INTERNAL_UTILITY_COOKIE;
}

export function getInternalUtilityTtlSeconds() {
  return INTERNAL_UTILITY_TTL_SECONDS;
}

export function getInternalUtilityLocalPassphrase() {
  return process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_PASSPHRASE : "";
}

export function isInternalUtilityConfigured() {
  return Boolean(getConfiguredPassphrase() && getUtilityCookieSecret());
}

export function verifyInternalUtilityPassphrase(input: string) {
  const secret = getConfiguredPassphrase();
  const supplied = input.trim();
  if (!secret || !supplied) return false;

  const expectedBuffer = Buffer.from(secret, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");

  if (expectedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function createInternalUtilityCookieValue() {
  const secret = getUtilityCookieSecret();
  const issuedAt = Date.now();
  const payload: InternalUtilitySession = {
    scope: "internal-utility",
    issuedAt,
    expiresAt: issuedAt + INTERNAL_UTILITY_TTL_SECONDS * 1000,
  };

  return sealCookiePayload(payload, secret);
}

export function readInternalUtilityCookie(value: string | undefined) {
  const secret = getUtilityCookieSecret();
  const payload = openCookiePayload<InternalUtilitySession>(value, secret);
  if (!payload) return null;
  if (payload.scope !== "internal-utility") return null;
  if (Date.now() >= payload.expiresAt) return null;
  return payload;
}
