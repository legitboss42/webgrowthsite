import { NextResponse } from "next/server";
import {
  buildTikTokAuthorizeUrl,
  buildTikTokStatePayload,
  getTikTokConnectPath,
  getTikTokStateCookieName,
  getTikTokStateTtlSeconds,
  isTikTokConfigured,
  normalizeTikTokScopeMode,
  serializeTikTokStateCookie,
} from "@/lib/tiktok";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || getTikTokConnectPath();
  const scopeMode = normalizeTikTokScopeMode(requestUrl.searchParams.get("mode"));
  const secureCookies = process.env.NODE_ENV === "production";

  if (!isTikTokConfigured()) {
    const fallback = new URL(getTikTokConnectPath(), requestUrl.origin);
    fallback.searchParams.set("status", "config-missing");
    const missingConfigResponse = NextResponse.redirect(fallback, 302);
    missingConfigResponse.headers.set("Cache-Control", "no-store");
    missingConfigResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return missingConfigResponse;
  }

  const statePayload = buildTikTokStatePayload(returnTo, scopeMode);
  const response = NextResponse.redirect(
    buildTikTokAuthorizeUrl(statePayload.state, statePayload.scopeMode),
    302
  );

  response.cookies.set({
    name: getTikTokStateCookieName(),
    value: serializeTikTokStateCookie(statePayload),
    maxAge: getTikTokStateTtlSeconds(),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
  });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
