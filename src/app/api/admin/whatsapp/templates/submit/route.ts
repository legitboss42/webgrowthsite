import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { normalizeWhatsAppTemplateDraftRow, validateWhatsAppTemplateDraftInput } from "@/lib/whatsapp/templateModel";
import { createWhatsAppTemplate } from "@/lib/whatsapp/templates";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";
const TABLE = "whatsapp_template_drafts";
const SELECT = "id,name,language,category,header_text,body_text,footer_text,buttons,variable_examples,meta_template_id,submitted_at,created_by_member_id,updated_by_member_id,created_at,updated_at";

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return NextResponse.json({ error: "Only an Owner or Manager can submit templates to Meta." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const rows = await readWhatsAppRows<Record<string, unknown>>(`${TABLE}?id=eq.${encodeURIComponent(id)}&select=${SELECT}&limit=1`);
  if (rows === null) return NextResponse.json({ error: "Stage 5 template drafts are waiting for the Supabase migration." }, { status: 503 });
  if (!rows[0]) return NextResponse.json({ error: "That draft no longer exists." }, { status: 404 });
  const draft = normalizeWhatsAppTemplateDraftRow(rows[0]);
  if (draft.metaTemplateId) return NextResponse.json({ error: "This draft has already been submitted to Meta." }, { status: 409 });

  const checked = validateWhatsAppTemplateDraftInput({
    name: draft.name,
    language: draft.language,
    category: draft.category,
    headerText: draft.headerText,
    bodyText: draft.bodyText,
    footerText: draft.footerText,
    buttons: draft.buttons,
    variableExamples: draft.variableExamples,
  });
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const meta = await createWhatsAppTemplate(checked.value);
  if (!meta.ok) {
    const status = meta.reason === "NOT_CONFIGURED" ? 503 : meta.reason === "PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: meta.error || "Meta could not accept this template for review." }, { status });
  }

  const submittedAt = new Date().toISOString();
  const saved = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `${TABLE}?id=eq.${encodeURIComponent(id)}`,
    body: {
      meta_template_id: meta.id,
      submitted_at: submittedAt,
      updated_by_member_id: access.memberId,
      updated_at: submittedAt,
    },
  });
  if (!saved.ok) {
    console.error("Meta accepted template but local Stage 5 draft could not be marked submitted", { id, metaTemplateId: meta.id });
    return NextResponse.json({
      ok: true,
      warning: "Meta accepted the template, but the local draft could not be marked submitted. Refresh before retrying anything.",
      metaTemplateId: meta.id,
      status: meta.status || "PENDING",
    });
  }

  return NextResponse.json({ ok: true, metaTemplateId: meta.id, status: meta.status || "PENDING", category: meta.category });
}
