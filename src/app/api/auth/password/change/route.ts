import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { createWorkspaceSupabaseClient } from "@/lib/whatsapp/passwordAuth";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  sanitizeText,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }
  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }

  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Sign in again before changing your password." }, { status: 401 });
  }

  const rate = checkRateLimit(`workspace-password-change:${access.email}:${getClientIp(request)}:${getUserAgent(request)}`, 8);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many password attempts. Please wait and try again." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const currentPassword = sanitizeText(body.currentPassword, 256);
  const newPassword = sanitizeText(body.newPassword, 256);
  if (!currentPassword || newPassword.length < 10) {
    return NextResponse.json({ error: "Enter your current password and a new password of at least 10 characters." }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Choose a new password that is different from your current password." }, { status: 400 });
  }

  const client = createWorkspaceSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: "Password service is unavailable." }, { status: 503 });
  }

  const { error: signInError } = await client.auth.signInWithPassword({
    email: access.email,
    password: currentPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: "Your current password is incorrect. If you have never set one, use the setup/reset link instead." }, { status: 401 });
  }

  const { error: updateError } = await client.auth.updateUser({ password: newPassword });
  if (updateError) {
    return NextResponse.json({ error: updateError.message || "Password could not be changed." }, { status: 400 });
  }

  await client.auth.signOut();
  return NextResponse.json({ ok: true });
}
