import { NextResponse } from "next/server";
import { buildWhatsAppPasswordEmail } from "@/emails/whatsapp-password-link";
import { ADMIN_EMAIL, sendTransactionalEmail } from "@/lib/email";
import { isAllowedGoogleAdminEmail } from "@/lib/googleAuth";
import { generateWorkspacePasswordResetLink } from "@/lib/whatsapp/passwordAuth";
import { findWhatsAppTeamMemberByEmail } from "@/lib/whatsapp/teamAccess";
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

  const rate = checkRateLimit(`workspace-password-reset:${getClientIp(request)}:${getUserAgent(request)}`, 5);
  if (!rate.ok) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const email = sanitizeText(body.email, 254).trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: true });

  const isOwner = isAllowedGoogleAdminEmail(email);
  const member = isOwner ? null : await findWhatsAppTeamMemberByEmail(email, { activeOnly: true });
  if (!isOwner && !member) return NextResponse.json({ ok: true });

  try {
    const actionUrl = await generateWorkspacePasswordResetLink(email);
    if (!actionUrl) {
      console.error("Workspace password reset link generation failed", {
        authorizedAccount: true,
      });
      return NextResponse.json({ ok: true });
    }

    const message = buildWhatsAppPasswordEmail({
      displayName: member?.displayName || (isOwner ? "Web Growth Owner" : null),
      actionUrl,
      mode: "reset",
    });
    const delivery = await sendTransactionalEmail({
      to: [{ email, name: member?.displayName || undefined }],
      replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    if (!delivery.ok) {
      console.error("Workspace password reset email was not submitted", {
        reason: delivery.reason,
      });
    }
  } catch (error) {
    console.error("Workspace password reset email failed", error);
  }

  return NextResponse.json({ ok: true });
}
