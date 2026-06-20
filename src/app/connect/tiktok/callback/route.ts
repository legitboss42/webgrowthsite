import { NextResponse } from "next/server";
import {
  exchangeTikTokCode,
  getTikTokConnectPath,
  getTikTokConnectionCookieName,
  getTikTokConnectionTtlSeconds,
  getTikTokStateCookieName,
  readTikTokStateCookie,
  serializeTikTokConnectionCookie,
} from "@/lib/tiktok";

export const runtime = "nodejs";

function buildFailureRedirect(origin: string, message: string) {
  const redirectUrl = new URL(getTikTokConnectPath(), origin);
  redirectUrl.searchParams.set("status", "error");
  redirectUrl.searchParams.set("message", message);
  return redirectUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const secureCookies = process.env.NODE_ENV === "production";

  if (error) {
    const errorResponse = NextResponse.redirect(
      buildFailureRedirect(
        requestUrl.origin,
        errorDescription || error || "TikTok returned an authorization error."
      ),
      302
    );
    errorResponse.headers.set("Cache-Control", "no-store");
    errorResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return errorResponse;
  }

  const cookieStore = request.headers.get("cookie") || "";
  const stateCookie = cookieStore
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${getTikTokStateCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const parsedState = readTikTokStateCookie(stateCookie);

  if (!parsedState || !state || parsedState.state !== state) {
    const invalidStateResponse = NextResponse.redirect(
      buildFailureRedirect(requestUrl.origin, "State check failed. Start the TikTok connection flow again."),
      302
    );
    invalidStateResponse.cookies.delete(getTikTokStateCookieName());
    invalidStateResponse.headers.set("Cache-Control", "no-store");
    invalidStateResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return invalidStateResponse;
  }

  if (!code) {
    const missingCodeResponse = NextResponse.redirect(
      buildFailureRedirect(requestUrl.origin, "TikTok did not return an authorization code."),
      302
    );
    missingCodeResponse.cookies.delete(getTikTokStateCookieName());
    missingCodeResponse.headers.set("Cache-Control", "no-store");
    missingCodeResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return missingCodeResponse;
  }

  const exchangeResult = await exchangeTikTokCode(code);
  const redirectTarget = new URL(parsedState.returnTo, requestUrl.origin);

  if (!exchangeResult.ok) {
    redirectTarget.searchParams.set("status", "error");
    redirectTarget.searchParams.set("message", exchangeResult.message);

    const failureResponse = NextResponse.redirect(redirectTarget, 302);
    failureResponse.cookies.delete(getTikTokStateCookieName());
    failureResponse.cookies.delete(getTikTokConnectionCookieName());
    failureResponse.headers.set("Cache-Control", "no-store");
    failureResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return failureResponse;
  }

  redirectTarget.searchParams.set("status", "connected");

  const successResponse = NextResponse.redirect(redirectTarget, 302);
  successResponse.cookies.delete(getTikTokStateCookieName());
  successResponse.cookies.set({
    name: getTikTokConnectionCookieName(),
    value: serializeTikTokConnectionCookie(exchangeResult.summary),
    maxAge: getTikTokConnectionTtlSeconds(),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
  });
  successResponse.headers.set("Cache-Control", "no-store");
  successResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  return successResponse;
}
