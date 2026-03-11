import { NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@webgrowth.info";

type NotifyBody = {
  formType?: string;
  subject?: string;
  fields?: Record<string, unknown>;
};

function toSafeString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyBody;

    const formType = toSafeString(body.formType) || "website_form";
    const subject =
      toSafeString(body.subject) ||
      `New Website Form Submission - ${formType}`;
    const fields = body.fields && typeof body.fields === "object" ? body.fields : {};

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
      ...Object.entries(fields).map(
        ([key, value]) => `${key}: ${toSafeString(value)}`
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
        { error: "Email provider rejected the request." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}

