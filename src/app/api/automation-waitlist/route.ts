import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_EMAIL, sendTransactionalEmail } from "@/lib/email";
import { readGoogleAuthSessionFromCookieStore } from "@/lib/googleAuth";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  hasJsonContentType,
  isAllowedOrigin,
  isLikelyAutomationRequest,
  sanitizeText,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { validateWaitlistSubmission } from "@/lib/waitlist/schema";
import {
  isWaitlistStorageConfigured,
  recordConfirmationEmailResult,
  saveWaitlistSignup,
} from "@/lib/waitlist/store";
import { buildWaitlistConfirmationEmail } from "@/emails/automation-waitlist-confirmation";

export const runtime = "nodejs";

/**
 * Waitlist intake for the /automation landing page.
 *
 * Deliberately NOT gated on LOW_CPU_EMERGENCY_MODE: that flag is currently true
 * and would 503 every signup, which would make the launch funnel collect
 * nothing. This route is a single cheap insert plus one outbound email, so it is
 * an approved exemption. src/lib/emergency.ts and its other consumers are
 * unchanged.
 *
 * Order matters: the signup is persisted BEFORE the confirmation email is
 * attempted, so a provider outage can never lose a lead. The response reports
 * the real email outcome so the UI cannot claim a confirmation was sent when it
 * was not.
 */

const GENERIC_ERROR = "We couldn't submit your request right now. Please try again.";

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
    const rate = checkRateLimit(`automation-waitlist:${ip}:${ua}`, 5);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const cookieStore = await cookies();
    const googleSession = readGoogleAuthSessionFromCookieStore(cookieStore);
    if (!googleSession?.email) {
      return NextResponse.json(
        { error: "Please sign in with Google before joining the waitlist." },
        { status: 401 }
      );
    }

    // Honeypot. The field is visually hidden and unlabelled for assistive tech,
    // so only a script fills it. Respond as if accepted rather than revealing
    // the trap, but persist nothing and send nothing.
    const honeypot = sanitizeText(body?.companyWebsite, 200);
    if (honeypot) {
      console.warn("[automation-waitlist] honeypot triggered");
      return NextResponse.json({ ok: true, emailSent: false }, { status: 200 });
    }

    const validation = validateWaitlistSubmission({
      ...body,
      email: googleSession.email,
      fullName: sanitizeText(body.fullName, 120) || googleSession.fullName || googleSession.email,
    });
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Please check the highlighted fields.", fieldErrors: validation.errors },
        { status: 400 }
      );
    }

    const turnstileToken = sanitizeText(body?.turnstileToken, 2048);
    const turnstile = await verifyTurnstileToken({
      token: turnstileToken,
      ip,
      expectedAction: "automation_waitlist",
    });

    if (!turnstile.ok) {
      return NextResponse.json({ error: turnstile.error }, { status: 400 });
    }

    if (!isWaitlistStorageConfigured()) {
      console.error("[automation-waitlist] storage is not configured");
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 503 });
    }

    const submission = validation.value;

    // 1. Persist first. If this throws the visitor sees a retryable error.
    let record: { id: string };
    try {
      record = await saveWaitlistSignup(submission);
    } catch (error) {
      console.error("[automation-waitlist] save failed", error);
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    }

    // 2. Attempt the confirmation email. From here on the signup is safe, so no
    //    failure below may turn into an error response.
    let emailSent = false;

    try {
      const confirmation = buildWaitlistConfirmationEmail({
        fullName: submission.fullName,
        interest: submission.interest,
      });

      const result = await sendTransactionalEmail({
        to: [{ email: submission.email, name: submission.fullName }],
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
        replyTo: { email: ADMIN_EMAIL, name: "Web Growth" },
      });

      emailSent = result.ok === true;

      if (!emailSent) {
        // Provider credentials are absent: a configuration gap, not a failure.
        console.error("[automation-waitlist] email not configured", { reason: result.reason });
      }
    } catch (error) {
      // Provider rejected the send. Log for retry; never surface provider text.
      console.error("[automation-waitlist] email send failed", error);
      emailSent = false;
    }

    // 3. Record the real outcome so failures can be retried later.
    const recorded = await recordConfirmationEmailResult(record.id, emailSent ? "sent" : "failed");
    if (!recorded) {
      console.error("[automation-waitlist] could not record email status", { id: record.id });
    }

    return NextResponse.json({ ok: true, emailSent }, { status: 200 });
  } catch (error) {
    console.error("[automation-waitlist] unexpected error", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
