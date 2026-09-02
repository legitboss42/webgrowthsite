import { NextResponse } from "next/server";
import {
  getGoogleAuthCookieName,
  getGoogleOAuthStateCookieName,
} from "@/lib/googleAuth";
import { SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { getWorkspacePasswordCookieName } from "@/lib/whatsapp/passwordAuth";
import { isAllowedOrigin } from "@/lib/security";

export const runtime = "nodejs";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/admin/whatsapp/", request.url), 303);

  clearCookie(response, getGoogleAuthCookieName());
  clearCookie(response, getGoogleOAuthStateCookieName());
  clearCookie(response, getWorkspacePasswordCookieName());
  clearCookie(response, SCHEDULER_SESSION_COOKIE);

  return response;
}
