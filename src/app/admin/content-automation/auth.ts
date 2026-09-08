import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import {
  isGoogleAdminSession,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export async function hasContentAutomationAdminAccess(cookies: ReadonlyRequestCookies) {
  const canonical = readWebGrowthSessionFromCookieStore(cookies);
  if (canonical && canonicalContentAutomationAccess(canonical)) return true;
  return isGoogleAdminSession(readGoogleAuthSessionFromCookieStore(cookies));
}
