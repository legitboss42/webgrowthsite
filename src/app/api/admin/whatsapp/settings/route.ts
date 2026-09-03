import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { validateWhatsAppSettingsInput } from "@/lib/whatsapp/settings";
import { saveWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

async function guard(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (access.role !== "owner") return { response: NextResponse.json({ error: "Workspace Owner access required." }, { status: 403 }) } as const;
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

export async function PUT(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }

  const validation = validateWhatsAppSettingsInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const result = await saveWhatsAppSettings(validation.value, { workspaceId: guarded.access.workspaceId });
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.reason === "missing-table" || result.reason === "unconfigured" ? 503 : 502 });
  }
  return NextResponse.json({ ok: true, settings: result.settings });
}
