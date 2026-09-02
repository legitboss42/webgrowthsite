import { NextResponse } from "next/server";
import { isAllowedGoogleAdminEmail, sanitizeGoogleAuthNext } from "@/lib/googleAuth";
import {
  createWorkspacePasswordSessionValue,
  getWorkspacePasswordCookieName,
  getWorkspacePasswordTtlSeconds,
  isWorkspacePasswordAuthConfigured,
  signInWorkspaceWithPassword,
} from "@/lib/whatsapp/passwordAuth";
import {
  ensureWhatsAppOwnerTeamMember,
  findWhatsAppTeamMemberByEmail,
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
  if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }
  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }
  if (!isWorkspacePasswordAuthConfigured()) {
    return NextResponse.json({ error: "Email and password sign-in is not configured." }, { status: 503 });
  }

  const rate = checkRateLimit(`workspace-password:${getClientIp(request)}:${getUserAgent(request)}`, 10);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many sign-in attempts. Please wait and try again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const email = sanitizeText(body.email, 254).trim().toLowerCase();
  const password = sanitizeText(body.password, 256);
  const next = sanitizeGoogleAuthNext(sanitizeText(body.next, 300), "/admin/whatsapp/");

  if (!email || !password || !isWhatsAppWorkspacePath(next)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const signIn = await signInWorkspaceWithPassword(email, password);
  if (!signIn.ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const isOwner = isAllowedGoogleAdminEmail(signIn.user.email);
  const member = isOwner
    ? await ensureWhatsAppOwnerTeamMember({ email: signIn.user.email, displayName: signIn.user.fullName })
    : await findWhatsAppTeamMemberByEmail(signIn.user.email, { activeOnly: true });

  if (!member) {
    return NextResponse.json({ error: "This account is not approved for the Web Growth workspace." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: next });
  response.cookies.set({
    name: getWorkspacePasswordCookieName(),
    value: createWorkspacePasswordSessionValue({
      userId: signIn.user.id,
      email: signIn.user.email,
      fullName: member.displayName || signIn.user.fullName,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge: getWorkspacePasswordTtlSeconds(),
  });
  return response;
}
