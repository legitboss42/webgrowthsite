import { escapeHtml } from "@/lib/security";

const SITE_URL = "https://webgrowth.info";
const LOGO_URL = `${SITE_URL}/email/web-growth-logo.png`;

export function buildWhatsAppPasswordEmail(input: {
  displayName?: string | null;
  actionUrl: string;
  mode: "setup" | "reset";
}) {
  const firstName = input.displayName?.trim().split(/\s+/)[0] || "there";
  const safeName = escapeHtml(firstName);
  const safeUrl = escapeHtml(input.actionUrl);
  const setup = input.mode === "setup";
  const subject = setup ? "Set up your Web Growth workspace password" : "Reset your Web Growth workspace password";
  const action = setup ? "Create password" : "Reset password";

  const text = [
    `Hi ${firstName},`,
    "",
    setup
      ? "You can now create a password for your Web Growth WhatsApp workspace account."
      : "A password reset was requested for your Web Growth WhatsApp workspace account.",
    "",
    `${action}: ${input.actionUrl}`,
    "",
    "You can also continue using Google sign-in.",
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "Web Growth",
  ].join("\n");

  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#eff1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14140f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #d2d6cb"><tr><td align="center" style="background:#0c3327;padding:26px"><img src="${LOGO_URL}" width="200" alt="Web Growth" style="display:block;width:200px;height:auto"></td></tr><tr><td style="height:3px;background:#b4802f"></td></tr><tr><td style="padding:38px 40px"><p style="margin:0 0 10px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#1c7a54">Workspace security</p><h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:38px">${setup ? "Create your workspace password." : "Reset your workspace password."}</h1><p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#454a3f">Hi ${safeName},</p><p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#454a3f">${setup ? "Choose a password for your Web Growth WhatsApp workspace account. Google sign-in will remain available too." : "Use the secure link below to choose a new password for your Web Growth WhatsApp workspace account."}</p><a href="${safeUrl}" style="display:inline-block;background:#124a38;color:#fff;text-decoration:none;padding:14px 24px;font-weight:600">${action}</a><p style="margin:24px 0 0;font-size:13px;line-height:22px;color:#737868">If you did not request this, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}
