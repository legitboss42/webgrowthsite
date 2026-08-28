import {
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import {
  readSchedulerSession,
  SCHEDULER_SESSION_COOKIE,
} from "@/lib/scheduler/session";

/**
 * Access control for /admin/whatsapp.
 *
 * Two independent ways in, checked cheapest first. Google sign-in is the primary
 * admin path. The owner scheduler session is still accepted for the repository
 * owner. Each path fails closed on its own.
 */

type CookieValue = { value?: string } | undefined;

type CookieStoreLike = {
  get(name: string): CookieValue;
};

export function hasWhatsAppAdminAccess(cookieStore: CookieStoreLike) {
  // A Google session only opens the console when its verified email is on the
  // configured admin list. Any other signed-in Google account is not an admin.
  try {
    if (isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookieStore))) return true;
  } catch {
    // Fall through to the other gates rather than failing the whole check.
  }

  const schedulerCookie = cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value;
  if (!schedulerCookie) return false;

  try {
    const schedulerSession = readSchedulerSession(schedulerCookie);
    return Boolean(schedulerSession && isOwnerOpenId(schedulerSession.openId));
  } catch {
    return false;
  }
}
