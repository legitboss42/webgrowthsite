import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { normalizeWhatsAppSegmentRow, validateWhatsAppSegmentInput } from "@/lib/whatsapp/campaignModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

async function guard(request: Request, mutation = true) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return { response: NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 }) } as const;
  if (mutation && !isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

async function body(request: Request) {
  try { return (await request.json()) as Record<string, unknown>; }
  catch { return null; }
}

export async function GET(request: Request) {
  const guarded = await guard(request, false);
  if ("response" in guarded) return guarded.response;
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_segments?select=id,name,description,condition_join,conditions,created_at,updated_at&order=updated_at.desc&limit=500",
  );
  return NextResponse.json({ segments: rows?.map(normalizeWhatsAppSegmentRow) || [] });
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const raw = await body(request);
  if (!raw) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const checked = validateWhatsAppSegmentInput(raw);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_segments",
    body: {
      id: randomUUID(),
      name: checked.value.name,
      description: checked.value.description,
      condition_join: checked.value.conditionJoin,
      conditions: checked.value.conditions,
      created_by_member_id: guarded.access.memberId || null,
      updated_by_member_id: guarded.access.memberId || null,
    },
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ ok: true, segment: result.rows[0] ? normalizeWhatsAppSegmentRow(result.rows[0]) : null }, { status: 201 });
}

export async function DELETE(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const raw = await body(request);
  const id = typeof raw?.id === "string" ? raw.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Audience ID is required." }, { status: 400 });
  const inUse = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaigns?segment_id=eq.${encodeURIComponent(id)}&status=in.(DRAFT,SCHEDULED,RUNNING,PAUSED)&select=id&limit=1`,
  );
  if (inUse?.length) return NextResponse.json({ error: "This audience is used by an unfinished campaign." }, { status: 409 });
  const result = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_segments?id=eq.${encodeURIComponent(id)}` });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ ok: true });
}
