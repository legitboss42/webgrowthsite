import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasWhatsAppAdminAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  fetchWhatsAppCallingSettings,
  updateWhatsAppCallingSettings,
  type WhatsAppCallingSettings,
} from "@/lib/whatsapp/callingSettings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";

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

function isBrokenCallHoursSchema(result: { reason: string; detail?: string }) {
  const detail = (result.detail || "").toLowerCase();
  return result.reason === "API_ERROR" && detail.includes("calling.call_hours") && detail.includes("meta code 100");
}

function metaTime(value: string | undefined, fallback: string) {
  const compact = (value || "").replace(":", "").trim();
  return /^\d{4}$/.test(compact) ? compact : fallback;
}

async function repairMalformedCallHours(): Promise<{ ok: true } | { ok: false; detail: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  if (!token || !phoneNumberId) {
    return { ok: false, detail: "WhatsApp Calling credentials are not configured." };
  }

  const { settings } = await loadWhatsAppSettings({ maxAgeMs: 0 });
  const hours = settings.businessHours;
  const days = hours.days.length ? hours.days : [1, 2, 3, 4, 5];
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  const callHours = {
    status: hours.enabled ? "ENABLED" : "DISABLED",
    timezone_id: hours.timezone || "Africa/Lagos",
    weekly_operating_hours: days.map((day) => ({
      day_of_week: dayNames[day] || "MONDAY",
      open_time: metaTime(hours.start, "0800"),
      close_time: metaTime(hours.end, "1700"),
    })),
    // Meta's call_hours schema can reject a partially stored object. Supplying the
    // complete collection explicitly repairs the object and also clears stale holidays.
    holiday_schedule: [],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/settings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          calling: { call_hours: callHours },
        }),
        cache: "no-store",
      },
    );

    if (response.ok) return { ok: true };
    const text = await response.text().catch(() => "");
    return {
      ok: false,
      detail: text.slice(0, 300) || `Meta returned HTTP ${response.status} while repairing call hours.`,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Call-hours repair request failed.",
    };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  if (!hasWhatsAppAdminAccess(cookieStore)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let result = await fetchWhatsAppCallingSettings();

  // Earlier builds could write an incomplete call_hours object. Meta then rejects
  // subsequent reads with code 100 before the console can display the live settings.
  // Repair only that exact known-bad state, then retry the authoritative Meta read.
  if (!result.ok && isBrokenCallHoursSchema(result)) {
    const repaired = await repairMalformedCallHours();
    if (repaired.ok) {
      result = await fetchWhatsAppCallingSettings();
    } else {
      return failureResponse({
        ...result,
        detail: `${result.detail || "Meta rejected the stored call-hours configuration."} Repair attempt: ${repaired.detail}`.slice(0, 600),
      });
    }
  }

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
