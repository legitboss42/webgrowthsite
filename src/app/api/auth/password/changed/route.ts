import { NextResponse } from "next/server";
import { buildWhatsAppSecurityEmail } from "@/emails/whatsapp-security-notice";
import { ADMIN_EMAIL, sendTransactionalEmail } from "@/lib/email";
import { getWorkspaceAuthUserFromAccessToken } from "@/lib/whatsapp/passwordAuth";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  isAllowedOrigin,
} from "@/lib/security";

export const runtime = "nodejs";

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() || "";
  return authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request, { allowMissingOrigin: false })) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  const user = await getWorkspaceAuthUserFromAccessToken(readBearerToken(request));
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rate = checkRateLimit(
    `workspace-password-changed-notice:${user.email}:${getClientIp(request)}:${getUserAgent(request)}`,
    4,
  );
  if (!rate.ok) return NextResponse.json({ ok: true });

  try {
    const message = buildWhatsAppSecurityEmail({
      event: "password_changed",
      displayName: user.fullName,
      email: user.email,
    });
    await sendTransactionalEmail({
      to: [{ email: user.email, name: user.fullName || undefined }],
      replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error("Workspace password changed notice failed", error);
  }

  return NextResponse.json({ ok: true });
}
