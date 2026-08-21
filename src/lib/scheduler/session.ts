import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const SCHEDULER_SESSION_COOKIE = "wg_scheduler_session";

type SchedulerSession = {
  version: 1;
  userId: string;
  openId: string;
  issuedAt: number;
  expiresAt: number;
};

function secret() {
  const value = process.env.SCHEDULER_SESSION_SECRET?.trim() || "";
  if (!value) throw new Error("Scheduler session secret is missing.");
  return value;
}

export function createSchedulerSession(
  userId: string,
  openId: string,
  issuedAt = Date.now(),
  ttlSeconds = SESSION_TTL_SECONDS
) {
  return sealCookiePayload(
    { version: 1, userId, openId, issuedAt, expiresAt: issuedAt + ttlSeconds * 1000 },
    secret()
  );
}

export function readSchedulerSession(value: string | undefined, now = Date.now()) {
  const payload = openCookiePayload<SchedulerSession>(value, secret());
  if (!payload || payload.version !== 1 || now >= payload.expiresAt) return null;
  return payload;
}
