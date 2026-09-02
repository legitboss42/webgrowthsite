import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import {
  fetchWhatsAppTemplates,
  getWhatsAppTemplateComponent,
  listWhatsAppTemplateVariables,
  sendWhatsAppTemplateMessage,
} from "@/lib/whatsapp/templates";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean) : [];
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return NextResponse.json({ error: "Only an Owner or Manager can send template tests from this manager." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }
  const templateId = typeof body.templateId === "string" ? body.templateId.trim() : "";
  const recipient = typeof body.recipient === "string" ? body.recipient.trim() : "";
  const headerParameters = stringArray(body.headerParameters);
  const bodyParameters = stringArray(body.bodyParameters);
  if (!templateId || !recipient) return NextResponse.json({ error: "Choose a template and enter a test recipient." }, { status: 400 });

  const live = await fetchWhatsAppTemplates();
  if (!live.ok) {
    const status = live.reason === "NOT_CONFIGURED" ? 503 : live.reason === "PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: "Could not verify this template with Meta before sending." }, { status });
  }
  const template = live.templates.find((item) => item.id === templateId);
  if (!template) return NextResponse.json({ error: "That template is no longer present in the connected WABA." }, { status: 404 });
  if (template.status !== "APPROVED") return NextResponse.json({ error: "Only APPROVED templates can be sent." }, { status: 409 });

  const headerVariables = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(template, "HEADER")?.text);
  const bodyVariables = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(template, "BODY")?.text);
  if (headerParameters.length !== headerVariables.length) {
    return NextResponse.json({ error: `This template needs ${headerVariables.length} header value${headerVariables.length === 1 ? "" : "s"}.` }, { status: 400 });
  }
  if (bodyParameters.length !== bodyVariables.length) {
    return NextResponse.json({ error: `This template needs ${bodyVariables.length} body value${bodyVariables.length === 1 ? "" : "s"}.` }, { status: 400 });
  }

  const sent = await sendWhatsAppTemplateMessage({
    to: recipient,
    name: template.name,
    language: template.language || "en_US",
    headerParameters,
    bodyParameters,
  });
  if (!sent.ok) {
    const status = sent.reason === "INVALID_RECIPIENT" ? 400 : sent.reason === "NOT_CONFIGURED" ? 503 : sent.reason === "PERMISSION_DENIED" ? 403 : 502;
    return NextResponse.json({ error: sent.error || "Meta could not send this template test." }, { status });
  }
  return NextResponse.json({ ok: true, messageId: sent.messageId });
}
