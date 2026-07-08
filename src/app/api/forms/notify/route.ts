import { NextResponse } from "next/server";
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

type NotifyBody = {
  formType?: string;
  subject?: string;
  fields?: Record<string, unknown>;
  turnstileToken?: string;
};

function prettifyKey(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildConfirmationCopy(formType: string) {
  switch (formType) {
    case "website_review_request":
      return {
        subject: "We received your website review request",
        intro: "Thanks for requesting a website review from Web Growth.",
        outro:
          "We will review what you sent and reply with the clearest next step within one business day.",
      };
    case "website_build_inquiry":
      return {
        subject: "We received your website build inquiry",
        intro: "Thanks for reaching out about your website build.",
        outro:
          "We will review your project details and send the next-step recommendation within one business day.",
      };
    default:
      return {
        subject: "We received your request",
        intro: "Thanks for contacting Web Growth.",
        outro:
          "We will review your message and reply with the best next step within one business day.",
      };
  }
}

export async function POST(req: Request) {
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
    const rate = checkRateLimit(`forms-notify:${ip}:${ua}`, 6);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as NotifyBody;

    const formType = sanitizeText(body.formType, 64) || "website_form";
    const subject =
      sanitizeText(body.subject, 140) ||
      `New Website Form Submission - ${formType}`;
    const turnstileToken = sanitizeText(body.turnstileToken, 2048);
    const fields = body.fields && typeof body.fields === "object" ? body.fields : {};
    const normalizedEntries = Object.entries(fields).slice(0, 20);
    const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY);
    const shouldRequireTurnstile = hasTurnstileSecret;
    const fieldMap = Object.fromEntries(
      normalizedEntries.map(([key, value]) => [
        sanitizeText(key, 80),
        sanitizeText(value, 1200),
      ])
    );
    const email = sanitizeText(fieldMap.email, 254).toLowerCase();

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (formType === "website_review_request") {
      const requiredFields = [
        ["name", "Name"],
        ["email", "Email"],
        ["help_needed", "What do you need help with?"],
        ["main_issue", "Main issue"],
      ] as const;

      for (const [key, label] of requiredFields) {
        if (!fieldMap[key]) {
          return NextResponse.json({ error: `${label} is required.` }, { status: 400 });
        }
      }
    }

    if (shouldRequireTurnstile && !turnstileToken) {
      return NextResponse.json(
        { error: "Please complete the spam check." },
        { status: 400 }
      );
    }

    if (turnstileToken && hasTurnstileSecret) {
      const turnstile = await verifyTurnstileToken({
        token: turnstileToken,
        ip,
        expectedAction: formType,
      });

      if (!turnstile.ok) {
        return NextResponse.json({ error: turnstile.error }, { status: 400 });
      }
    }

    if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL) {
      if (process.env.NODE_ENV !== "production") {
        console.info("[forms-notify][fallback]", { formType, subject, fields: fieldMap });
      }

      return NextResponse.json({ ok: true, delivery: "setup_required" }, { status: 202 });
    }

    const lines = [
      `Form type: ${formType}`,
      `Submitted at: ${new Date().toISOString()}`,
      "",
      ...Object.entries(fieldMap).map(([key, value]) => `${key}: ${value}`),
    ];

    const textBody = lines.join("\n");
    const htmlBody = lines
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");

    await sendTransactionalEmail({
      to: [{ email: ADMIN_EMAIL, name: "Web Growth Admin" }],
      subject,
      text: textBody,
      html: htmlBody,
      replyTo: email ? { email, name: fieldMap.name || "Website lead" } : undefined,
    });

    if (email) {
      const confirmation = buildConfirmationCopy(formType);
      const summaryLines = Object.entries(fieldMap)
        .filter(([key]) => key !== "page_path" && key !== "local_spam_bypass")
        .map(([key, value]) => `${prettifyKey(key)}: ${value}`);

      const confirmationText = [
        confirmation.intro,
        "",
        "We received the following details:",
        ...summaryLines,
        "",
        confirmation.outro,
        "",
        "Reply to this email if you need to add anything else.",
      ].join("\n");

      const confirmationHtml = [
        `<p>${escapeHtml(confirmation.intro)}</p>`,
        "<p>We received the following details:</p>",
        `<ul>${summaryLines
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>`,
        `<p>${escapeHtml(confirmation.outro)}</p>`,
        "<p>Reply to this email if you need to add anything else.</p>",
      ].join("");

      await sendTransactionalEmail({
        to: [{ email, name: fieldMap.name || undefined }],
        subject: confirmation.subject,
        text: confirmationText,
        html: confirmationHtml,
        replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
      });
    }

    return NextResponse.json({ ok: true, delivery: "email" });
  } catch (error) {
    console.error("[forms-notify]", error);
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
