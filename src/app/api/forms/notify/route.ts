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
  sanitizeText,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

const ADMIN_EMAIL = "admin@webgrowth.info";
export const runtime = "nodejs";

type NotifyBody = {
  formType?: string;
  subject?: string;
  fields?: Record<string, unknown>;
  turnstileToken?: string;
};

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
    const isProduction = process.env.NODE_ENV === "production";
    const hasTurnstileSecret = Boolean(process.env.TURNSTILE_SECRET_KEY);
    const shouldRequireTurnstile = isProduction || hasTurnstileSecret;

    if (shouldRequireTurnstile && !turnstileToken) {
      return NextResponse.json(
        { error: "Please complete the spam check." },
        { status: 400 }
      );
    }

    if (turnstileToken) {
      const turnstile = await verifyTurnstileToken({
        token: turnstileToken,
        ip,
        expectedAction: formType,
      });

      if (!turnstile.ok) {
        return NextResponse.json({ error: turnstile.error }, { status: 400 });
      }
    }

    const token = process.env.MAILERSEND_API_TOKEN;
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL;
    const fromName = process.env.MAILERSEND_FROM_NAME || "Web Growth";

    if (!token || !fromEmail) {
      return NextResponse.json(
        { error: "Email delivery is temporarily unavailable." },
        { status: 500 }
      );
    }

    const lines = [
      `Form type: ${formType}`,
      `Submitted at: ${new Date().toISOString()}`,
      "",
      ...normalizedEntries.map(
        ([key, value]) => `${sanitizeText(key, 80)}: ${sanitizeText(value, 1200)}`
      ),
    ];

    const textBody = lines.join("\n");
    const htmlBody = lines
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");

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
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!msRes.ok) {
      return NextResponse.json(
        { error: "Could not send your request right now." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
