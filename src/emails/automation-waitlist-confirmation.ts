import { escapeHtml } from "@/lib/security";
import {
  getFirstName,
  getInterestEmailLabel,
} from "@/lib/waitlist/schema";

/**
 * The single canonical Web Growth Automation waitlist confirmation email.
 *
 * One reusable template, kept out of the route handler. Returns the exact shape
 * sendTransactionalEmail() accepts, so there is no HTML in the API layer.
 *
 * Body copy is the approved wording and is intentionally not paraphrased.
 * Layout is table-based with inline styles for email-client compatibility; the
 * logo is a PNG because Outlook desktop does not render WebP.
 */

export const WAITLIST_CONFIRMATION_SUBJECT =
  "You're on the Web Growth Automation Waitlist";

const SITE_URL = "https://webgrowth.info";
const LOGO_URL = `${SITE_URL}/email/web-growth-logo.png`;
const PRIVACY_URL = `${SITE_URL}/privacy/`;

// Growth Ledger brand tokens, hardcoded because email cannot use CSS variables.
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

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export type WaitlistConfirmationInput = {
  fullName: string | null | undefined;
  interest: string;
};

export type WaitlistConfirmationEmail = {
  subject: string;
  text: string;
  html: string;
};

function buildText(firstName: string, interestLabel: string): string {
  return [
    `Hi ${firstName},`,
    "",
    "You're officially on the Web Growth Automation waitlist.",
    "",
    "We're building tools designed to help businesses and creators spend less time on repetitive work and more time growing.",
    "",
    "Based on your signup, you're interested in:",
    "",
    interestLabel,
    "",
    "Our first tools include:",
    "",
    "• WhatsApp Business automation for customer conversations, contacts, messaging workflows, campaigns, and team communication.",
    "",
    "• TikTok scheduling tools designed to make planning and publishing content easier.",
    "",
    "We're actively building and testing these tools now.",
    "",
    "As we get closer to launch, we'll send you product updates and early-access information.",
    "",
    "Thanks for joining us early.",
    "",
    "Web Growth",
    "Build. Automate. Grow.",
    "",
    SITE_URL,
    "",
    "---",
    "You received this email because you joined the Web Growth Automation waitlist.",
    `Privacy policy: ${PRIVACY_URL}`,
  ].join("\n");
}

function buildHtml(firstName: string, interestLabel: string): string {
  const safeFirstName = escapeHtml(firstName);
  const safeInterest = escapeHtml(interestLabel);

  const paragraph = `margin:0 0 18px;font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};`;

  const bullet = (text: string) => `
                    <tr>
                      <td style="padding:0 0 14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td width="20" valign="top" style="font-family:${SANS};font-size:16px;line-height:26px;color:${LEDGER_BRIGHT};">&bull;</td>
                            <td style="font-family:${SANS};font-size:16px;line-height:26px;color:${INK_SOFT};">${text}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${WAITLIST_CONFIRMATION_SUBJECT}</title>
<style>
  @media only screen and (max-width:600px) {
    .wg-shell { width:100% !important; }
    .wg-pad { padding-left:24px !important; padding-right:24px !important; }
    .wg-h1 { font-size:26px !important; line-height:34px !important; }
    .wg-btn a { display:block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You're officially on the Web Growth Automation waitlist.</div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wg-shell" style="width:600px;max-width:600px;background-color:#ffffff;border:1px solid ${RULE};">

          <!-- Header band: white logo artwork requires a dark ground -->
          <tr>
            <td align="center" style="background-color:${LEDGER_DEEP};padding:26px 24px;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Web Growth" width="200" height="30" style="display:block;width:200px;height:auto;border:0;outline:none;text-decoration:none;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:3px;background-color:${BRASS};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="wg-pad" style="padding:38px 40px 8px;">
              <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${LEDGER_BRIGHT};">Early access confirmed</p>
              <h1 class="wg-h1" style="margin:0 0 22px;font-family:${SERIF};font-size:32px;line-height:40px;font-weight:400;color:${INK};">You're on the list.</h1>

              <p style="${paragraph}">Hi ${safeFirstName},</p>
              <p style="${paragraph}">You're officially on the Web Growth Automation waitlist.</p>
              <p style="${paragraph}">We're building tools designed to help businesses and creators spend less time on repetitive work and more time growing.</p>
            </td>
          </tr>

          <!-- Interest callout -->
          <tr>
            <td class="wg-pad" style="padding:0 40px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${LEDGER_TINT};border-left:3px solid ${LEDGER};">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:20px;color:${LEDGER};">Based on your signup, you're interested in:</p>
                    <p style="margin:0;font-family:${SANS};font-size:17px;line-height:26px;font-weight:600;color:${LEDGER_DEEP};">${safeInterest}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products -->
          <tr>
            <td class="wg-pad" style="padding:0 40px;">
              <p style="${paragraph}">Our first tools include:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
${bullet("WhatsApp Business automation for customer conversations, contacts, messaging workflows, campaigns, and team communication.")}
${bullet("TikTok scheduling tools designed to make planning and publishing content easier.")}
              </table>
            </td>
          </tr>

          <tr>
            <td class="wg-pad" style="padding:16px 40px 0;">
              <p style="${paragraph}">We're actively building and testing these tools now.</p>
              <p style="${paragraph}">As we get closer to launch, we'll send you product updates and early-access information.</p>
              <p style="${paragraph}">Thanks for joining us early.</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="wg-pad" align="left" style="padding:14px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="wg-btn">
                <tr>
                  <td style="background-color:${LEDGER};">
                    <a href="${SITE_URL}" style="display:inline-block;padding:15px 30px;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Visit Web Growth</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td class="wg-pad" style="padding:0 40px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="border-top:1px solid ${RULE};font-size:0;line-height:0;padding-top:26px;">&nbsp;</td></tr>
              </table>
              <p style="margin:0;font-family:${SANS};font-size:15px;line-height:24px;font-weight:600;color:${INK};">Web Growth</p>
              <p style="margin:2px 0 0;font-family:${SERIF};font-size:16px;line-height:24px;color:${LEDGER_BRIGHT};">Build. Automate. Grow.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="wg-pad" style="background-color:${PAPER};border-top:1px solid ${RULE};padding:24px 40px;">
              <p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:20px;font-weight:600;color:${INK};">Web Growth</p>
              <p style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:20px;color:${INK_FAINT};">
                <a href="${SITE_URL}" style="color:${LEDGER};text-decoration:underline;">webgrowth.info</a>
              </p>
              <p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};">You received this email because you joined the Web Growth Automation waitlist.</p>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:19px;color:${INK_FAINT};">
                <a href="${PRIVACY_URL}" style="color:${LEDGER};text-decoration:underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWaitlistConfirmationEmail({
  fullName,
  interest,
}: WaitlistConfirmationInput): WaitlistConfirmationEmail {
  const firstName = getFirstName(fullName);
  const interestLabel = getInterestEmailLabel(interest);

  return {
    subject: WAITLIST_CONFIRMATION_SUBJECT,
    text: buildText(firstName, interestLabel),
    html: buildHtml(firstName, interestLabel),
  };
}
