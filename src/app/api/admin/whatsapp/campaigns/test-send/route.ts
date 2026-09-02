import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { normalizeWhatsAppCampaignContact } from "@/lib/whatsapp/campaignModel";
import { resolveWhatsAppCampaignVariables } from "@/lib/whatsapp/campaignRuntime";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { fetchWhatsAppTemplates, sendWhatsAppTemplateMessage } from "@/lib/whatsapp/templates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }

  const recipient = typeof body.recipient === "string" ? body.recipient.trim() : "";
  const templateId = typeof body.templateId === "string" ? body.templateId.trim() : "";
  const contactId = typeof body.sampleContactId === "string" ? body.sampleContactId.trim() : "";
  const mappings = body.variableMappings && typeof body.variableMappings === "object" && !Array.isArray(body.variableMappings)
    ? Object.fromEntries(Object.entries(body.variableMappings as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : {};
  if (!recipient || !templateId) return NextResponse.json({ error: "Test recipient and approved template are required." }, { status: 400 });

  const templates = await fetchWhatsAppTemplates();
  if (!templates.ok) return NextResponse.json({ error: "Meta template status could not be verified." }, { status: 502 });
  const template = templates.templates.find((item) => item.id === templateId && item.status === "APPROVED");
  if (!template) return NextResponse.json({ error: "Choose an approved Meta template." }, { status: 400 });

  const contactRows = contactId
    ? await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}&select=id,wa_id,phone,display_name,business_name,email,source,lead_stage,lead_temperature,tags,custom_fields,opt_in_status,opt_in_at,opt_out_at&limit=1`)
    : [];
  const contact = contactRows?.[0]
    ? normalizeWhatsAppCampaignContact(contactRows[0])
    : normalizeWhatsAppCampaignContact({ id: "test", wa_id: recipient, phone: recipient, display_name: "Test Contact", opt_in_status: "OPTED_IN", tags: [], custom_fields: {} });
  const values = resolveWhatsAppCampaignVariables(mappings, contact);
  if ([...values.headerParameters, ...values.bodyParameters].some((item) => !item.trim())) {
    return NextResponse.json({ error: "A mapped variable is empty for the selected test contact. Use a static test value or another contact." }, { status: 400 });
  }
  const sent = await sendWhatsAppTemplateMessage({
    to: recipient,
    name: template.name,
    language: template.language || "en_US",
    headerParameters: values.headerParameters,
    bodyParameters: values.bodyParameters,
  });
  if (!sent.ok) return NextResponse.json({ error: sent.error || `Meta test send failed: ${sent.reason}` }, { status: 502 });
  return NextResponse.json({ ok: true, messageId: sent.messageId });
}
