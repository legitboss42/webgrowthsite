import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { buildWhatsAppSecurityEmail } from "@/emails/whatsapp-security-notice";
import { ADMIN_EMAIL, sendTransactionalEmail } from "@/lib/email";
import { createWorkspaceSupabaseClient } from "@/lib/whatsapp/passwordAuth";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
} from "@/lib/security";

export const runtime = "nodejs";

function readPassword(value: unknown) {
  return typeof value === "string" ? value.slice(0, 256) : "";
}

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

  const currentPassword = readPassword(body.currentPassword);
  const newPassword = readPassword(body.newPassword);
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

  try {
    const message = buildWhatsAppSecurityEmail({
      event: "password_changed",
      displayName: access.displayName,
      email: access.email,
      workspaceName: access.workspaceName,
    });
    await sendTransactionalEmail({
      to: [{ email: access.email, name: access.displayName || undefined }],
      replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error("Workspace password changed notice failed", error);
  }

  await client.auth.signOut();
  return NextResponse.json({ ok: true });
}
