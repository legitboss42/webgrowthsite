import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canWhatsAppAccessConversation, getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { getWhatsAppSupabaseConfig, mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { recordWhatsAppConversationActivity } from "@/app/admin/whatsapp/teamActivity";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { normalizeWhatsAppFlowRow } from "@/lib/whatsapp/flowModel";
import { startWhatsAppFlowSubmission } from "@/lib/whatsapp/flowRuntime";
import { sendWhatsAppFlowMessage } from "@/lib/whatsapp/flows";
import { createSupabaseWhatsAppStore } from "@/lib/whatsapp/store";

export const runtime = "nodejs";
function text(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function GET() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flows?status=eq.PUBLISHED&select=*&order=name.asc&limit=200");
  return NextResponse.json({ flows: (rows || []).map(normalizeWhatsAppFlowRow).map((flow) => ({ id: flow.id, metaFlowId: flow.metaFlowId, name: flow.name, categories: flow.categories, dynamic: flow.builder.dynamic })) });
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  let body: Record<string, unknown>; try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const conversationId = text(body.conversationId, 100); const flowId = text(body.flowId, 100);
  if (!conversationId || !flowId) return NextResponse.json({ error: "Choose a conversation and a published Flow." }, { status: 400 });
  if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) return NextResponse.json({ error: "This conversation is not assigned to you." }, { status: 403 });

  const [flowRows, conversationRows] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?id=eq.${encodeURIComponent(flowId)}&status=eq.PUBLISHED&select=*&limit=1`),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,contact_id&limit=1`),
  ]);
  const flow = flowRows?.[0] ? normalizeWhatsAppFlowRow(flowRows[0]) : null; const conversation = conversationRows?.[0];
  if (!flow?.metaFlowId) return NextResponse.json({ error: "That published Flow is not linked to Meta." }, { status: 409 });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const contactRows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?id=eq.${encodeURIComponent(String(conversation.contact_id || ""))}&select=id,wa_id&limit=1`);
  const contact = contactRows?.[0]; const waId = text(contact?.wa_id, 100);
  if (!waId) return NextResponse.json({ error: "This conversation has no valid WhatsApp recipient." }, { status: 409 });

  const flowToken = randomUUID();
  const sent = await sendWhatsAppFlowMessage({ to: waId, flowId: flow.metaFlowId, flowToken, cta: text(body.cta, 30) || "Open form", body: text(body.message, 1024) || `Please complete ${flow.name}.`, screen: text(body.screen, 80) || undefined });
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });

  const started = await startWhatsAppFlowSubmission({ flowId: flow.id, flowToken, contactId: text(contact?.id, 100), conversationId, waId, messageId: sent.messageId, source: "CONVERSATION" });
  if (!started.ok) {
    console.error("Flow sent but submission tracking failed", sent.messageId, started.error);
    return NextResponse.json({ ok: true, messageId: sent.messageId, warning: "Flow was sent, but its local submission record could not be created." });
  }

  const config = getWhatsAppSupabaseConfig();
  if (config) {
    try { await createSupabaseWhatsAppStore({ url: config.url, serviceRoleKey: config.key }).recordOutbound({ messageId: sent.messageId, waId, conversationId, text: `[Flow: ${flow.name}]`, type: "interactive", timestamp: Math.floor(Date.now() / 1000) }); }
    catch (error) { console.error("Flow outbound history write failed", error); }
  }
  await recordWhatsAppConversationActivity({ conversationId, actorMemberId: access.memberId, actorEmail: access.email, eventType: "flow_sent", metadata: { flowId: flow.id, metaFlowId: flow.metaFlowId, flowName: flow.name, submissionId: started.submissionId, messageId: sent.messageId } });
  await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, body: { last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return NextResponse.json({ ok: true, messageId: sent.messageId, submissionId: started.submissionId, flowToken });
}
