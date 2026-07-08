type EmailRecipient = {
  email: string;
  name?: string;
};

type SendEmailInput = {
  to: EmailRecipient[];
  subject: string;
  text: string;
  html: string;
  replyTo?: EmailRecipient;
};

export const ADMIN_EMAIL = "admin@webgrowth.info";

type BrevoConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

function getBrevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Web Growth";

  if (!apiKey || !fromEmail) {
    return null;
  }

  return { apiKey, fromEmail, fromName };
}

export function isEmailDeliveryConfigured() {
  return Boolean(getBrevoConfig());
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const config = getBrevoConfig();

  if (!config) {
    return { ok: false as const, reason: "setup_required" as const };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      sender: {
        email: config.fromEmail,
        name: config.fromName,
      },
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      textContent: input.text,
      htmlContent: input.html,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Brevo email failed (${response.status}): ${details}`);
  }

  return { ok: true as const };
}
