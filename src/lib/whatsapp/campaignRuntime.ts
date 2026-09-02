import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { getWhatsAppAutomationProcessorSecret, secureAutomationSecretEqual } from "./automationRuntime";
import {
  firstName,
  getWhatsAppCampaignEligibility,
  normalizeWhatsAppCampaignContact,
  normalizeWhatsAppCampaignRow,
  type WhatsAppCampaign,
  type WhatsAppCampaignContact,
} from "./campaignModel";
import { fetchWhatsAppTemplates, sendWhatsAppTemplateMessage, type WhatsAppTemplate } from "./templates";

const RECIPIENT_SELECT = "id,campaign_id,contact_id,wa_id,display_name,status,skip_reason,message_id,contact_snapshot,variable_values,attempts,max_attempts,scheduled_at,locked_at,sent_at,delivered_at,read_at,replied_at,failed_at,reply_message_id,error_code,error_message,created_at,updated_at";
const CAMPAIGN_SELECT = "id,name,description,status,segment_id,audience_snapshot,template_id,template_name,template_language,template_category,template_snapshot,variable_mappings,scheduled_at,started_at,completed_at,paused_at,cancelled_at,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,updated_at";
const CONTACT_SELECT = "id,wa_id,phone,display_name,business_name,email,source,lead_stage,lead_temperature,tags,custom_fields,opt_in_status,opt_in_at,opt_out_at,whatsapp_conversations(status,last_message_at,assigned_member_id)";

export { getWhatsAppAutomationProcessorSecret as getWhatsAppCampaignProcessorSecret, secureAutomationSecretEqual as secureCampaignSecretEqual };

function nowIso() {
  return new Date().toISOString();
}

function safeError(value: unknown) {
  const text = value instanceof Error ? value.message : typeof value === "string" ? value : "Campaign send failed.";
  return text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 500);
}

function asStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, item]) => [key, item]),
  );
}

async function refreshCounts(campaignId: string) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "rpc/refresh_whatsapp_campaign_counts",
    body: { p_campaign_id: campaignId },
  });
}

async function addEvent(input: {
  campaignId: string;
  recipientId?: string;
  eventType: string;
  status?: "INFO" | "SUCCESS" | "SKIPPED" | "ERROR";
  detail?: Record<string, unknown>;
  errorMessage?: string;
}) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_campaign_events",
    body: {
      campaign_id: input.campaignId,
      recipient_id: input.recipientId || null,
      event_type: input.eventType,
      status: input.status || "INFO",
      detail: input.detail || {},
      error_message: input.errorMessage || null,
    },
  });
}

async function getCampaign(id: string): Promise<WhatsAppCampaign | null> {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaigns?id=eq.${encodeURIComponent(id)}&select=${CAMPAIGN_SELECT}&limit=1`,
  );
  return rows?.[0] ? normalizeWhatsAppCampaignRow(rows[0]) : null;
}

async function getContact(id: string | undefined, waId: string): Promise<WhatsAppCampaignContact | null> {
  const filter = id ? `id=eq.${encodeURIComponent(id)}` : `wa_id=eq.${encodeURIComponent(waId)}`;
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?${filter}&select=${CONTACT_SELECT}&limit=1`,
  );
  return rows?.[0] ? normalizeWhatsAppCampaignContact(rows[0]) : null;
}

function mappingValue(source: string, contact: WhatsAppCampaignContact) {
  if (source.startsWith("static:")) return source.slice(7);
  if (source.startsWith("custom.")) return contact.customFields[source.slice(7)] || "";
  if (source === "contact.first_name") return firstName(contact.displayName);
  if (source === "contact.name") return contact.displayName || "";
  if (source === "contact.company") return contact.businessName || "";
  if (source === "contact.email") return contact.email || "";
  if (source === "contact.phone") return contact.phone || contact.waId;
  if (source === "contact.wa_id") return contact.waId;
  if (source === "contact.stage") return contact.leadStage || "";
  if (source === "contact.temperature") return contact.leadTemperature || "";
  if (source === "contact.source") return contact.source || "";
  return "";
}

export function resolveWhatsAppCampaignVariables(mappings: Record<string, string>, contact: WhatsAppCampaignContact) {
  const headerEntries = Object.entries(mappings)
    .filter(([key]) => key.startsWith("header:"))
    .sort(([a], [b]) => Number(a.split(":")[1]) - Number(b.split(":")[1]));
  const bodyEntries = Object.entries(mappings)
    .filter(([key]) => key.startsWith("body:"))
    .sort(([a], [b]) => Number(a.split(":")[1]) - Number(b.split(":")[1]));
  return {
    headerParameters: headerEntries.map(([, source]) => mappingValue(source, contact)),
    bodyParameters: bodyEntries.map(([, source]) => mappingValue(source, contact)),
  };
}

async function frequencyAllowed(contactId: string | undefined, recipientId: string, category: string | undefined) {
  if (!contactId || category !== "MARKETING") return { allowed: true as const };
  const configRows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_campaign_runtime_config?id=eq.default&select=max_marketing_per_24h,max_marketing_per_7d&limit=1",
  );
  const config = configRows?.[0];
  const max24 = Math.max(1, Number(config?.max_marketing_per_24h) || 1);
  const max7d = Math.max(max24, Number(config?.max_marketing_per_7d) || 3);
  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [last24, last7d] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_campaign_recipients?contact_id=eq.${encodeURIComponent(contactId)}&id=neq.${encodeURIComponent(recipientId)}&sent_at=gte.${encodeURIComponent(since24)}&status=in.(SENT,DELIVERED,READ,REPLIED)&select=id&limit=${max24}`,
    ),
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_campaign_recipients?contact_id=eq.${encodeURIComponent(contactId)}&id=neq.${encodeURIComponent(recipientId)}&sent_at=gte.${encodeURIComponent(since7d)}&status=in.(SENT,DELIVERED,READ,REPLIED)&select=id&limit=${max7d}`,
    ),
  ]);
  if ((last24?.length || 0) >= max24) return { allowed: false as const, reason: "FREQUENCY_24H" };
  if ((last7d?.length || 0) >= max7d) return { allowed: false as const, reason: "FREQUENCY_7D" };
  return { allowed: true as const };
}

async function ensureClosedConversation(contactId: string, sentAt: string) {
  const existing = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?contact_id=eq.${encodeURIComponent(contactId)}&select=id,status,last_message_at&limit=1`,
  );
  if (existing?.[0]?.id) {
    const currentLast = typeof existing[0].last_message_at === "string" ? Date.parse(existing[0].last_message_at) : 0;
    if (Date.parse(sentAt) > currentLast) {
      await mutateWhatsAppRest({
        method: "PATCH",
        pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(String(existing[0].id))}`,
        body: { last_message_at: sentAt, updated_at: nowIso() },
      });
    }
    return String(existing[0].id);
  }
  const created = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_conversations",
    body: {
      contact_id: contactId,
      status: "closed",
      first_message_at: sentAt,
      last_message_at: sentAt,
      intent: "CAMPAIGN",
      human_review_required: false,
      updated_at: nowIso(),
    },
  });
  return created.ok && created.rows[0]?.id ? String(created.rows[0].id) : null;
}

async function recordCampaignOutbound(input: {
  contactId?: string;
  messageId: string;
  waId: string;
  campaignName: string;
  templateName: string;
  sentAt: string;
}) {
  if (!input.contactId) return;
  const conversationId = await ensureClosedConversation(input.contactId, input.sentAt);
  if (!conversationId) return;
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_messages",
    body: {
      conversation_id: conversationId,
      whatsapp_message_id: input.messageId,
      direction: "outbound",
      message_type: "template",
      message_text: `[Campaign: ${input.campaignName}] ${input.templateName}`,
      message_timestamp: input.sentAt,
      delivery_status: "sent",
    },
  });
}

async function skipRecipient(row: Record<string, unknown>, reason: string) {
  const id = String(row.id);
  const campaignId = String(row.campaign_id);
  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(id)}`,
    body: { status: "SKIPPED", skip_reason: reason, locked_at: null, updated_at: nowIso() },
  });
  await addEvent({ campaignId, recipientId: id, eventType: "recipient_skipped", status: "SKIPPED", detail: { reason } });
}

async function recoverStuckRecipients() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const stuck = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaign_recipients?status=eq.SENDING&locked_at=lt.${encodeURIComponent(cutoff)}&select=id,campaign_id&limit=100`,
  );
  if (!stuck?.length) return;
  for (const row of stuck) {
    await mutateWhatsAppRest({
      method: "PATCH",
      pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(String(row.id))}`,
      body: {
        status: "FAILED",
        failed_at: nowIso(),
        error_code: "WORKER_INTERRUPTED",
        error_message: "The send outcome could not be verified after the worker stopped. It was not retried to avoid a duplicate message.",
        locked_at: null,
        updated_at: nowIso(),
      },
    });
    await refreshCounts(String(row.campaign_id));
  }
}

export async function processWhatsAppCampaignQueue(limit = 25) {
  await recoverStuckRecipients();
  const claimed = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "rpc/claim_whatsapp_campaign_recipients",
    body: { p_limit: Math.max(1, Math.min(limit, 100)) },
  });
  if (!claimed.ok) return { claimed: 0, sent: 0, skipped: 0, failed: 0, error: claimed.message };
  if (!claimed.rows.length) return { claimed: 0, sent: 0, skipped: 0, failed: 0 };

  const templatesResult = await fetchWhatsAppTemplates();
  const approved = new Map<string, WhatsAppTemplate>();
  if (templatesResult.ok) {
    for (const template of templatesResult.templates) {
      if (template.status === "APPROVED") {
        approved.set(template.id, template);
        approved.set(`${template.name}:${template.language || "en_US"}`, template);
      }
    }
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const touched = new Set<string>();

  for (const row of claimed.rows) {
    const recipientId = String(row.id || "");
    const campaignId = String(row.campaign_id || "");
    touched.add(campaignId);
    try {
      const campaign = await getCampaign(campaignId);
      if (!campaign || !new Set(["SCHEDULED", "RUNNING"]).has(campaign.status)) {
        await skipRecipient(row, "CAMPAIGN_NOT_ACTIVE");
        skippedCount += 1;
        continue;
      }
      if (campaign.status === "SCHEDULED") {
        await mutateWhatsAppRest({
          method: "PATCH",
          pathAndQuery: `whatsapp_campaigns?id=eq.${encodeURIComponent(campaignId)}&status=eq.SCHEDULED`,
          body: { status: "RUNNING", started_at: campaign.startedAt || nowIso(), updated_at: nowIso() },
        });
      }

      const contactId = typeof row.contact_id === "string" ? row.contact_id : undefined;
      const waId = String(row.wa_id || "");
      const contact = await getContact(contactId, waId);
      if (!contact) {
        await skipRecipient(row, "CONTACT_NOT_FOUND");
        skippedCount += 1;
        continue;
      }
      const eligibility = getWhatsAppCampaignEligibility(contact);
      if (!eligibility.eligible) {
        await skipRecipient(row, eligibility.reason);
        skippedCount += 1;
        continue;
      }
      const frequency = await frequencyAllowed(contact.id, recipientId, campaign.templateCategory);
      if (!frequency.allowed) {
        await skipRecipient(row, frequency.reason);
        skippedCount += 1;
        continue;
      }

      const template = approved.get(campaign.templateId) || approved.get(`${campaign.templateName}:${campaign.templateLanguage}`);
      if (!template) {
        await skipRecipient(row, templatesResult.ok ? "TEMPLATE_NOT_APPROVED" : "TEMPLATE_STATUS_UNAVAILABLE");
        skippedCount += 1;
        continue;
      }

      const mappings = campaign.variableMappings || {};
      const variables = resolveWhatsAppCampaignVariables(mappings, contact);
      if ([...variables.headerParameters, ...variables.bodyParameters].some((value) => !value.trim())) {
        await skipRecipient(row, "MISSING_VARIABLE_VALUE");
        skippedCount += 1;
        continue;
      }

      const sent = await sendWhatsAppTemplateMessage({
        to: contact.waId,
        name: template.name,
        language: template.language || campaign.templateLanguage || "en_US",
        headerParameters: variables.headerParameters,
        bodyParameters: variables.bodyParameters,
      });
      if (!sent.ok) throw new Error(sent.error || sent.reason);

      const sentAt = nowIso();
      await mutateWhatsAppRest({
        method: "PATCH",
        pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(recipientId)}`,
        body: {
          status: "SENT",
          message_id: sent.messageId,
          variable_values: { header: variables.headerParameters, body: variables.bodyParameters },
          sent_at: sentAt,
          locked_at: null,
          error_code: null,
          error_message: null,
          updated_at: sentAt,
        },
      });
      await recordCampaignOutbound({
        contactId: contact.id,
        messageId: sent.messageId,
        waId: contact.waId,
        campaignName: campaign.name,
        templateName: campaign.templateName,
        sentAt,
      });
      await addEvent({ campaignId, recipientId, eventType: "recipient_sent", status: "SUCCESS", detail: { messageId: sent.messageId } });
      sentCount += 1;
    } catch (error) {
      const attempts = Math.max(1, Number(row.attempts) || 1);
      const maxAttempts = Math.max(1, Number(row.max_attempts) || 3);
      const message = safeError(error);
      if (attempts < maxAttempts) {
        const retryAt = new Date(Date.now() + Math.min(30, 2 ** attempts) * 60_000).toISOString();
        await mutateWhatsAppRest({
          method: "PATCH",
          pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(recipientId)}`,
          body: { status: "PENDING", scheduled_at: retryAt, locked_at: null, error_message: message, updated_at: nowIso() },
        });
        await addEvent({ campaignId, recipientId, eventType: "recipient_retry_scheduled", status: "ERROR", detail: { retryAt, attempts }, errorMessage: message });
      } else {
        await mutateWhatsAppRest({
          method: "PATCH",
          pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(recipientId)}`,
          body: { status: "FAILED", failed_at: nowIso(), locked_at: null, error_code: "SEND_FAILED", error_message: message, updated_at: nowIso() },
        });
        await addEvent({ campaignId, recipientId, eventType: "recipient_failed", status: "ERROR", errorMessage: message });
      }
      failedCount += 1;
    }
  }

  for (const campaignId of touched) await refreshCounts(campaignId);
  return { claimed: claimed.rows.length, sent: sentCount, skipped: skippedCount, failed: failedCount };
}

function deliveryRank(status: string) {
  return { PENDING: 0, SENDING: 1, SENT: 2, DELIVERED: 3, READ: 4, REPLIED: 5 }[status] ?? 0;
}

export async function updateWhatsAppCampaignDeliveryStatus(messageId: string, status: string, error?: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaign_recipients?message_id=eq.${encodeURIComponent(messageId)}&select=${RECIPIENT_SELECT}&limit=1`,
  );
  const row = rows?.[0];
  if (!row) return false;
  const current = String(row.status || "PENDING");
  if (current === "REPLIED" || current === "SKIPPED" || current === "CANCELLED") return true;
  const normalized = status.toLowerCase();
  let next: "SENT" | "DELIVERED" | "READ" | "FAILED" | null = null;
  if (normalized === "sent" || normalized === "accepted") next = "SENT";
  if (normalized === "delivered") next = "DELIVERED";
  if (normalized === "read") next = "READ";
  if (normalized === "failed") next = "FAILED";
  if (!next) return true;
  if (next !== "FAILED" && deliveryRank(next) < deliveryRank(current)) return true;

  const changedAt = nowIso();
  const body: Record<string, unknown> = { status: next, updated_at: changedAt };
  if (next === "DELIVERED") body.delivered_at = changedAt;
  if (next === "READ") body.read_at = changedAt;
  if (next === "FAILED") {
    body.failed_at = changedAt;
    body.error_code = "META_DELIVERY_FAILED";
    body.error_message = error || "Meta reported delivery failure.";
  }
  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(String(row.id))}`,
    body,
  });
  await addEvent({
    campaignId: String(row.campaign_id),
    recipientId: String(row.id),
    eventType: `delivery_${next.toLowerCase()}`,
    status: next === "FAILED" ? "ERROR" : "SUCCESS",
    ...(error ? { errorMessage: error } : {}),
  });
  await refreshCounts(String(row.campaign_id));
  return true;
}

const OPT_OUT = new Set(["stop", "unsubscribe", "cancel", "opt out", "opt-out", "remove me"]);

export function isWhatsAppCampaignOptOutText(value: string | undefined) {
  return OPT_OUT.has((value || "").trim().toLowerCase().replace(/\s+/g, " "));
}

export async function recordWhatsAppCampaignInbound(input: {
  waId: string;
  messageId: string;
  timestamp: number;
  text?: string;
}) {
  const optedOut = isWhatsAppCampaignOptOutText(input.text);
  if (optedOut) {
    await mutateWhatsAppRest({
      method: "PATCH",
      pathAndQuery: `whatsapp_contacts?wa_id=eq.${encodeURIComponent(input.waId)}`,
      body: { opt_in_status: "OPTED_OUT", opt_out_at: nowIso(), updated_at: nowIso() },
    });
  }

  const messageAt = new Date(input.timestamp * 1000).toISOString();
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_campaign_recipients?wa_id=eq.${encodeURIComponent(input.waId)}&sent_at=not.is.null&sent_at=lte.${encodeURIComponent(messageAt)}&status=in.(SENT,DELIVERED,READ)&select=id,campaign_id,sent_at&order=sent_at.desc&limit=1`,
  );
  const row = rows?.[0];
  if (!row) return { replied: false, optedOut };

  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_campaign_recipients?id=eq.${encodeURIComponent(String(row.id))}`,
    body: { status: "REPLIED", replied_at: messageAt, reply_message_id: input.messageId, updated_at: nowIso() },
  });
  await addEvent({
    campaignId: String(row.campaign_id),
    recipientId: String(row.id),
    eventType: optedOut ? "recipient_opted_out" : "recipient_replied",
    status: "SUCCESS",
    detail: { messageId: input.messageId },
  });
  await refreshCounts(String(row.campaign_id));
  return { replied: true, optedOut };
}

export function campaignMappingsFromRow(value: unknown) {
  return asStringRecord(value);
}
