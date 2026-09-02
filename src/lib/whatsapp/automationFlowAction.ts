import { randomUUID } from "node:crypto";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { normalizeWhatsAppFlowRow } from "./flowModel";
import { sendWhatsAppFlowMessage } from "./flows";

export async function sendTrackedWhatsAppFlowFromAutomation(input: { flowId: string; waId: string; contactId?: string; conversationId?: string; cta?: string }) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?id=eq.${encodeURIComponent(input.flowId)}&status=eq.PUBLISHED&select=*&limit=1`);
  const flow = rows?.[0] ? normalizeWhatsAppFlowRow(rows[0]) : null;
  if (!flow?.metaFlowId) return { ok: false as const, error: "The selected WhatsApp Flow is not published or linked to Meta." };
  const flowToken = randomUUID();
  const sent = await sendWhatsAppFlowMessage({ to: input.waId, flowId: flow.metaFlowId, flowToken, cta: input.cta || "Open form", body: `Please complete ${flow.name}.` });
  if (!sent.ok) return { ok: false as const, error: sent.error };
  const submissionId = randomUUID();
  const saved = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_submissions", body: {
    id: submissionId, flow_id: flow.id, meta_flow_id: flow.metaFlowId, contact_id: input.contactId || null,
    conversation_id: input.conversationId || null, flow_token: flowToken, message_id: sent.messageId, status: "STARTED",
    response_json: {}, mapped_fields: {}, source: "AUTOMATION", started_at: new Date().toISOString(),
  } });
  if (!saved.ok) return { ok: false as const, error: `Flow was sent but tracking failed: ${saved.message}` };
  await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_events", body: { flow_id: flow.id, submission_id: submissionId, contact_id: input.contactId || null, conversation_id: input.conversationId || null, event_type: "STARTED", metadata: { source: "AUTOMATION", messageId: sent.messageId } } });
  return { ok: true as const, flow, flowToken, submissionId, messageId: sent.messageId };
}
