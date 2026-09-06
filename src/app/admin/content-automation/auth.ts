import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

import { isGoogleAdminSession } from "@/lib/googleAdminSession";

export async function hasContentAutomationAdminAccess(cookies: ReadonlyRequestCookies) {
  return isGoogleAdminSession(cookies);
}
