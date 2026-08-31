import { escapeHtml } from "@/lib/security";
import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";

export const WHATSAPP_TEAM_INVITATION_SUBJECT =
  "You're invited to the Web Growth WhatsApp workspace";

const SITE_URL = "https://webgrowth.info";
const WORKSPACE_URL = `${SITE_URL}/admin/whatsapp/conversations/`;
const LOGO_URL = `${SITE_URL}/email/web-growth-logo.png`;
const ADMIN_EMAIL = "admin@webgrowth.info";

const LEDGER = "#124a38";
const LEDGER_DEEP = "#0c3327";
const LEDGER_BRIGHT = "#1c7a54";
const LEDGER_TINT = "#dbe7de";
const INK = "#14140f";
const INK_SOFT = "#454a3f";
const INK_FAINT = "#737868";
const PAPER = "#eff1ec";
const RULE = "#d2d6cb";
const BRASS = "#b4802f";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export type WhatsAppTeamInvitationInput = {
  displayName: string;
  googleEmail: string;
  role: WhatsAppTeamRole;
  invitedByEmail?: string | null;
};

function roleLabel(role: WhatsAppTeamRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function firstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "there";
}

export function buildWhatsAppTeamInvitationEmail(input: WhatsAppTeamInvitationInput) {
  const role = roleLabel(input.role);
  const safeName = escapeHtml(firstName(input.displayName));
  const safeEmail = escapeHtml(input.googleEmail);
  const safeRole = escapeHtml(role);
  const safeInviter = escapeHtml(input.invitedByEmail || ADMIN_EMAIL);

  const text = [
    `Hi ${firstName(input.displayName)},`,
    "",
    `You've been invited to join the Web Growth WhatsApp Business workspace as a ${role}.`,
    "",
    `Your workspace access is tied to this Google account: ${input.googleEmail}`,
    "",
    "Use this same Google account to sign in and open your assigned WhatsApp workspace.",
    "",
    `Workspace: ${WORKSPACE_URL}`,
    "",
    `Invitation sent by: ${input.invitedByEmail || ADMIN_EMAIL}`,
    "",
    "If you were not expecting this invitation, contact admin@webgrowth.info.",
    "",
    "Web Growth",
    "Build. Automate. Grow.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${WHATSAPP_TEAM_INVITATION_SUBJECT}</title>
<style>
  @media only screen and (max-width:600px) {
    .wg-shell { width:100% !important; }
    .wg-pad { padding-left:24px !important; padding-right:24px !important; }
    .wg-h1 { font-size:27px !important; line-height:34px !important; }
    .wg-btn a { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You've been invited to the Web Growth WhatsApp workspace.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wg-shell" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid ${RULE};">
          <tr>
            <td align="center" style="background-color:${LEDGER_DEEP};padding:26px 24px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Web Growth" width="200" height="30" style="display:block;width:200px;height:auto;border:0;outline:none;text-decoration:none;">
              </a>
            </td>
          </tr>
          <tr><td style="height:3px;background-color:${BRASS};font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="wg-pad" style="padding:38px 40px 10px;">
              <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${LEDGER_BRIGHT};">Team invitation</p>
              <h1 class="wg-h1" style="margin:0 0 22px;font-family:${SERIF};font-size:32px;line-height:40px;font-weight:400;color:${INK};">Welcome to the WhatsApp workspace.</h1>
              <p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">Hi ${safeName},</p>
              <p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">You've been invited to join the Web Growth WhatsApp Business workspace.</p>
            </td>
          </tr>
          <tr>
            <td class="wg-pad" style="padding:0 40px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${LEDGER_TINT};border-left:3px solid ${LEDGER};">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;line-height:19px;text-transform:uppercase;letter-spacing:.08em;color:${LEDGER};">Your role</p>
                    <p style="margin:0 0 14px;font-family:${SANS};font-size:18px;line-height:26px;font-weight:700;color:${LEDGER_DEEP};">${safeRole}</p>
                    <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;line-height:19px;text-transform:uppercase;letter-spacing:.08em;color:${LEDGER};">Google account</p>
                    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:24px;font-weight:600;color:${LEDGER_DEEP};word-break:break-all;">${safeEmail}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="wg-pad" style="padding:0 40px 8px;">
              <p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">Your access is tied to the Google account above. Use that same account when signing in to the workspace.</p>
              <p style="margin:0 0 18px;font-family:${SANS};font-size:14px;line-height:23px;color:${INK_FAINT};">Invited by ${safeInviter}</p>
            </td>
          </tr>
          <tr>
            <td class="wg-pad" style="padding:8px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="wg-btn">
                <tr>
                  <td style="background-color:${LEDGER};">
                    <a href="${WORKSPACE_URL}" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Open WhatsApp Workspace</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="wg-pad" style="background-color:${PAPER};border-top:1px solid ${RULE};padding:24px 40px;">
              <p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:20px;font-weight:600;color:${INK};">Web Growth</p>
              <p style="margin:0 0 12px;font-family:${SERIF};font-size:15px;line-height:22px;color:${LEDGER_BRIGHT};">Build. Automate. Grow.</p>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};">If you were not expecting this invitation, contact <a href="mailto:${ADMIN_EMAIL}" style="color:${LEDGER};">${ADMIN_EMAIL}</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: WHATSAPP_TEAM_INVITATION_SUBJECT,
    text,
    html,
  };
}
