import { NextResponse } from "next/server";
import {
  createGoogleAuthSessionValue,
  getGoogleAuthCookieName,
  getGoogleAuthTtlSeconds,
  isAllowedGoogleAdminEmail,
  isGoogleAuthConfigured,
  sanitizeGoogleAuthNext,
  verifyGoogleIdToken,
} from "@/lib/googleAuth";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  sanitizeText,
} from "@/lib/security";

export const runtime = "nodejs";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  try {
    if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!hasJsonContentType(request)) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    if (!isGoogleAuthConfigured()) {
      return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 500 });
    }

    const rate = checkRateLimit(`google-auth:${getClientIp(request)}:${getUserAgent(request)}`, 12);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait and try again." }, { status: 429 });
    }

    const body = await request.json();
    const credential = sanitizeText(body?.credential, 5000);
    const next = sanitizeGoogleAuthNext(sanitizeText(body?.next, 300), "/");

    if (!credential) {
      return NextResponse.json({ error: "Google did not return a usable identity credential." }, { status: 400 });
    }

    const identity = await verifyGoogleIdToken(credential);
    if (next.startsWith("/admin/") && !isAllowedGoogleAdminEmail(identity.email)) {
      return NextResponse.json({ error: "This Google account is not approved for admin access." }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: next,
    });
    response.cookies.set({
      name: getGoogleAuthCookieName(),
      value: createGoogleAuthSessionValue(identity),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(),
      path: "/",
      maxAge: getGoogleAuthTtlSeconds(),
    });
    return response;
  } catch (error) {
    console.error("Google identity sign-in failed:", error);
    return NextResponse.json({ error: "Google sign-in could not be completed. Please try again." }, { status: 500 });
  }
}

