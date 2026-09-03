import { escapeHtml } from "@/lib/security";

export const WEB_GROWTH_EMAIL_SITE_URL = "https://webgrowth.info";
export const WEB_GROWTH_EMAIL_LOGO_URL = `${WEB_GROWTH_EMAIL_SITE_URL}/email/web-growth-logo.png`;
export const WEB_GROWTH_EMAIL_PRIVACY_URL = `${WEB_GROWTH_EMAIL_SITE_URL}/privacy/`;
export const WEB_GROWTH_EMAIL_ADMIN = "admin@webgrowth.info";

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

export type WebGrowthEmailDetail = {
  label: string;
  value: string;
};

export type WebGrowthEmailAction = {
  label: string;
  url: string;
};

export type WebGrowthTransactionalEmailInput = {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  firstName?: string | null;
  paragraphs: string[];
  details?: WebGrowthEmailDetail[];
  action?: WebGrowthEmailAction | null;
  secondaryAction?: WebGrowthEmailAction | null;
  footerNote?: string | null;
  tagline?: string;
};

export function renderWebGrowthTransactionalEmail(input: WebGrowthTransactionalEmailInput) {
  const subject = escapeHtml(input.subject);
  const preheader = escapeHtml(input.preheader);
  const eyebrow = escapeHtml(input.eyebrow);
  const heading = escapeHtml(input.heading);
  const firstName = input.firstName?.trim() ? escapeHtml(input.firstName.trim()) : null;
  const tagline = escapeHtml(input.tagline || "Build. Automate. Grow.");

  const paragraphs = input.paragraphs
    .filter((value) => value.trim())
    .map(
      (value) =>
        `<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">${escapeHtml(value)}</p>`,
    )
    .join("");

  const details = input.details?.length
    ? `<tr><td class="wg-pad" style="padding:0 40px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${LEDGER_TINT};border-left:3px solid ${LEDGER};"><tr><td style="padding:18px 20px;">${input.details
        .map(
          (detail, index) =>
            `<p style="margin:${index === 0 ? "0" : "14px"} 0 5px;font-family:${SANS};font-size:11px;line-height:18px;text-transform:uppercase;letter-spacing:.1em;color:${LEDGER};">${escapeHtml(detail.label)}</p><p style="margin:0;font-family:${SANS};font-size:16px;line-height:25px;font-weight:600;color:${LEDGER_DEEP};word-break:break-word;">${escapeHtml(detail.value)}</p>`,
        )
        .join("")}</td></tr></table></td></tr>`
    : "";

  const action = input.action
    ? `<tr><td class="wg-pad" style="padding:8px 40px 34px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" class="wg-btn"><tr><td style="background-color:${LEDGER};"><a href="${escapeHtml(input.action.url)}" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(input.action.label)}</a></td></tr></table><p style="margin:15px 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};word-break:break-all;">If the button does not work, copy this link:<br><a href="${escapeHtml(input.action.url)}" style="color:${LEDGER};text-decoration:underline;">${escapeHtml(input.action.url)}</a></p>${
        input.secondaryAction
          ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:21px;color:${INK_FAINT};"><a href="${escapeHtml(input.secondaryAction.url)}" style="color:${LEDGER};font-weight:600;text-decoration:underline;">${escapeHtml(input.secondaryAction.label)}</a></p>`
          : ""
      }</td></tr>`
    : input.secondaryAction
      ? `<tr><td class="wg-pad" style="padding:8px 40px 34px;"><p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;"><a href="${escapeHtml(input.secondaryAction.url)}" style="color:${LEDGER};font-weight:600;text-decoration:underline;">${escapeHtml(input.secondaryAction.label)}</a></p></td></tr>`
      : "";

  const footerNote = input.footerNote?.trim()
    ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};">${escapeHtml(input.footerNote)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${subject}</title>
<style>
  @media only screen and (max-width:600px) {
    .wg-shell { width:100% !important; }
    .wg-pad { padding-left:24px !important; padding-right:24px !important; }
    .wg-h1 { font-size:27px !important; line-height:34px !important; }
    .wg-btn, .wg-btn tbody, .wg-btn tr, .wg-btn td { width:100% !important; }
    .wg-btn a { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wg-shell" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid ${RULE};">
          <tr>
            <td align="center" style="background-color:${LEDGER_DEEP};padding:26px 24px;">
              <a href="${WEB_GROWTH_EMAIL_SITE_URL}" style="text-decoration:none;">
                <img src="${WEB_GROWTH_EMAIL_LOGO_URL}" alt="Web Growth" width="200" height="30" style="display:block;width:200px;height:auto;border:0;outline:none;text-decoration:none;">
              </a>
            </td>
          </tr>
          <tr><td style="height:3px;background-color:${BRASS};font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="wg-pad" style="padding:38px 40px 12px;">
              <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${LEDGER_BRIGHT};">${eyebrow}</p>
              <h1 class="wg-h1" style="margin:0 0 22px;font-family:${SERIF};font-size:32px;line-height:40px;font-weight:400;color:${INK};">${heading}</h1>
              ${firstName ? `<p style="margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">Hi ${firstName},</p>` : ""}
              ${paragraphs}
            </td>
          </tr>
          ${details}
          ${action}
          <tr>
            <td class="wg-pad" style="background-color:${PAPER};border-top:1px solid ${RULE};padding:24px 40px;">
              <p style="margin:0 0 5px;font-family:${SANS};font-size:13px;line-height:20px;font-weight:600;color:${INK};">Web Growth</p>
              <p style="margin:0 0 10px;font-family:${SERIF};font-size:15px;line-height:22px;color:${LEDGER_BRIGHT};">${tagline}</p>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};"><a href="${WEB_GROWTH_EMAIL_SITE_URL}" style="color:${LEDGER};text-decoration:underline;">webgrowth.info</a> &nbsp;·&nbsp; <a href="${WEB_GROWTH_EMAIL_PRIVACY_URL}" style="color:${LEDGER};text-decoration:underline;">Privacy Policy</a></p>
              ${footerNote}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
