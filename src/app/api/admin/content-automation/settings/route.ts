import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { parseSocialAutomationSettingsPatch } from "@/lib/socialAutomation/adminModel";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const settings = await createSocialAutomationStore().getSettings();
    return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[social-automation] settings read failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ ok: false, code: "SETTINGS_READ_FAILED" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ ok: false, code: "INVALID_ORIGIN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const patch = parseSocialAutomationSettingsPatch(body);
  if (!patch) {
    return NextResponse.json({ ok: false, code: "INVALID_SETTINGS" }, { status: 400 });
  }

  try {
    const store = createSocialAutomationStore();
    await store.updateSettings(patch);
    await store.audit({
      eventType: "SETTINGS_UPDATED",
      actor: "ADMIN",
      metadata: { fields: Object.keys(patch) },
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[social-automation] settings update failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ ok: false, code: "SETTINGS_UPDATE_FAILED" }, { status: 503 });
  }
}
