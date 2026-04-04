import { NextResponse } from "next/server";
import {
  checkRateLimit,
  escapeHtml,
  getClientIp,
  isAllowedOrigin,
  isValidEmail,
  sanitizeText,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

const ADMIN_EMAIL = "admin@webgrowth.info";
export const runtime = "nodejs";

type GetStartedBody = {
  projectNeed?: string;
  hasDomain?: string;
  fullName?: string;
  businessName?: string;
  email?: string;
  phoneOrWhatsApp?: string;
  selectedPackage?: string;
  turnstileToken?: string;
};

function requiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(`get-started:${ip}`, 8);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as GetStartedBody;

    const projectNeed = sanitizeText(body.projectNeed, 80);
    const hasDomain = sanitizeText(body.hasDomain, 10);
    const fullName = sanitizeText(body.fullName, 120);
    const businessName = sanitizeText(body.businessName, 160);
    const email = sanitizeText(body.email, 254).toLowerCase();
    const phoneOrWhatsApp = sanitizeText(body.phoneOrWhatsApp, 40);
    const selectedPackage = sanitizeText(body.selectedPackage, 120);
    const turnstileToken = sanitizeText(body.turnstileToken, 2048);

    if (
      !requiredString(projectNeed) ||
      !requiredString(hasDomain) ||
      !requiredString(fullName) ||
      !requiredString(businessName) ||
      !requiredString(email) ||
      !requiredString(phoneOrWhatsApp) ||
      !requiredString(turnstileToken)
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const turnstile = await verifyTurnstileToken({
      token: turnstileToken,
      ip,
      expectedAction: "get_started",
    });

    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 });
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
    const htmlBody = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

    const msRes = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
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
      return NextResponse.json(
        {
          error: "Could not send your request right now.",
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
