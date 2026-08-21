import { NextResponse } from "next/server";
import { encryptTikTokTokens } from "@/lib/scheduler/crypto";
import {
  readSchedulerOAuthState,
  schedulerRedirectUri,
  SCHEDULER_OAUTH_STATE_COOKIE,
} from "@/lib/scheduler/oauth";
import { createSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";
import {
  exchangeTikTokCode,
  getTikTokConnectPath,
  getTikTokConnectionCookieName,
  getTikTokConnectionMaxAgeSeconds,
  getTikTokStateCookieName,
  getTikTokTokenCookieName,
  readTikTokStateCookie,
  serializeTikTokConnectionCookie,
  serializeTikTokTokenCookie,
} from "@/lib/tiktok";

export const runtime = "nodejs";

function readCookieValue(cookieHeader: string, name: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

function buildFailureRedirect(origin: string, message: string) {
  const redirectUrl = new URL(getTikTokConnectPath(), origin);
  redirectUrl.searchParams.set("status", "error");
  redirectUrl.searchParams.set("message", message);
  return redirectUrl;
}

function buildSchedulerFailureRedirect(origin: string, reason: string) {
  const redirectUrl = new URL("/scheduler/sign-in/", origin);
  redirectUrl.searchParams.set("error", reason);
  return redirectUrl;
}

async function completeSchedulerCallback(options: {
  code: string | null;
  cookieHeader: string;
  origin: string;
  secureCookies: boolean;
  state: string | null;
}) {
  const stateCookie = readCookieValue(options.cookieHeader, SCHEDULER_OAUTH_STATE_COOKIE);
  const parsedState = readSchedulerOAuthState(stateCookie);

  if (!stateCookie) return null;

  if (!parsedState || !options.state || parsedState.state !== options.state || !options.code) {
    const response = NextResponse.redirect(buildSchedulerFailureRedirect(options.origin, "oauth"), 302);
    response.cookies.delete(SCHEDULER_OAUTH_STATE_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const exchangeResult = await exchangeTikTokCode(options.code, schedulerRedirectUri());

  if (!exchangeResult.ok) {
    const response = NextResponse.redirect(buildSchedulerFailureRedirect(options.origin, "exchange"), 302);
    response.cookies.delete(SCHEDULER_OAUTH_STATE_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const store = await createSupabaseSchedulerStore();
  const user = await store.upsertUser({
    tiktokOpenId: exchangeResult.record.openId,
    displayName: null,
    avatarUrl: null,
  });
  const userId = String(user.id);
  await store.saveConnection({
    userId,
    encryptedTokens: encryptTikTokTokens(exchangeResult.record),
    scopes: exchangeResult.record.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
    accessExpiresAt: exchangeResult.record.expiresAt,
    refreshExpiresAt: exchangeResult.record.refreshExpiresAt,
  });

  const response = NextResponse.redirect(new URL(parsedState.returnTo, options.origin), 302);
  response.cookies.delete(SCHEDULER_OAUTH_STATE_COOKIE);
  response.cookies.set({
    name: SCHEDULER_SESSION_COOKIE,
    value: createSchedulerSession(userId, exchangeResult.record.openId),
    maxAge: 12 * 60 * 60,
    httpOnly: true,
    sameSite: "lax",
    secure: options.secureCookies,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const secureCookies = process.env.NODE_ENV === "production";
  const cookieStore = request.headers.get("cookie") || "";

  if (cookieStore.includes(`${SCHEDULER_OAUTH_STATE_COOKIE}=`)) {
    if (error) {
      const errorResponse = NextResponse.redirect(
        buildSchedulerFailureRedirect(requestUrl.origin, "oauth"),
        302
      );
      errorResponse.cookies.delete(SCHEDULER_OAUTH_STATE_COOKIE);
      errorResponse.headers.set("Cache-Control", "no-store");
      errorResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return errorResponse;
    }

    const schedulerResponse = await completeSchedulerCallback({
      code,
      cookieHeader: cookieStore,
      origin: requestUrl.origin,
      secureCookies,
      state,
    });
    if (schedulerResponse) return schedulerResponse;
  }

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
    failureResponse.cookies.delete(getTikTokTokenCookieName());
    failureResponse.headers.set("Cache-Control", "no-store");
    failureResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return failureResponse;
  }

  redirectTarget.searchParams.set("status", "connected");
  redirectTarget.searchParams.set("mode", parsedState.scopeMode);
  const maxAge = getTikTokConnectionMaxAgeSeconds(exchangeResult.record.refreshExpiresIn);

  const successResponse = NextResponse.redirect(redirectTarget, 302);
  successResponse.cookies.delete(getTikTokStateCookieName());
  successResponse.cookies.set({
    name: getTikTokConnectionCookieName(),
    value: serializeTikTokConnectionCookie(exchangeResult.summary),
    maxAge,
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
  });
  successResponse.cookies.set({
    name: getTikTokTokenCookieName(),
    value: serializeTikTokTokenCookie(exchangeResult.record),
    maxAge,
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
  });
  successResponse.headers.set("Cache-Control", "no-store");
  successResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  return successResponse;
}
