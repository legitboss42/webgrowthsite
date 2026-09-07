import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import {
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";

export async function hasContentAutomationAdminAccess(cookies: ReadonlyRequestCookies) {
  return isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookies));
}
