import { NextResponse } from "next/server";
import {
  createGoogleAuthSessionValue,
  createSupabaseAuthClient,
  getGoogleAuthCookieName,
  getGoogleAuthTtlSeconds,
  isAllowedGoogleAdminEmail,
  sanitizeGoogleAuthNext,
} from "@/lib/googleAuth";
import { hasJsonContentType, isAllowedOrigin, sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function POST(req: Request) {
  try {
    if (!isAllowedOrigin(req, { allowMissingOrigin: false })) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!hasJsonContentType(req)) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const accessToken = sanitizeText(body.accessToken, 4096);
    const next = sanitizeGoogleAuthNext(sanitizeText(body.next, 300), "/");

    if (!accessToken) {
      return NextResponse.json({ error: "Missing Google access token." }, { status: 400 });
    }

    const supabase = createSupabaseAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ error: "Google session could not be verified." }, { status: 401 });
    }

    const email = user.email?.trim().toLowerCase() || "";
    if (!email || !user.email_confirmed_at) {
      return NextResponse.json({ error: "Google did not return a verified email address." }, { status: 400 });
    }

    const adminEmail = isAllowedGoogleAdminEmail(email);
    if (next.startsWith("/admin/") && !adminEmail) {
      return NextResponse.json(
        { error: "This Google account is not approved for admin access." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: adminEmail ? (next.startsWith("/admin/") ? next : "/admin/waitlist/") : next,
    });

    response.cookies.set({
      name: getGoogleAuthCookieName(),
      value: createGoogleAuthSessionValue({
        userId: user.id,
        email,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(),
      path: "/",
      maxAge: getGoogleAuthTtlSeconds(),
    });

    return response;
  } catch (error) {
    console.error("Google session finalization failed:", error);
    return NextResponse.json({ error: "Unable to finish Google sign-in." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(getGoogleAuthCookieName());
  return response;
}
