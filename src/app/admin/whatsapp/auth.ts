import {
  getInternalUtilityCookieName,
  readInternalUtilityCookie,
} from "@/lib/internalUtilityAuth";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import {
  readSchedulerSession,
  SCHEDULER_SESSION_COOKIE,
} from "@/lib/scheduler/session";

type CookieValue = { value?: string } | undefined;

type CookieStoreLike = {
  get(name: string): CookieValue;
};

export function hasWhatsAppAdminAccess(cookieStore: CookieStoreLike) {
  const internalUtilityCookie = cookieStore.get(getInternalUtilityCookieName())?.value;
  if (readInternalUtilityCookie(internalUtilityCookie)) return true;

  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return false;

  try {
    const schedulerSession = readSchedulerSession(schedulerCookie);
    return Boolean(schedulerSession && isOwnerOpenId(schedulerSession.openId));
  } catch {
    return false;
  }
}
