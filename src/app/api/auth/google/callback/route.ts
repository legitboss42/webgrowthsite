import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createGoogleAuthSessionValue,
  exchangeGoogleCodeForIdentity,
  getGoogleAuthCookieName,
  getGoogleAuthTtlSeconds,
  getGoogleOAuthStateCookieName,
  isAllowedGoogleAdminEmail,
  readGoogleOAuthState,
} from "@/lib/googleAuth";
import {
  bindWhatsAppTeamGoogleIdentity,
  isWhatsAppTeamEmailAllowed,
} from "@/lib/whatsapp/teamAccess";

export const runtime = "nodejs";

function buildErrorRedirect(requestUrl: URL, code: string) {
  const target = new URL("/auth/google/callback/", requestUrl.origin);
  target.searchParams.set("error", code);
  return NextResponse.redirect(target);
}

function secureCookieFlag(requestUrl: URL) {
  return requestUrl.protocol === "https:";
}

function isWhatsAppWorkspacePath(path: string) {
  return path === "/admin/whatsapp" || path.startsWith("/admin/whatsapp/");
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const stateCookieName = getGoogleOAuthStateCookieName();
  const stateCookie = cookieStore.get(stateCookieName)?.value;
  const savedState = readGoogleOAuthState(stateCookie);
  const returnedState = requestUrl.searchParams.get("state") || "";
  const returnedError = requestUrl.searchParams.get("error") || "";
  const returnedCode = requestUrl.searchParams.get("code") || "";

  if (!savedState || !returnedState || returnedState !== savedState.state) {
    const response = buildErrorRedirect(requestUrl, "state");
    response.cookies.delete(stateCookieName);
    return response;
  }

  if (returnedError) {
    const response = buildErrorRedirect(
      requestUrl,
      returnedError === "access_denied" ? "cancelled" : "provider",
    );
    response.cookies.delete(stateCookieName);
    return response;
  }

  if (!returnedCode) {
    const response = buildErrorRedirect(requestUrl, "code");
    response.cookies.delete(stateCookieName);
    return response;
  }

  try {
    const identity = await exchangeGoogleCodeForIdentity(returnedCode);
    const isAdmin = isAllowedGoogleAdminEmail(identity.email);
    const whatsappWorkspace = isWhatsAppWorkspacePath(savedState.next);
    const isTeamMember = whatsappWorkspace
      ? await isWhatsAppTeamEmailAllowed(identity.email)
      : false;

    if (savedState.next.startsWith("/admin/") && !isAdmin && !isTeamMember) {
      const response = buildErrorRedirect(requestUrl, "not-approved");
      response.cookies.delete(stateCookieName);
      return response;
    }

    if (whatsappWorkspace && isTeamMember) {
      await bindWhatsAppTeamGoogleIdentity({
        email: identity.email,
        googleUserId: identity.userId,
      });
    }

    const response = NextResponse.redirect(new URL(savedState.next, requestUrl.origin));
    response.cookies.delete(stateCookieName);
    response.cookies.set({
      name: getGoogleAuthCookieName(),
      value: createGoogleAuthSessionValue(identity),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(requestUrl),
      path: "/",
      maxAge: getGoogleAuthTtlSeconds(),
    });
    return response;
  } catch (error) {
    console.error("Google sign-in callback failed:", error);
    const response = buildErrorRedirect(requestUrl, "exchange");
    response.cookies.delete(stateCookieName);
    return response;
  }
}
