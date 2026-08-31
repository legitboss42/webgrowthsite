import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  loadWhatsAppQuickSettings,
  saveWhatsAppQuickSettings,
  type WhatsAppQuickSettings,
} from "@/lib/whatsapp/quickSettings";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, settings: await loadWhatsAppQuickSettings() });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Partial<WhatsAppQuickSettings>;
  try {
    body = (await request.json()) as Partial<WhatsAppQuickSettings>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const current = await loadWhatsAppQuickSettings();
  const next: WhatsAppQuickSettings = {
    typingIndicatorEnabled:
      typeof body.typingIndicatorEnabled === "boolean"
        ? body.typingIndicatorEnabled
        : current.typingIndicatorEnabled,
    newMessageAlertsEnabled:
      typeof body.newMessageAlertsEnabled === "boolean"
        ? body.newMessageAlertsEnabled
        : current.newMessageAlertsEnabled,
    serviceWindowWarningEnabled:
      typeof body.serviceWindowWarningEnabled === "boolean"
        ? body.serviceWindowWarningEnabled
        : current.serviceWindowWarningEnabled,
    deliveryStatusVisible:
      typeof body.deliveryStatusVisible === "boolean"
        ? body.deliveryStatusVisible
        : current.deliveryStatusVisible,
    readStatusVisible:
      typeof body.readStatusVisible === "boolean"
        ? body.readStatusVisible
        : current.readStatusVisible,
  };

  const result = await saveWhatsAppQuickSettings(next);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, settings: result.settings });
}
