import {
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";

/**
 * Access control for /admin/waitlist.
 *
 * This is a separate module from src/app/admin/whatsapp/auth.ts on purpose: that
 * file belongs to the WhatsApp admin work in progress and must not be edited or
 * imported from here.
 *
 * Google sign-in, restricted to the configured admin email list, is the only
 * access path for this dashboard.
 *
 * It deliberately does NOT accept the owner scheduler session, so this dashboard
 * has no dependency at all on TikTok OAuth, scheduler sessions or any product
 * code.
 *
 * Fails closed: a missing, malformed, tampered or expired cookie returns false,
 * and a signed-in Google account that is not on the admin list returns false.
 */

type CookieValue = { value?: string } | undefined;

type CookieStoreLike = {
  get(name: string): CookieValue;
};

export function hasWaitlistAdminAccess(cookieStore: CookieStoreLike): boolean {
  try {
    return isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookieStore));
  } catch {
    return false;
  }
}
