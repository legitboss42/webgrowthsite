import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import {
  buildMetaAuthorizeUrl,
  createMetaOAuthState,
  META_OAUTH_STATE_COOKIE,
  META_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/socialAutomation/metaOAuth";

export const runtime = "nodejs";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const appId = required("META_APP_ID");
    const graphVersion = required("META_GRAPH_VERSION");
    const stateSecret = required("META_OAUTH_STATE_SECRET");
    const redirectUri =
      process.env.META_REDIRECT_URI?.trim() ||
      new URL("/api/admin/content-automation/meta/callback/", request.url).toString();
    const requestUrl = new URL(request.url);
    const returnTo = requestUrl.searchParams.get("returnTo") || "/admin/content-automation/";
    const sealed = createMetaOAuthState(stateSecret, returnTo);
    const authorizeUrl = buildMetaAuthorizeUrl({
      graphVersion,
      appId,
      redirectUri,
      state: sealed.state,
    });

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(META_OAUTH_STATE_COOKIE, sealed.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/admin/content-automation/meta/",
      maxAge: META_OAUTH_STATE_MAX_AGE_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("[social-automation] Meta connect configuration failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ ok: false, code: "META_CONNECT_NOT_CONFIGURED" }, { status: 503 });
  }
}
