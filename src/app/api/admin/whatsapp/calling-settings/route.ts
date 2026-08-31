import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  fetchWhatsAppCallingSettings,
  updateWhatsAppCallingSettings,
  type WhatsAppCallingSettings,
} from "@/lib/whatsapp/callingSettings";

export const runtime = "nodejs";

function failureResponse(result: { reason: string; detail?: string }) {
  const status = result.reason === "NOT_CONFIGURED" ? 503 : result.reason === "PERMISSION_DENIED" ? 403 : 502;
  const error =
    result.reason === "NOT_CONFIGURED"
      ? "WhatsApp calling is not configured on this deployment."
      : result.reason === "PERMISSION_DENIED"
        ? "Meta rejected access to Calling settings. whatsapp_business_management access is required."
        : "Meta could not return WhatsApp Calling settings.";
  return NextResponse.json({ error, detail: result.detail }, { status });
}

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const result = await fetchWhatsAppCallingSettings();
  if (!result.ok) return failureResponse(result);
  return NextResponse.json({ ok: true, calling: result.settings });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid calling settings." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const update: Partial<WhatsAppCallingSettings> = {};

  if (raw.status !== undefined) {
    if (raw.status !== "ENABLED" && raw.status !== "DISABLED") {
      return NextResponse.json({ error: "Invalid calling status." }, { status: 400 });
    }
    update.status = raw.status;
  }

  if (raw.call_icon_visibility !== undefined) {
    if (raw.call_icon_visibility !== "DEFAULT" && raw.call_icon_visibility !== "DISABLE_ALL") {
      return NextResponse.json({ error: "Invalid call icon setting." }, { status: 400 });
    }
    update.call_icon_visibility = raw.call_icon_visibility;
  }

  if (raw.callback_permission_status !== undefined) {
    if (raw.callback_permission_status !== "ENABLED" && raw.callback_permission_status !== "DISABLED") {
      return NextResponse.json({ error: "Invalid callback permission setting." }, { status: 400 });
    }
    update.callback_permission_status = raw.callback_permission_status;
  }

  if (raw.call_hours !== undefined) {
    if (!raw.call_hours || typeof raw.call_hours !== "object") {
      return NextResponse.json({ error: "Invalid call hours." }, { status: 400 });
    }
    update.call_hours = raw.call_hours as WhatsAppCallingSettings["call_hours"];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No calling setting supplied." }, { status: 400 });
  }

  const result = await updateWhatsAppCallingSettings(update);
  if (!result.ok) return failureResponse(result);
  return NextResponse.json({ ok: true, calling: result.settings });
}
