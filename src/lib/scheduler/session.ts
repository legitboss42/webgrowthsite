import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";
import {
  WEB_GROWTH_SESSION_COOKIE,
  readWebGrowthSession,
} from "@/lib/webGrowthSession";

const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const LEGACY_SCHEDULER_SESSION_COOKIE = "wg_scheduler_session";
export const SCHEDULER_SESSION_COOKIE = LEGACY_SCHEDULER_SESSION_COOKIE;

type SchedulerSession = {
  version: 1;
  userId: string;
  openId: string;
  issuedAt: number;
  expiresAt: number;
};

type CookieStoreLike = { get(name: string): { value?: string } | undefined };

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
  let payload: SchedulerSession | null = null;
  try {
    payload = openCookiePayload<SchedulerSession>(value, secret());
  } catch {
    return null;
  }
  if (!payload || payload.version !== 1 || now >= payload.expiresAt) return null;
  return payload;
}

export function readSchedulerSessionFromCookieStore(cookieStore: CookieStoreLike, now = Date.now()) {
  const canonical = readWebGrowthSession(cookieStore.get(WEB_GROWTH_SESSION_COOKIE)?.value, now);
  if (canonical?.schedulerUserId && canonical.tiktokOpenId) {
    return { userId: canonical.schedulerUserId, openId: canonical.tiktokOpenId };
  }

  return readSchedulerSession(cookieStore.get(LEGACY_SCHEDULER_SESSION_COOKIE)?.value, now);
}
