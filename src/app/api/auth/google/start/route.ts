import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthStateValue,
  getGoogleOAuthStateCookieName,
  getGoogleOAuthStateTtlSeconds,
  sanitizeGoogleAuthNext,
} from "@/lib/googleAuth";
import { sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const state = randomUUID();
    const next = sanitizeGoogleAuthNext(sanitizeText(requestUrl.searchParams.get("next"), 300), "/");
    const loginHint = sanitizeText(requestUrl.searchParams.get("login_hint"), 320) || null;

    const response = NextResponse.redirect(
      buildGoogleAuthorizationUrl({
        state,
        next,
        loginHint,
      }),
    );

    response.cookies.set({
      name: getGoogleOAuthStateCookieName(),
      value: createGoogleOAuthStateValue({ state, next, loginHint }),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(),
      path: "/",
      maxAge: getGoogleOAuthStateTtlSeconds(),
    });

    return response;
  } catch (error) {
    console.error("Google sign-in start failed:", error);
    return NextResponse.redirect(new URL("/auth/google/callback/?error=config", request.url));
  }
}
