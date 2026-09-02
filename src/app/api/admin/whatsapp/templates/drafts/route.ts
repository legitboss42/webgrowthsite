import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, POSTGRES_UNIQUE_VIOLATION, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import {
  normalizeWhatsAppTemplateDraftRow,
  validateWhatsAppTemplateDraftInput,
  type WhatsAppTemplateDraft,
  type WhatsAppTemplateDraftInput,
} from "@/lib/whatsapp/templateModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";
const TABLE = "whatsapp_template_drafts";
const SELECT = "id,name,language,category,header_text,body_text,footer_text,buttons,variable_examples,meta_template_id,submitted_at,created_by_member_id,updated_by_member_id,created_at,updated_at";

async function guard(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return { response: NextResponse.json({ error: "Only an Owner or Manager can manage template drafts." }, { status: 403 }) } as const;
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

async function readBody(request: Request) {
  try { return (await request.json()) as Record<string, unknown>; } catch { return null; }
}

async function getDraft(id: string): Promise<WhatsAppTemplateDraft | null | undefined> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=${SELECT}&limit=1`);
  if (rows === null) return undefined;
  return rows[0] ? normalizeWhatsAppTemplateDraftRow(rows[0]) : null;
}

function dbBody(value: WhatsAppTemplateDraftInput, memberId: string | null) {
  return {
    name: value.name,
    language: value.language,
    category: value.category,
    header_text: value.headerText || null,
    body_text: value.bodyText,
    footer_text: value.footerText || null,
    buttons: value.buttons,
    variable_examples: value.variableExamples,
    updated_by_member_id: memberId,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const checked = validateWhatsAppTemplateDraftInput(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: TABLE,
    body: { ...dbBody(checked.value, guarded.access.memberId), created_by_member_id: guarded.access.memberId },
  });
  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json({ error: duplicate ? "A draft with that name and language already exists." : result.message }, { status: duplicate ? 409 : result.status });
  }
  return NextResponse.json({ ok: true, draft: result.rows[0] ? normalizeWhatsAppTemplateDraftRow(result.rows[0]) : null });
}

export async function PATCH(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const existing = await getDraft(id);
  if (existing === undefined) return NextResponse.json({ error: "Stage 5 template drafts are waiting for the Supabase migration." }, { status: 503 });
  if (!existing) return NextResponse.json({ error: "That draft no longer exists." }, { status: 404 });
  if (existing.metaTemplateId) return NextResponse.json({ error: "Submitted drafts are locked. Duplicate it to make a new version." }, { status: 409 });
  const checked = validateWhatsAppTemplateDraftInput(body || {});
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`, body: dbBody(checked.value, guarded.access.memberId) });
  if (!result.ok) {
    const duplicate = result.code === POSTGRES_UNIQUE_VIOLATION;
    return NextResponse.json({ error: duplicate ? "A draft with that name and language already exists." : result.message }, { status: duplicate ? 409 : result.status });
  }
  return NextResponse.json({ ok: true, draft: result.rows[0] ? normalizeWhatsAppTemplateDraftRow(result.rows[0]) : null });
}

export async function DELETE(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  const body = await readBody(request);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const existing = await getDraft(id);
  if (existing === undefined) return NextResponse.json({ error: "Stage 5 template drafts are waiting for the Supabase migration." }, { status: 503 });
  if (!existing) return NextResponse.json({ error: "That draft no longer exists." }, { status: 404 });
  if (existing.metaTemplateId) return NextResponse.json({ error: "Submitted draft records are retained so Meta submissions stay traceable." }, { status: 409 });
  const result = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}` });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  return NextResponse.json({ ok: true });
}
