import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import {
  renderWebGrowthTransactionalEmail,
  WEB_GROWTH_EMAIL_ADMIN,
  WEB_GROWTH_EMAIL_SITE_URL,
} from "./web-growth-transactional";

const WORKSPACE_URL = `${WEB_GROWTH_EMAIL_SITE_URL}/admin/whatsapp/`;

type SecurityEvent =
  | "password_changed"
  | "role_changed"
  | "deactivated"
  | "reactivated";

export type WhatsAppSecurityEmailInput = {
  event: SecurityEvent;
  displayName?: string | null;
  email: string;
  workspaceName?: string | null;
  oldRole?: WhatsAppTeamRole | null;
  newRole?: WhatsAppTeamRole | null;
};

function firstName(displayName?: string | null) {
  return displayName?.trim().split(/\s+/)[0] || "there";
}

function roleLabel(role?: WhatsAppTeamRole | null) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Not specified";
}

export function buildWhatsAppSecurityEmail(input: WhatsAppSecurityEmailInput) {
  const name = firstName(input.displayName);
  const workspace = input.workspaceName?.trim() || "Web Growth";

  if (input.event === "password_changed") {
    const subject = "Your Web Growth workspace password was changed";
    const text = [
      `Hi ${name},`,
      "",
      "Your Web Growth WhatsApp workspace password was changed successfully.",
      "",
      `Account: ${input.email}`,
      "",
      `If you did not make this change, contact ${WEB_GROWTH_EMAIL_ADMIN} immediately.`,
      "",
      "Web Growth",
    ].join("\n");
    return {
      subject,
      text,
      html: renderWebGrowthTransactionalEmail({
        subject,
        preheader: "Your Web Growth workspace password was changed.",
        eyebrow: "Security notice",
        heading: "Your password was changed.",
        firstName: name,
        paragraphs: [
          "Your Web Growth WhatsApp workspace password was changed successfully.",
          "If you made this change, no further action is required.",
        ],
        details: [{ label: "Account", value: input.email }],
        action: {
          label: "Contact Web Growth",
          url: `mailto:${WEB_GROWTH_EMAIL_ADMIN}`,
        },
        footerNote: `If you did not make this change, contact ${WEB_GROWTH_EMAIL_ADMIN} immediately.`,
      }),
    };
  }

  if (input.event === "role_changed") {
    const oldRole = roleLabel(input.oldRole);
    const newRole = roleLabel(input.newRole);
    const subject = `Your ${workspace} workspace role changed`;
    const text = [
      `Hi ${name},`,
      "",
      `Your role in the ${workspace} WhatsApp workspace has changed.`,
      "",
      `Previous role: ${oldRole}`,
      `New role: ${newRole}`,
      "",
      `If you were not expecting this change, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
      "",
      `Workspace: ${WORKSPACE_URL}`,
    ].join("\n");
    return {
      subject,
      text,
      html: renderWebGrowthTransactionalEmail({
        subject,
        preheader: `Your ${workspace} workspace permissions have changed.`,
        eyebrow: "Access update",
        heading: "Your workspace role changed.",
        firstName: name,
        paragraphs: [`Your permissions in the ${workspace} WhatsApp workspace have been updated.`],
        details: [
          { label: "Previous role", value: oldRole },
          { label: "New role", value: newRole },
        ],
        action: { label: "Open workspace", url: WORKSPACE_URL },
        footerNote: `If you were not expecting this change, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
      }),
    };
  }

  if (input.event === "deactivated") {
    const subject = `Your ${workspace} workspace access was disabled`;
    const text = [
      `Hi ${name},`,
      "",
      `Your access to the ${workspace} WhatsApp workspace has been disabled.`,
      "",
      `Account: ${input.email}`,
      "",
      `If you believe this was a mistake, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
    ].join("\n");
    return {
      subject,
      text,
      html: renderWebGrowthTransactionalEmail({
        subject,
        preheader: `Your ${workspace} workspace access has been disabled.`,
        eyebrow: "Access update",
        heading: "Your workspace access was disabled.",
        firstName: name,
        paragraphs: [`Your access to the ${workspace} WhatsApp workspace has been disabled.`],
        details: [{ label: "Account", value: input.email }],
        action: {
          label: "Contact Web Growth",
          url: `mailto:${WEB_GROWTH_EMAIL_ADMIN}`,
        },
        footerNote: `If you believe this was a mistake, contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
      }),
    };
  }

  const subject = `Your ${workspace} workspace access was restored`;
  const text = [
    `Hi ${name},`,
    "",
    `Your access to the ${workspace} WhatsApp workspace has been restored.`,
    "",
    `Account: ${input.email}`,
    "",
    `Workspace: ${WORKSPACE_URL}`,
  ].join("\n");
  return {
    subject,
    text,
    html: renderWebGrowthTransactionalEmail({
      subject,
      preheader: `Your ${workspace} workspace access has been restored.`,
      eyebrow: "Access update",
      heading: "Your workspace access is active again.",
      firstName: name,
      paragraphs: [`Your access to the ${workspace} WhatsApp workspace has been restored.`],
      details: [{ label: "Account", value: input.email }],
      action: { label: "Open workspace", url: WORKSPACE_URL },
      footerNote: `Questions about your access? Contact ${WEB_GROWTH_EMAIL_ADMIN}.`,
    }),
  };
}
