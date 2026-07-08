import { NextResponse } from "next/server";
import { buildLowCpuJsonResponse, LOW_CPU_EMERGENCY_MODE } from "@/lib/emergency";
import {
  checkRateLimit,
  escapeHtml,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  isLikelyAutomationRequest,
  isValidEmail,
  sanitizeText,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  ADMIN_EMAIL,
  sendTransactionalEmail,
} from "@/lib/email";

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
  if (LOW_CPU_EMERGENCY_MODE) {
    const response = buildLowCpuJsonResponse();
    return NextResponse.json(response.body, response.init);
  }

  try {
    if (!isAllowedOrigin(req, { allowMissingOrigin: false })) {
      return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
    }

    if (!hasJsonContentType(req)) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    if (isLikelyAutomationRequest(req)) {
      return NextResponse.json({ error: "Automated traffic is not allowed." }, { status: 403 });
    }

    const ip = getClientIp(req);
    const ua = getUserAgent(req).slice(0, 80).toLowerCase();
    const rate = checkRateLimit(`get-started:${ip}:${ua}`, 5);
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

    if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
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

    await sendTransactionalEmail({
      to: [{ email: ADMIN_EMAIL, name: "Web Growth Admin" }],
      subject,
      text: textBody,
      html: htmlBody,
      replyTo: {
        email,
        name: fullName,
      },
    });

    const confirmationText = [
      "Thanks for starting your website request with Web Growth.",
      "",
      "We received your details and will review the right next step for your business.",
      "",
      `Selected package: ${selectedPackage || "Not specified"}`,
      `What you need: ${projectNeed}`,
      `Domain already owned: ${hasDomain}`,
      `Business name: ${businessName}`,
      "",
      "We will reply within one business day.",
      "",
      "Reply to this email if you want to add more context before we respond.",
    ].join("\n");

    const confirmationHtml = [
      "<p>Thanks for starting your website request with Web Growth.</p>",
      "<p>We received your details and will review the right next step for your business.</p>",
      "<ul>",
      `<li>${escapeHtml(`Selected package: ${selectedPackage || "Not specified"}`)}</li>`,
      `<li>${escapeHtml(`What you need: ${projectNeed}`)}</li>`,
      `<li>${escapeHtml(`Domain already owned: ${hasDomain}`)}</li>`,
      `<li>${escapeHtml(`Business name: ${businessName}`)}</li>`,
      "</ul>",
      "<p>We will reply within one business day.</p>",
      "<p>Reply to this email if you want to add more context before we respond.</p>",
    ].join("");

    await sendTransactionalEmail({
      to: [{ email, name: fullName }],
      subject: "We received your website request",
      text: confirmationText,
      html: confirmationHtml,
      replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[get-started]", error);
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
