import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import {
  renderWebGrowthTransactionalEmail,
  WEB_GROWTH_EMAIL_ADMIN,
  WEB_GROWTH_EMAIL_SITE_URL,
} from "./web-growth-transactional";

export const WHATSAPP_TEAM_INVITATION_SUBJECT =
  "You're invited to the Web Growth WhatsApp workspace";

const WORKSPACE_URL = `${WEB_GROWTH_EMAIL_SITE_URL}/admin/whatsapp/conversations/`;

export type WhatsAppTeamInvitationInput = {
  displayName: string;
  googleEmail: string;
  role: WhatsAppTeamRole;
  invitedByEmail?: string | null;
  passwordSetupUrl?: string | null;
};

function roleLabel(role: WhatsAppTeamRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function firstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "there";
}

export function buildWhatsAppTeamInvitationEmail(input: WhatsAppTeamInvitationInput) {
  const role = roleLabel(input.role);
  const name = firstName(input.displayName);
  const inviter = input.invitedByEmail || WEB_GROWTH_EMAIL_ADMIN;

  const text = [
    `Hi ${name},`,
    "",
    `You've been invited to join the Web Growth WhatsApp Business workspace as a ${role}.`,
    "",
    `Workspace email: ${input.googleEmail}`,
    "",
    "You can sign in with Google using this email address.",
    ...(input.passwordSetupUrl
      ? ["", `Or choose a password for email sign-in: ${input.passwordSetupUrl}`]
      : []),
    "",
    `Workspace: ${WORKSPACE_URL}`,
    "",
    `Invitation sent by: ${inviter}`,
    "",
    `If you were not expecting this invitation, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
    "",
    "Web Growth",
    "Build. Automate. Grow.",
  ].join("\n");

  const html = renderWebGrowthTransactionalEmail({
    subject: WHATSAPP_TEAM_INVITATION_SUBJECT,
    preheader: "You've been invited to the Web Growth WhatsApp workspace.",
    eyebrow: "Team invitation",
    heading: "Welcome to the WhatsApp workspace.",
    firstName: name,
    paragraphs: [
      "You've been invited to join the Web Growth WhatsApp Business workspace.",
      input.passwordSetupUrl
        ? "Sign in with Google using the workspace email below, or create a password for email sign-in."
        : "Sign in with Google using the workspace email below.",
    ],
    details: [
      { label: "Your role", value: role },
      { label: "Workspace email", value: input.googleEmail },
      { label: "Invited by", value: inviter },
    ],
    action: input.passwordSetupUrl
      ? { label: "Set up password", url: input.passwordSetupUrl }
      : { label: "Open WhatsApp Workspace", url: WORKSPACE_URL },
    secondaryAction: input.passwordSetupUrl
      ? { label: "Prefer Google? Open the workspace", url: WORKSPACE_URL }
      : null,
    footerNote: `If you were not expecting this invitation, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
  });

  return {
    subject: WHATSAPP_TEAM_INVITATION_SUBJECT,
    text,
    html,
  };
}
