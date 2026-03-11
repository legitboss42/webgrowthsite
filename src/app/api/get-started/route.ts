import { NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@webgrowth.info";

type GetStartedBody = {
  projectNeed?: string;
  hasDomain?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  phoneOrWhatsApp?: string;
  selectedPackage?: string;
};

function requiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GetStartedBody;

    const {
      projectNeed,
      hasDomain,
      fullName,
      businessName,
      email,
      phoneOrWhatsApp,
      selectedPackage,
    } = body;

    if (
      !requiredString(projectNeed) ||
      !requiredString(hasDomain) ||
      !requiredString(fullName) ||
      !requiredString(businessName) ||
      !requiredString(email) ||
      !requiredString(phoneOrWhatsApp)
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const token = process.env.MAILERSEND_API_TOKEN;
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL;
    const fromName = process.env.MAILERSEND_FROM_NAME || "Web Growth";

    if (!token || !fromEmail) {
      return NextResponse.json(
        {
          error:
            "Email delivery is temporarily unavailable. Please use the email or WhatsApp option below.",
        },
        { status: 500 }
      );
    }

    const subject = `New Get Started Request - ${businessName}`;
    const lines = [
      "New Get Started submission",
      "",
      selectedPackage ? `Selected package: ${selectedPackage}` : "",
      `What I need: ${projectNeed}`,
      `Domain already owned: ${hasDomain}`,
      `Full name: ${fullName}`,
      `Business name: ${businessName}`,
      `Email: ${email}`,
      `Phone / WhatsApp: ${phoneOrWhatsApp}`,
    ].filter(Boolean);

    const textBody = lines.join("\n");
    const htmlBody = lines.map((line) => `<p>${line}</p>`).join("");

    const msRes = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [{ email: ADMIN_EMAIL, name: "Web Growth Admin" }],
        reply_to: {
          email,
          name: fullName,
        },
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!msRes.ok) {
      const errorPayload = await msRes.text();
      return NextResponse.json(
        {
          error: "MailerSend rejected the request.",
          details: errorPayload,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
