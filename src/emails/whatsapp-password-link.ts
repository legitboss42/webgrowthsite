import {
  renderWebGrowthTransactionalEmail,
  WEB_GROWTH_EMAIL_ADMIN,
} from "./web-growth-transactional";

export function buildWhatsAppPasswordEmail(input: {
  displayName?: string | null;
  actionUrl: string;
  mode: "setup" | "reset";
}) {
  const firstName = input.displayName?.trim().split(/\s+/)[0] || "there";
  const setup = input.mode === "setup";
  const subject = setup
    ? "Set up your Web Growth workspace password"
    : "Reset your Web Growth workspace password";
  const action = setup ? "Create password" : "Reset password";
  const heading = setup
    ? "Create your workspace password."
    : "Reset your workspace password.";

  const text = [
    `Hi ${firstName},`,
    "",
    setup
      ? "You can now create a password for your Web Growth WhatsApp workspace account."
      : "A password reset was requested for your Web Growth WhatsApp workspace account.",
    "",
    `${action}: ${input.actionUrl}`,
    "",
    "Google sign-in will remain available.",
    "",
    "If you did not request this, ignore this email and contact admin@webgrowth.info if you are concerned about your account.",
    "",
    "Web Growth",
    "Build. Automate. Grow.",
  ].join("\n");

  const html = renderWebGrowthTransactionalEmail({
    subject,
    preheader: setup
      ? "Create your Web Growth workspace password."
      : "Use this secure link to reset your Web Growth workspace password.",
    eyebrow: "Workspace security",
    heading,
    firstName,
    paragraphs: [
      setup
        ? "Choose a password for your Web Growth WhatsApp workspace account. Google sign-in will remain available too."
        : "Use the secure link below to choose a new password for your Web Growth WhatsApp workspace account.",
      "For your security, use the link only from a device you trust.",
    ],
    details: [
      { label: "Sign-in option", value: "Email + password, with Google sign-in still available" },
    ],
    action: { label: action, url: input.actionUrl },
    footerNote: `If you did not request this, ignore the email and contact ${WEB_GROWTH_EMAIL_ADMIN} if you are concerned about your account.`,
  });

  return { subject, text, html };
}
