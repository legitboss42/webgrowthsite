import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { normalizeWhatsAppFlowRow } from "@/lib/whatsapp/flowModel";
import { startWhatsAppFlowSubmission } from "@/lib/whatsapp/flowRuntime";
import { sendWhatsAppFlowMessage } from "@/lib/whatsapp/flows";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";
function text(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canWhatsAppRoleSuperviseTeam(access.role)) return NextResponse.json({ error: "Owner or Manager access is required for Flow test sends." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const id = text(body.id, 100); const waId = text(body.waId, 100);
  if (!id || !waId) return NextResponse.json({ error: "Choose a published Flow and test WhatsApp number." }, { status: 400 });
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?id=eq.${encodeURIComponent(id)}&status=eq.PUBLISHED&select=*&limit=1`);
  const flow = rows?.[0] ? normalizeWhatsAppFlowRow(rows[0]) : null;
  if (!flow?.metaFlowId) return NextResponse.json({ error: "This Flow is not published with Meta." }, { status: 409 });
  const flowToken = randomUUID();
  const sent = await sendWhatsAppFlowMessage({ to: waId, flowId: flow.metaFlowId, flowToken, cta: "Open test", body: `Web Growth Flow test: ${flow.name}` });
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });
  const tracked = await startWhatsAppFlowSubmission({ flowId: flow.id, flowToken, waId, messageId: sent.messageId, source: "TEST_SEND" });
  return NextResponse.json({ ok: true, messageId: sent.messageId, submissionId: tracked.ok ? tracked.submissionId : null, warning: tracked.ok ? null : tracked.error });
}
