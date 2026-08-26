import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { validateWhatsAppSettingsInput } from "@/lib/whatsapp/settings";
import { saveWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

/** Same gate as every other WhatsApp admin mutation: session cookie, then origin. */
async function guard(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}

export async function PUT(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  // Validation happens here rather than in the database: the settings document is
  // a single jsonb column, so TypeScript owns its shape and its error messages.
  const validation = validateWhatsAppSettingsInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = await saveWhatsAppSettings(validation.value);
  if (!result.ok) {
    // `saveWhatsAppSettings` has already logged the provider detail; only its own
    // operator-facing message is returned.
    return NextResponse.json(
      { error: result.message },
      { status: result.reason === "missing-table" ? 503 : result.reason === "unconfigured" ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, settings: result.settings });
}
