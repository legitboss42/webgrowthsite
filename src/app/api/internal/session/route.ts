import { NextResponse } from "next/server";
import {
  createInternalUtilityCookieValue,
  getInternalUtilityCookieName,
  getInternalUtilityTtlSeconds,
  isInternalUtilityConfigured,
  verifyInternalUtilityPassphrase,
} from "@/lib/internalUtilityAuth";
import { hasJsonContentType, isAllowedOrigin, sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function GET() {
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    if (!isAllowedOrigin(req, { allowMissingOrigin: false })) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!hasJsonContentType(req)) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    if (!isInternalUtilityConfigured()) {
      return NextResponse.json(
        { error: "Internal utility access is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const passphrase = sanitizeText(body?.passphrase, 120);
    if (!verifyInternalUtilityPassphrase(passphrase)) {
      return NextResponse.json({ error: "Invalid passphrase." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: getInternalUtilityCookieName(),
      value: createInternalUtilityCookieValue(),
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieFlag(),
      path: "/",
      maxAge: getInternalUtilityTtlSeconds(),
    });

    return response;
  } catch (error) {
    console.error("Internal utility unlock error:", error);
    return NextResponse.json(
      { error: "Unable to unlock the internal utility." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(getInternalUtilityCookieName());
  return response;
}
