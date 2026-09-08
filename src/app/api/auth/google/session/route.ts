import { NextResponse } from "next/server";
import {
  getGoogleAuthCookieName,
  isAllowedGoogleAdminEmail,
  isGoogleAuthConfigured,
  sanitizeGoogleAuthNext,
  verifyGoogleIdToken,
} from "@/lib/googleAuth";
import {
  WEB_GROWTH_SESSION_COOKIE,
  createWebGrowthGoogleSessionValue,
  getWebGrowthSessionTtlSeconds,
} from "@/lib/webGrowthSession";
import { resolveOwnerSchedulerIdentity } from "@/lib/webGrowthSessionServer";
import {
  bindWhatsAppTeamGoogleIdentity,
  isWhatsAppTeamEmailAllowed,
} from "@/lib/whatsapp/teamAccess";
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

function isWhatsAppWorkspacePath(path: string) {
  return path === "/admin/whatsapp" || path.startsWith("/admin/whatsapp/");
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
    const isAdmin = isAllowedGoogleAdminEmail(identity.email);
    const whatsappWorkspace = isWhatsAppWorkspacePath(next);
    const isTeamMember = whatsappWorkspace
      ? await isWhatsAppTeamEmailAllowed(identity.email)
      : false;

    if (next.startsWith("/admin/") && !isAdmin && !isTeamMember) {
      return NextResponse.json({ error: "This Google account is not approved for this workspace." }, { status: 403 });
    }

    if (whatsappWorkspace && isTeamMember) {
      await bindWhatsAppTeamGoogleIdentity({
        email: identity.email,
        googleUserId: identity.userId,
      });
    }

    const scheduler = isAdmin ? await resolveOwnerSchedulerIdentity(identity.email) : null;
    const response = NextResponse.json({ success: true, redirectTo: next });
    response.cookies.delete(getGoogleAuthCookieName());
    response.cookies.set({
      name: WEB_GROWTH_SESSION_COOKIE,
      value: createWebGrowthGoogleSessionValue(identity, scheduler),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(),
      path: "/",
      maxAge: getWebGrowthSessionTtlSeconds(),
    });
    return response;
  } catch (error) {
    console.error("Google identity sign-in failed:", error);
    return NextResponse.json({ error: "Google sign-in could not be completed. Please try again." }, { status: 500 });
  }
}
