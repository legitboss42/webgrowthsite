import {
  getInternalUtilityCookieName,
  readInternalUtilityCookie,
} from "@/lib/internalUtilityAuth";

/**
 * Access control for /admin/waitlist.
 *
 * This is a separate module from src/app/admin/whatsapp/auth.ts on purpose: that
 * file belongs to the WhatsApp admin work in progress and must not be edited or
 * imported from here.
 *
 * The gate is the repository's existing internal-utility session: a passphrase
 * exchanged for a sealed, expiring cookie. It deliberately does NOT accept the
 * owner scheduler session, so this dashboard has no dependency at all on TikTok
 * OAuth, scheduler sessions or any product code.
 *
 * Fails closed: a missing, malformed, tampered or expired cookie returns false,
 * and readInternalUtilityCookie returns null when no secret is configured.
 */

type CookieValue = { value?: string } | undefined;

type CookieStoreLike = {
  get(name: string): CookieValue;
};

export function hasWaitlistAdminAccess(cookieStore: CookieStoreLike): boolean {
  try {
    const cookie = cookieStore.get(getInternalUtilityCookieName())?.value;
    return Boolean(readInternalUtilityCookie(cookie));
  } catch {
    return false;
  }
}
