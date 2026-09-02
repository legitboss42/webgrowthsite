import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";

export const WHATSAPP_CONVERSATION_INACTIVITY_HOURS = 4;
export type WhatsAppConversationSessionStatus = "open" | "closed";

type ConversationRow = {
  id?: unknown;
  contact_id?: unknown;
  status?: unknown;
  assigned_member_id?: unknown;
  first_message_at?: unknown;
  last_message_at?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function recordConversationActivity(input: {
  conversationId: string;
  eventType: "conversation_opened" | "conversation_closed";
  actorMemberId?: string | null;
  actorEmail?: string | null;
  reason: string;
}) {
  const result = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      conversation_id: input.conversationId,
      actor_member_id: input.actorMemberId || null,
      actor_email: input.actorEmail || "automation@webgrowth.info",
      target_member_id: null,
      event_type: input.eventType,
      metadata: { reason: input.reason },
    },
  });
  if (!result.ok) console.warn("Unable to record WhatsApp conversation lifecycle activity", input.eventType);
}

async function cancelConversationAutomations(conversationId: string, reason: string) {
  const runs = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_automation_runs?conversation_id=eq.${encodeURIComponent(conversationId)}&status=in.(QUEUED,RUNNING,WAITING)&select=id,automation_id&limit=100`,
  );
  if (!runs?.length) return 0;

  const now = new Date().toISOString();
  let cancelled = 0;
  for (const run of runs) {
    const runId = text(run.id);
    const automationId = text(run.automation_id);
    if (!runId || !automationId) continue;

    await mutateWhatsAppRest({
      method: "PATCH",
      pathAndQuery: `whatsapp_automation_jobs?run_id=eq.${encodeURIComponent(runId)}&status=in.(PENDING,PROCESSING,WAITING_INPUT)`,
      body: { status: "CANCELLED", completed_at: now, updated_at: now },
    });
    const updated = await mutateWhatsAppRest({
      method: "PATCH",
      pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}&status=in.(QUEUED,RUNNING,WAITING)`,
      body: { status: "CANCELLED", completed_at: now, error_code: null, error_message: null, updated_at: now },
    });
    if (!updated.ok || !updated.rows.length) continue;

    cancelled += 1;
    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_automation_events",
      body: {
        run_id: runId,
        automation_id: automationId,
        event_type: "run_cancelled",
        status: "INFO",
        detail: { reason, conversationId },
      },
    });
  }
  return cancelled;
}

export async function getWhatsAppConversationSession(conversationId: string) {
  const rows = await readWhatsAppRows<ConversationRow>(
    `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,contact_id,status,assigned_member_id,first_message_at,last_message_at&limit=1`,
  );
  const row = rows?.[0];
  if (!row) return null;
  return {
    id: text(row.id),
    contactId: text(row.contact_id) || undefined,
    status: text(row.status).toLowerCase() === "closed" ? "closed" as const : "open" as const,
    assignedMemberId: text(row.assigned_member_id) || undefined,
    firstMessageAt: text(row.first_message_at) || undefined,
    lastMessageAt: text(row.last_message_at) || undefined,
  };
}

export async function setWhatsAppConversationSessionStatus(input: {
  conversationId: string;
  status: WhatsAppConversationSessionStatus;
  reason: string;
  actorMemberId?: string | null;
  actorEmail?: string | null;
  onlyIfLastMessageAtBefore?: string;
}) {
  const current = await getWhatsAppConversationSession(input.conversationId);
  if (!current) return { ok: false as const, status: 404, error: "Conversation was not found." };
  if (current.status === input.status) {
    return { ok: true as const, changed: false, status: current.status, contactId: current.contactId, assignedMemberId: current.assignedMemberId };
  }

  const guard = input.onlyIfLastMessageAtBefore
    ? `&last_message_at=lte.${encodeURIComponent(input.onlyIfLastMessageAtBefore)}`
    : "";
  const previousGuard = `&status=eq.${encodeURIComponent(current.status)}`;
  const now = new Date().toISOString();
  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(input.conversationId)}${previousGuard}${guard}`,
    body: { status: input.status, updated_at: now },
  });
  if (!updated.ok) return { ok: false as const, status: updated.status, error: updated.message };
  if (!updated.rows.length) {
    return { ok: true as const, changed: false, status: current.status, contactId: current.contactId, assignedMemberId: current.assignedMemberId };
  }

  if (input.status === "closed") await cancelConversationAutomations(input.conversationId, input.reason);
  await recordConversationActivity({
    conversationId: input.conversationId,
    eventType: input.status === "open" ? "conversation_opened" : "conversation_closed",
    actorMemberId: input.actorMemberId,
    actorEmail: input.actorEmail,
    reason: input.reason,
  });

  return { ok: true as const, changed: true, status: input.status, contactId: current.contactId, assignedMemberId: current.assignedMemberId };
}

export async function ensureWhatsAppConversationOpenedByInbound(input: {
  waId: string;
  messageId: string;
}) {
  const contacts = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?wa_id=eq.${encodeURIComponent(input.waId)}&select=id&limit=1`,
  );
  const contactId = text(contacts?.[0]?.id);
  if (!contactId) return { opened: false, contactId: undefined, conversationId: undefined };

  const conversations = await readWhatsAppRows<ConversationRow>(
    `whatsapp_conversations?contact_id=eq.${encodeURIComponent(contactId)}&select=id,contact_id,status,assigned_member_id,first_message_at,last_message_at&order=last_message_at.desc&limit=1`,
  );
  const row = conversations?.[0];
  const conversationId = text(row?.id);
  if (!conversationId) return { opened: false, contactId, conversationId: undefined };

  const status = text(row?.status).toLowerCase() === "closed" ? "closed" : "open";
  if (status === "closed") {
    const opened = await setWhatsAppConversationSessionStatus({
      conversationId,
      status: "open",
      reason: "CUSTOMER_MESSAGE",
      actorEmail: "customer@whatsapp",
    });
    return { opened: opened.ok && opened.changed, contactId, conversationId };
  }

  const messages = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=whatsapp_message_id&order=message_timestamp.asc&limit=2`,
  );
  const firstMessageOpenedSession = Boolean(
    messages?.length === 1 && text(messages[0]?.whatsapp_message_id) === input.messageId,
  );
  if (firstMessageOpenedSession) {
    await recordConversationActivity({
      conversationId,
      eventType: "conversation_opened",
      actorEmail: "customer@whatsapp",
      reason: "FIRST_CUSTOMER_MESSAGE",
    });
  }

  return { opened: firstMessageOpenedSession, contactId, conversationId };
}

export async function closeInactiveWhatsAppConversations(hours = WHATSAPP_CONVERSATION_INACTIVITY_HOURS) {
  const safeHours = Math.max(1, Math.min(168, Math.round(Number(hours) || WHATSAPP_CONVERSATION_INACTIVITY_HOURS)));
  const cutoff = new Date(Date.now() - safeHours * 60 * 60 * 1000).toISOString();
  const rows = await readWhatsAppRows<ConversationRow>(
    `whatsapp_conversations?status=eq.open&last_message_at=lte.${encodeURIComponent(cutoff)}&select=id&order=last_message_at.asc&limit=200`,
  );
  let closed = 0;
  for (const row of rows || []) {
    const conversationId = text(row.id);
    if (!conversationId) continue;
    const result = await setWhatsAppConversationSessionStatus({
      conversationId,
      status: "closed",
      reason: `INACTIVITY_${safeHours}H`,
      actorEmail: "automation@webgrowth.info",
      onlyIfLastMessageAtBefore: cutoff,
    });
    if (result.ok && result.changed) closed += 1;
  }
  return { scanned: rows?.length || 0, closed, inactivityHours: safeHours, cutoff };
}
