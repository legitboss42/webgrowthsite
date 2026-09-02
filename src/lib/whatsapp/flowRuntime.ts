import { randomUUID } from "node:crypto";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { dispatchWhatsAppAutomationEvent } from "./automationRuntime";
import { normalizeWhatsAppFlowRow, type WhatsAppFlow, type WhatsAppFlowCrmMapping } from "./flowModel";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function scalar(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => scalar(item)).filter(Boolean).join(", ");
  return "";
}

async function flowById(id: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows?.[0] ? normalizeWhatsAppFlowRow(rows[0]) : null;
}
async function flowByMetaId(metaFlowId: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flows?meta_flow_id=eq.${encodeURIComponent(metaFlowId)}&select=*&limit=1`);
  return rows?.[0] ? normalizeWhatsAppFlowRow(rows[0]) : null;
}
async function contactAndConversation(waId?: string, contactId?: string, conversationId?: string) {
  let contact: Record<string, unknown> | undefined;
  let conversation: Record<string, unknown> | undefined;
  if (conversationId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,contact_id&limit=1`);
    conversation = rows?.[0];
  }
  const wantedContact = contactId || text(conversation?.contact_id);
  if (wantedContact) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?id=eq.${encodeURIComponent(wantedContact)}&select=id,wa_id,display_name,email,phone,business_name,source,lead_stage,lead_temperature,opt_in_status,custom_fields&limit=1`);
    contact = rows?.[0];
  } else if (waId) {
    const normalized = waId.replace(/^\+/, "");
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?wa_id=eq.${encodeURIComponent(normalized)}&select=id,wa_id,display_name,email,phone,business_name,source,lead_stage,lead_temperature,opt_in_status,custom_fields&limit=1`);
    contact = rows?.[0];
  }
  if (!conversation && contact?.id) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?contact_id=eq.${encodeURIComponent(String(contact.id))}&select=id,contact_id&order=last_message_at.desc&limit=1`);
    conversation = rows?.[0];
  }
  return { contact, conversation };
}

function buildContactPatch(mapping: WhatsAppFlowCrmMapping, response: Record<string, unknown>, currentCustom: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  const custom = { ...currentCustom };
  const mapped: Record<string, unknown> = {};
  const columns: Record<string, string> = {
    display_name: "display_name", email: "email", phone: "phone", company: "business_name", source: "source",
    lead_stage: "lead_stage", lead_temperature: "lead_temperature", opt_in_status: "opt_in_status",
  };
  for (const [answerKey, target] of Object.entries(mapping)) {
    const raw = response[answerKey]; if (raw === undefined || raw === null) continue;
    const value = scalar(raw); if (!value && raw !== false) continue;
    if (target.startsWith("custom.")) {
      const key = target.slice(7); if (!key) continue; custom[key] = value; mapped[target] = value;
    } else if (columns[target]) {
      patch[columns[target]] = value; mapped[target] = value;
    }
  }
  if (Object.keys(custom).length !== Object.keys(currentCustom).length || JSON.stringify(custom) !== JSON.stringify(currentCustom)) patch.custom_fields = custom;
  return { patch, mapped };
}

async function audit(eventType: string, input: { flow: WhatsAppFlow; contactId?: string; conversationId?: string; submissionId?: string; metadata?: Record<string, unknown> }) {
  await Promise.all([
    mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_events", body: { flow_id: input.flow.id, submission_id: input.submissionId || null, contact_id: input.contactId || null, conversation_id: input.conversationId || null, event_type: eventType, metadata: input.metadata || {} } }),
    mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_team_activity", body: { conversation_id: input.conversationId || null, actor_member_id: null, actor_email: "flows@webgrowth.info", target_member_id: null, event_type: `flow_${eventType.toLowerCase()}`, metadata: { flowId: input.flow.id, flowName: input.flow.name, submissionId: input.submissionId || null, ...(input.metadata || {}) } } }),
  ]);
}

export async function startWhatsAppFlowSubmission(input: { flowId: string; flowToken?: string; contactId?: string; conversationId?: string; waId?: string; messageId?: string; source?: string }) {
  const flow = await flowById(input.flowId); if (!flow) return { ok: false as const, error: "Flow not found." };
  const related = await contactAndConversation(input.waId, input.contactId, input.conversationId);
  const submissionId = randomUUID(); const flowToken = input.flowToken || randomUUID(); const now = new Date().toISOString();
  const created = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_submissions", body: {
    id: submissionId, flow_id: flow.id, meta_flow_id: flow.metaFlowId || null, contact_id: related.contact?.id || input.contactId || null,
    conversation_id: related.conversation?.id || input.conversationId || null, flow_token: flowToken, message_id: input.messageId || null,
    status: "STARTED", response_json: {}, mapped_fields: {}, source: input.source || "FLOW_SEND", started_at: now,
  } });
  if (!created.ok) return { ok: false as const, error: created.message };
  const contactId = text(related.contact?.id) || input.contactId; const conversationId = text(related.conversation?.id) || input.conversationId;
  await audit("STARTED", { flow, contactId, conversationId, submissionId, metadata: { source: input.source || "FLOW_SEND", messageId: input.messageId || null } });
  await dispatchWhatsAppAutomationEvent({
    type: "WHATSAPP_FLOW_STARTED", eventKey: `flow-started:${submissionId}`, contactId, conversationId, waId: input.waId,
    payload: { flow: { id: flow.id, metaId: flow.metaFlowId || null, name: flow.name, fields: {} }, submissionId, flowToken, source: input.source || "FLOW_SEND" },
  });
  return { ok: true as const, submissionId, flowToken, flow };
}

export async function completeWhatsAppFlowSubmission(input: { flowToken?: string; metaFlowId?: string; flowId?: string; waId?: string; messageId?: string; response: Record<string, unknown>; source?: string }) {
  let existing: Record<string, unknown> | undefined;
  if (input.flowToken) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flow_submissions?flow_token=eq.${encodeURIComponent(input.flowToken)}&select=*&order=created_at.desc&limit=1`);
    existing = rows?.[0];
  }
  const flowId = input.flowId || text(existing?.flow_id);
  const metaFlowId = input.metaFlowId || text(existing?.meta_flow_id);
  const flow = flowId ? await flowById(flowId) : metaFlowId ? await flowByMetaId(metaFlowId) : null;
  if (!flow) return { ok: false as const, error: "Completed Flow is not registered in Web Growth." };
  const related = await contactAndConversation(input.waId, text(existing?.contact_id), text(existing?.conversation_id));
  const contactId = text(related.contact?.id) || text(existing?.contact_id); const conversationId = text(related.conversation?.id) || text(existing?.conversation_id);
  const currentCustom = object(related.contact?.custom_fields); const mapped = buildContactPatch(flow.crmMapping, input.response, currentCustom);
  if (contactId && Object.keys(mapped.patch).length) {
    const saved = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}`, body: { ...mapped.patch, updated_at: new Date().toISOString() } });
    if (!saved.ok) return { ok: false as const, error: "The Flow finished, but CRM mapping could not be saved." };
  }
  const now = new Date().toISOString(); const submissionId = text(existing?.id) || randomUUID();
  const row = { flow_id: flow.id, meta_flow_id: flow.metaFlowId || input.metaFlowId || null, contact_id: contactId || null, conversation_id: conversationId || null, flow_token: input.flowToken || text(existing?.flow_token) || null, message_id: input.messageId || text(existing?.message_id) || null, status: "COMPLETED", response_json: input.response, mapped_fields: mapped.mapped, source: input.source || "FLOW_COMPLETION", completed_at: now };
  const stored = existing
    ? await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_flow_submissions?id=eq.${encodeURIComponent(submissionId)}`, body: row })
    : await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_flow_submissions", body: { id: submissionId, ...row, started_at: now } });
  if (!stored.ok) return { ok: false as const, error: stored.message };
  await audit("COMPLETED", { flow, contactId, conversationId, submissionId, metadata: { fields: Object.keys(input.response), mapped: mapped.mapped, source: input.source || "FLOW_COMPLETION" } });
  await dispatchWhatsAppAutomationEvent({
    type: "WHATSAPP_FLOW_COMPLETED", eventKey: `flow-completed:${submissionId}`, contactId, conversationId, waId: input.waId,
    payload: { flow: { id: flow.id, metaId: flow.metaFlowId || null, name: flow.name, fields: input.response }, submissionId, mappedFields: mapped.mapped, source: input.source || "FLOW_COMPLETION" },
  });
  return { ok: true as const, flow, submissionId, mappedFields: mapped.mapped };
}

export async function processWhatsAppStaticFlowWebhook(payload: unknown) {
  const root = object(payload); if (root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) return { completed: 0 };
  let completed = 0;
  for (const entry of root.entry) {
    const changes = Array.isArray(object(entry).changes) ? object(entry).changes as unknown[] : [];
    for (const change of changes) {
      const value = object(object(change).value); const messages = Array.isArray(value.messages) ? value.messages as unknown[] : [];
      for (const raw of messages) {
        const message = object(raw); if (message.type !== "interactive") continue;
        const interactive = object(message.interactive); if (interactive.type !== "nfm_reply") continue;
        const reply = object(interactive.nfm_reply); const rawJson = text(reply.response_json); if (!rawJson) continue;
        let response: Record<string, unknown>; try { response = object(JSON.parse(rawJson)); } catch { continue; }
        const flowToken = text(response.flow_token) || text(reply.flow_token); delete response.flow_token;
        const result = await completeWhatsAppFlowSubmission({ flowToken, waId: text(message.from), messageId: text(message.id), response, source: "NFM_REPLY" });
        if (result.ok) completed += 1;
      }
    }
  }
  return { completed };
}

export async function loadFlowForToken(flowToken: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_flow_submissions?flow_token=eq.${encodeURIComponent(flowToken)}&select=*&order=created_at.desc&limit=1`);
  const submission = rows?.[0]; if (!submission) return null;
  const flow = await flowById(text(submission.flow_id)); if (!flow) return null;
  return { flow, submission };
}
