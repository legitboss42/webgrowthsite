import { timingSafeEqual } from "crypto";
import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const INTERNAL_WORKFLOW_COOKIE = "wg_internal_workflow";
const INTERNAL_WORKFLOW_TTL_SECONDS = 12 * 60 * 60;

type InternalWorkflowSession = {
  scope: "workflow";
  issuedAt: number;
  expiresAt: number;
};

function getInternalWorkflowSecret() {
  return process.env.INTERNAL_WORKFLOW_SECRET?.trim() || "";
}

export function getInternalWorkflowCookieName() {
  return INTERNAL_WORKFLOW_COOKIE;
}

export function getInternalWorkflowTtlSeconds() {
  return INTERNAL_WORKFLOW_TTL_SECONDS;
}

export function isInternalWorkflowConfigured() {
  return Boolean(getInternalWorkflowSecret());
}

export function verifyInternalWorkflowPassphrase(input: string) {
  const secret = getInternalWorkflowSecret();
  const supplied = input.trim();
  if (!secret || !supplied) return false;

  const expectedBuffer = Buffer.from(secret, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");

  if (expectedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function createInternalWorkflowCookieValue() {
  const issuedAt = Date.now();
  const payload: InternalWorkflowSession = {
    scope: "workflow",
    issuedAt,
    expiresAt: issuedAt + INTERNAL_WORKFLOW_TTL_SECONDS * 1000,
  };

  return sealCookiePayload(payload, getInternalWorkflowSecret());
}

export function readInternalWorkflowCookie(value: string | undefined) {
  const payload = openCookiePayload<InternalWorkflowSession>(value, getInternalWorkflowSecret());
  if (!payload) return null;
  if (payload.scope !== "workflow") return null;
  if (Date.now() >= payload.expiresAt) return null;
  return payload;
}
