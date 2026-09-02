import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { getWhatsAppSupabaseConfig, mutateWhatsAppRest, POSTGRES_UNIQUE_VIOLATION, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { normalizeWhatsAppQuickReplyRow, resolveWhatsAppQuickReplyVariables } from "@/app/admin/whatsapp/quickRepliesModel";
import {
  getWhatsAppAutomationTriggerLabel,
  normalizeWhatsAppAutomationRow,
  type WhatsAppAutomation,
  type WhatsAppAutomationAction,
  type WhatsAppAutomationCondition,
  type WhatsAppAutomationTriggerType,
} from "./automationModel";
import { sendWhatsAppMedia, sendWhatsAppText } from "./send";
import { downloadWhatsAppSavedReplyMedia } from "./savedReplyMedia";
import { createSupabaseWhatsAppStore } from "./store";
import { fetchWhatsAppTemplates, sendWhatsAppTemplateMessage } from "./templates";
import { isWhatsAppBusinessHoursOpen } from "./settings";
import { loadWhatsAppSettings } from "./settingsStore";

export type WhatsAppAutomationEvent = {
  type: WhatsAppAutomationTriggerType;
  eventKey: string;
  triggerValue?: string;
  contactId?: string;
  conversationId?: string;
  waId?: string;
  payload?: Record<string, unknown>;
  message?: { id?: string; text?: string; type?: string; timestamp?: number };
  ancestry?: string[];
  depth?: number;
};

type RuntimeContact = {
  id: string;
  waId: string;
  phone: string;
  displayName: string;
  company: string;
  email: string;
  leadStage: string;
  tags: string[];
  customFields: Record<string, string>;
  optInStatus: string;
};
type RuntimeConversation = { id: string; status: string; assignedMemberId?: string; lastMessageAt?: string };
type RuntimeMessage = { id: string; text?: string; type?: string; timestamp: number };
export type WhatsAppAutomationRuntimeContext = {
  trigger: { type: string; value?: string; payload: Record<string, unknown> };
  contact: RuntimeContact | null;
  conversation: RuntimeConversation | null;
  message: RuntimeMessage | null;
  latestInbound: RuntimeMessage | null;
  latestOutbound: RuntimeMessage | null;
  businessHours: "OPEN" | "CLOSED" | "UNKNOWN";
  ancestry: string[];
  depth: number;
};

type ExecutionResult = { status: "SUCCEEDED" | "WAITING" | "STOPPED" | "FAILED"; error?: string };

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function customFields(value: unknown) {
  const raw = object(value); const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(raw)) if (typeof item === "string") result[key] = item;
  return result;
}
function seconds(unit: string | undefined, amount: number | undefined) {
  const multiplier = unit === "DAYS" ? 86400 : unit === "HOURS" ? 3600 : 60;
  return Math.max(1, Number(amount) || 1) * multiplier;
}

export function createWhatsAppAutomationEventId() { return randomUUID(); }
export function hashWhatsAppAutomationPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}
export function secureAutomationSecretEqual(left: string, right: string) {
  if (!left || !right) return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getWhatsAppAutomationProcessorSecret() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_automation_runtime_config?id=eq.default&select=processor_secret&limit=1",
  );
  return text(rows?.[0]?.processor_secret);
}

function findCustom(fields: Record<string, string>, wanted: string) {
  if (fields[wanted] !== undefined) return fields[wanted];
  const key = Object.keys(fields).find((item) => item.toLowerCase() === wanted.toLowerCase());
  return key ? fields[key] : "";
}

function fieldValue(field: string, ctx: WhatsAppAutomationRuntimeContext): unknown {
  if (field === "message.text") return ctx.message?.text || "";
  if (field === "message.type") return ctx.message?.type || "";
  if (field === "contact.tags") return ctx.contact?.tags || [];
  if (field === "contact.lead_stage") return ctx.contact?.leadStage || "";
  if (field === "contact.phone") return ctx.contact?.phone || ctx.contact?.waId || "";
  if (field === "contact.email") return ctx.contact?.email || "";
  if (field === "contact.company") return ctx.contact?.company || "";
  if (field === "contact.opt_in_status") return ctx.contact?.optInStatus || "";
  if (field === "conversation.assigned_member_id") return ctx.conversation?.assignedMemberId || "";
  if (field === "conversation.status") return ctx.conversation?.status || "";
  if (field === "business_hours") return ctx.businessHours;
  if (field.startsWith("contact.custom.")) return ctx.contact ? findCustom(ctx.contact.customFields, field.slice("contact.custom.".length)) : "";
  if (field.startsWith("trigger.payload.")) {
    const parts = field.slice("trigger.payload.".length).split("."); let current: unknown = ctx.trigger.payload;
    for (const part of parts) current = object(current)[part];
    return current;
  }
  return "";
}

export function evaluateWhatsAppAutomationCondition(condition: WhatsAppAutomationCondition, ctx: WhatsAppAutomationRuntimeContext) {
  const actual = fieldValue(condition.field, ctx);
  const expected = condition.value.trim();
  const values = Array.isArray(actual) ? actual.map((item) => String(item).toLowerCase()) : [String(actual ?? "").toLowerCase()];
  const wanted = expected.toLowerCase();
  if (condition.operator === "EXISTS") return values.some(Boolean);
  if (condition.operator === "NOT_EXISTS") return !values.some(Boolean);
  if (condition.operator === "EQUALS") return values.some((value) => value === wanted);
  if (condition.operator === "NOT_EQUALS") return values.every((value) => value !== wanted);
  if (condition.operator === "CONTAINS") return values.some((value) => value.includes(wanted));
  if (condition.operator === "NOT_CONTAINS") return values.every((value) => !value.includes(wanted));
  if (condition.operator === "STARTS_WITH") return values.some((value) => value.startsWith(wanted));
  if (condition.operator === "GREATER_THAN") return Number(values[0]) > Number(expected);
  if (condition.operator === "LESS_THAN") return Number(values[0]) < Number(expected);
  return false;
}

function entryConditionsMatch(automation: WhatsAppAutomation, ctx: WhatsAppAutomationRuntimeContext) {
  if (!automation.conditions.length) return true;
  const results = automation.conditions.map((condition) => evaluateWhatsAppAutomationCondition(condition, ctx));
  return automation.conditionJoin === "OR" ? results.some(Boolean) : results.every(Boolean);
}

function variableValue(key: string, ctx: WhatsAppAutomationRuntimeContext) {
  const name = key.trim().toLowerCase();
  const fullName = ctx.contact?.displayName || "";
  if (name === "first_name") return fullName.split(/\s+/)[0] || "";
  if (name === "full_name") return fullName;
  if (name === "company") return ctx.contact?.company || "";
  if (name === "phone") return ctx.contact?.phone || ctx.contact?.waId || "";
  if (name === "email") return ctx.contact?.email || "";
  if (name === "message") return ctx.message?.text || "";
  if (name === "crm_stage") return ctx.contact?.leadStage || "";
  if (name.startsWith("custom.")) return ctx.contact ? findCustom(ctx.contact.customFields, key.slice(key.indexOf(".") + 1)) : "";
  return "";
}

export function resolveWhatsAppAutomationText(input: string, ctx: WhatsAppAutomationRuntimeContext) {
  return input.replace(/{{\s*([^{}]+?)\s*}}/g, (token, raw: string) => variableValue(raw, ctx) || token);
}

async function loadMessage(conversationId: string, direction: "inbound" | "outbound") {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&direction=eq.${direction}&select=whatsapp_message_id,message_text,message_type,message_timestamp&order=message_timestamp.desc&limit=1`,
  );
  const row = rows?.[0]; if (!row) return null;
  const at = Date.parse(text(row.message_timestamp));
  return { id: text(row.whatsapp_message_id), text: text(row.message_text) || undefined, type: text(row.message_type) || undefined, timestamp: Number.isFinite(at) ? Math.floor(at / 1000) : 0 } satisfies RuntimeMessage;
}

async function loadContext(event: WhatsAppAutomationEvent): Promise<WhatsAppAutomationRuntimeContext> {
  let contactRow: Record<string, unknown> | undefined;
  let conversationRow: Record<string, unknown> | undefined;
  if (event.conversationId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_conversations?id=eq.${encodeURIComponent(event.conversationId)}&select=id,contact_id,status,assigned_member_id,last_message_at&limit=1`,
    );
    conversationRow = rows?.[0];
  }
  const contactId = event.contactId || text(conversationRow?.contact_id);
  if (contactId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}&select=id,wa_id,phone,display_name,business_name,email,lead_stage,tags,custom_fields,opt_in_status&limit=1`,
    );
    contactRow = rows?.[0];
  } else if (event.waId) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_contacts?wa_id=eq.${encodeURIComponent(event.waId.replace(/^\+/, ""))}&select=id,wa_id,phone,display_name,business_name,email,lead_stage,tags,custom_fields,opt_in_status&limit=1`,
    );
    contactRow = rows?.[0];
  }
  if (!conversationRow && contactRow?.id) {
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_conversations?contact_id=eq.${encodeURIComponent(String(contactRow.id))}&select=id,contact_id,status,assigned_member_id,last_message_at&order=last_message_at.desc&limit=1`,
    );
    conversationRow = rows?.[0];
  }
  const contact: RuntimeContact | null = contactRow ? {
    id: String(contactRow.id), waId: text(contactRow.wa_id), phone: text(contactRow.phone), displayName: text(contactRow.display_name),
    company: text(contactRow.business_name), email: text(contactRow.email), leadStage: text(contactRow.lead_stage), tags: stringArray(contactRow.tags),
    customFields: customFields(contactRow.custom_fields), optInStatus: text(contactRow.opt_in_status),
  } : null;
  const conversation: RuntimeConversation | null = conversationRow ? {
    id: String(conversationRow.id), status: text(conversationRow.status), assignedMemberId: text(conversationRow.assigned_member_id) || undefined,
    lastMessageAt: text(conversationRow.last_message_at) || undefined,
  } : null;
  const [latestInbound, latestOutbound, settingsLoad] = await Promise.all([
    conversation ? loadMessage(conversation.id, "inbound") : Promise.resolve(null),
    conversation ? loadMessage(conversation.id, "outbound") : Promise.resolve(null),
    loadWhatsAppSettings(),
  ]);
  const open = isWhatsAppBusinessHoursOpen(settingsLoad.settings.businessHours, new Date());
  const message = event.message ? {
    id: event.message.id || latestInbound?.id || "", text: event.message.text, type: event.message.type,
    timestamp: event.message.timestamp || latestInbound?.timestamp || Math.floor(Date.now() / 1000),
  } : latestInbound;
  return {
    trigger: { type: event.type, value: event.triggerValue, payload: event.payload || {} }, contact, conversation, message,
    latestInbound, latestOutbound, businessHours: open === null ? "UNKNOWN" : open ? "OPEN" : "CLOSED",
    ancestry: event.ancestry || [], depth: event.depth || 0,
  };
}

async function addEvent(runId: string, automationId: string, eventType: string, status: "INFO" | "SUCCESS" | "SKIPPED" | "ERROR", detail: Record<string, unknown> = {}, error?: string, actionIndex?: number) {
  await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_automation_events", body: {
    run_id: runId, automation_id: automationId, event_type: eventType, action_index: actionIndex ?? null, status, detail, error_message: error || null,
  } });
}

async function activity(ctx: WhatsAppAutomationRuntimeContext, eventType: string, metadata: Record<string, unknown>) {
  if (!ctx.contact && !ctx.conversation) return;
  await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_team_activity", body: {
    conversation_id: ctx.conversation?.id || null, actor_member_id: null, actor_email: "automation@webgrowth.info", target_member_id: null,
    event_type: eventType, metadata: { ...metadata, contactId: ctx.contact?.id || null },
  } });
}

function automationMatchesEvent(automation: WhatsAppAutomation, event: WhatsAppAutomationEvent, ctx: WhatsAppAutomationRuntimeContext) {
  if (event.type === "NEW_MESSAGE" && automation.triggerType === "NEW_MESSAGE") return true;
  if (event.type === "NEW_MESSAGE" && automation.triggerType === "KEYWORD") {
    const keyword = text(automation.triggerConfig.keyword).toLowerCase();
    return Boolean(keyword && (ctx.message?.text || "").toLowerCase().includes(keyword));
  }
  if (automation.triggerType !== event.type) return false;
  if (event.type === "TAG_ADDED") return text(automation.triggerConfig.tag).toLowerCase() === text(event.triggerValue).toLowerCase();
  if (event.type === "CRM_STAGE_CHANGED") return text(automation.triggerConfig.stage).toUpperCase() === text(event.triggerValue).toUpperCase();
  if (event.type === "CONVERSATION_ASSIGNED") {
    const wanted = text(automation.triggerConfig.memberId); return !wanted || wanted === text(event.triggerValue);
  }
  if (event.type === "BUSINESS_HOURS") return text(automation.triggerConfig.transition).toUpperCase() === text(event.triggerValue).toUpperCase();
  if (event.type === "WEBHOOK") return text(automation.triggerConfig.key) === text(event.triggerValue);
  return true;
}

async function patchContact(ctx: WhatsAppAutomationRuntimeContext, patch: Record<string, unknown>, automation: WhatsAppAutomation) {
  if (!ctx.contact) throw new Error("This action needs a contact.");
  const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_contacts?id=eq.${encodeURIComponent(ctx.contact.id)}`, body: { ...patch, updated_at: new Date().toISOString() } });
  if (!result.ok) throw new Error(result.message);
  await activity(ctx, "contact_updated", { fields: Object.keys(patch), automationId: automation.id, automationName: automation.name });
}

async function recordOutbound(ctx: WhatsAppAutomationRuntimeContext, input: { id: string; text?: string; type?: string; mediaId?: string; mediaMimeType?: string; mediaFilename?: string }) {
  if (!ctx.contact) return;
  const config = getWhatsAppSupabaseConfig(); if (!config) return;
  const store = createSupabaseWhatsAppStore({ url: config.url, serviceRoleKey: config.key });
  await store.recordOutbound({
    messageId: input.id, waId: ctx.contact.waId, conversationId: ctx.conversation?.id, text: input.text,
    type: input.type || "text", timestamp: Math.floor(Date.now() / 1000), mediaId: input.mediaId,
    mediaMimeType: input.mediaMimeType, mediaFilename: input.mediaFilename,
  });
}

async function executeSingle(action: WhatsAppAutomationAction, automation: WhatsAppAutomation, runId: string, ctx: WhatsAppAutomationRuntimeContext, actionIndex: number): Promise<ExecutionResult | null> {
  const label = action.type;
  await addEvent(runId, automation.id, "action_started", "INFO", { action: label }, undefined, actionIndex);
  if (action.type === "SEND_TEXT") {
    if (!ctx.contact || !ctx.latestInbound) throw new Error("Send text needs a contact with a recent inbound message.");
    const body = resolveWhatsAppAutomationText(action.value || "", ctx);
    const sent = await sendWhatsAppText({ to: ctx.contact.waId, text: body, customerMessageTimestamp: ctx.latestInbound.timestamp, replyToMessageId: ctx.message?.id });
    if (!sent.sent) throw new Error(sent.reason === "SERVICE_WINDOW_CLOSED" ? "The 24-hour service window is closed. Use an approved template." : `WhatsApp send failed: ${sent.reason}`);
    await recordOutbound(ctx, { id: sent.messageId, text: body });
  } else if (action.type === "SEND_TEMPLATE") {
    if (!ctx.contact) throw new Error("Send template needs a contact.");
    const templates = await fetchWhatsAppTemplates();
    if (!templates.ok) throw new Error("Approved templates could not be loaded from Meta.");
    const template = templates.templates.find((item) => item.status === "APPROVED" && item.name === action.value);
    if (!template) throw new Error("That approved Meta template was not found.");
    const sent = await sendWhatsAppTemplateMessage({ to: ctx.contact.waId, name: template.name, language: action.value2 || template.language || "en_US" });
    if (!sent.ok) throw new Error(sent.error || `Template send failed: ${sent.reason}`);
    await recordOutbound(ctx, { id: sent.messageId, text: `[Template: ${template.name}]`, type: "template" });
  } else if (action.type === "SEND_SAVED_REPLY") {
    if (!ctx.contact || !ctx.latestInbound) throw new Error("Saved Reply needs a contact with an open service window.");
    const shortcut = (action.value || "").replace(/^\/+/, "").toLowerCase();
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_quick_replies?scope=eq.TEAM&shortcut=eq.${encodeURIComponent(shortcut)}&select=*&limit=1`);
    if (!rows?.[0]) throw new Error("That Team Saved Reply was not found.");
    const reply = normalizeWhatsAppQuickReplyRow(rows[0]);
    const resolved = resolveWhatsAppQuickReplyVariables(reply.body, {
      fullName: ctx.contact.displayName, company: ctx.contact.company, phone: ctx.contact.phone || ctx.contact.waId,
      email: ctx.contact.email, agentName: "Web Growth Automation", customFields: ctx.contact.customFields,
    });
    if (reply.media_kind && reply.media_path && reply.media_mime_type) {
      const loaded = await downloadWhatsAppSavedReplyMedia(reply.media_path);
      if (!loaded.ok) throw new Error(loaded.error);
      const sent = await sendWhatsAppMedia({
        to: ctx.contact.waId, kind: reply.media_kind, file: loaded.blob, filename: reply.media_filename || "attachment",
        mimeType: reply.media_mime_type, caption: resolved.text, customerMessageTimestamp: ctx.latestInbound.timestamp,
      });
      if (!sent.sent) throw new Error(`Saved Reply media send failed: ${sent.reason}`);
      await recordOutbound(ctx, { id: sent.messageId, text: resolved.text, type: reply.media_kind, mediaId: sent.mediaId, mediaMimeType: reply.media_mime_type, mediaFilename: reply.media_filename });
    } else {
      const sent = await sendWhatsAppText({ to: ctx.contact.waId, text: resolved.text, customerMessageTimestamp: ctx.latestInbound.timestamp });
      if (!sent.sent) throw new Error(sent.reason === "SERVICE_WINDOW_CLOSED" ? "The 24-hour service window is closed. Use a template." : `Saved Reply send failed: ${sent.reason}`);
      await recordOutbound(ctx, { id: sent.messageId, text: resolved.text });
    }
  } else if (action.type === "ASSIGN_CONVERSATION") {
    if (!ctx.conversation) throw new Error("Assignment needs a conversation.");
    const memberId = action.value || "";
    const members = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_team_members?id=eq.${encodeURIComponent(memberId)}&active=eq.true&select=id,google_email,availability&limit=1`);
    const member = members?.[0]; if (!member) throw new Error("That team member is not active.");
    if (text(member.availability) !== "available") throw new Error("That team member is not Online.");
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(ctx.conversation.id)}`, body: { assigned_member_id: memberId, assigned_to: text(member.google_email) || null, updated_at: new Date().toISOString() } });
    const previous = ctx.conversation.assignedMemberId; ctx.conversation.assignedMemberId = memberId;
    if (previous !== memberId) await dispatchWhatsAppAutomationEvent({ type: "CONVERSATION_ASSIGNED", eventKey: `automation:${runId}:assign:${memberId}`, triggerValue: memberId, contactId: ctx.contact?.id, conversationId: ctx.conversation.id, ancestry: [...ctx.ancestry, automation.id], depth: ctx.depth + 1 });
  } else if (action.type === "ADD_TAG" || action.type === "REMOVE_TAG") {
    if (!ctx.contact) throw new Error("Tag actions need a contact.");
    const wanted = resolveWhatsAppAutomationText(action.value || "", ctx).trim();
    const existing = ctx.contact.tags; const match = existing.find((item) => item.toLowerCase() === wanted.toLowerCase());
    const next = action.type === "ADD_TAG" ? (match ? existing : [...existing, wanted]) : existing.filter((item) => item.toLowerCase() !== wanted.toLowerCase());
    await patchContact(ctx, { tags: next }, automation); ctx.contact.tags = next;
    if (action.type === "ADD_TAG" && !match) await dispatchWhatsAppAutomationEvent({ type: "TAG_ADDED", eventKey: `automation:${runId}:tag:${wanted.toLowerCase()}`, triggerValue: wanted, contactId: ctx.contact.id, conversationId: ctx.conversation?.id, ancestry: [...ctx.ancestry, automation.id], depth: ctx.depth + 1 });
  } else if (action.type === "UPDATE_CRM_STAGE") {
    if (!ctx.contact) throw new Error("CRM stage actions need a contact.");
    const stage = (action.value || "").toUpperCase(); const previous = ctx.contact.leadStage;
    await patchContact(ctx, { lead_stage: stage }, automation); ctx.contact.leadStage = stage;
    if (stage !== previous) await dispatchWhatsAppAutomationEvent({ type: "CRM_STAGE_CHANGED", eventKey: `automation:${runId}:stage:${stage}`, triggerValue: stage, contactId: ctx.contact.id, conversationId: ctx.conversation?.id, ancestry: [...ctx.ancestry, automation.id], depth: ctx.depth + 1 });
  } else if (action.type === "UPDATE_CONTACT_FIELD") {
    if (!ctx.contact) throw new Error("Contact-field actions need a contact.");
    const key = action.value || ""; const value = resolveWhatsAppAutomationText(action.value2 || "", ctx);
    if (key.startsWith("custom.")) {
      const field = key.slice(7); const next = { ...ctx.contact.customFields, [field]: value };
      await patchContact(ctx, { custom_fields: next }, automation); ctx.contact.customFields = next;
    } else {
      const map: Record<string, string> = { email: "email", phone: "phone", company: "business_name", display_name: "display_name", opt_in_status: "opt_in_status" };
      const column = map[key]; if (!column) throw new Error("Use email, phone, company, display_name, opt_in_status, or custom.<field>.");
      await patchContact(ctx, { [column]: value }, automation);
    }
  } else if (action.type === "ADD_INTERNAL_NOTE") {
    if (!ctx.conversation) throw new Error("Internal notes need a conversation.");
    const body = resolveWhatsAppAutomationText(action.value || "", ctx);
    const note = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_internal_notes", body: { conversation_id: ctx.conversation.id, author_member_id: null, author_email: "automation@webgrowth.info", body } });
    if (!note.ok) throw new Error(note.message);
    await activity(ctx, "internal_note_created", { automationId: automation.id, automationName: automation.name });
  } else if (action.type === "CALL_WEBHOOK") {
    const response = await fetch(action.value || "", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "WebGrowth-WhatsApp-Automation/1.0" }, body: JSON.stringify({ automation: { id: automation.id, name: automation.name }, runId, context: ctx }), signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok) throw new Error(`External webhook returned HTTP ${response.status}.`);
  } else if (action.type === "STOP") {
    await addEvent(runId, automation.id, "action_completed", "SUCCESS", { action: label }, undefined, actionIndex);
    return { status: "STOPPED" };
  }
  await addEvent(runId, automation.id, "action_completed", "SUCCESS", { action: label }, undefined, actionIndex);
  return null;
}

async function executePlan(actions: WhatsAppAutomationAction[], automation: WhatsAppAutomation, runId: string, ctx: WhatsAppAutomationRuntimeContext, baseIndex = 0): Promise<ExecutionResult> {
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index]; const actionIndex = baseIndex + index;
    try {
      if (action.type === "BRANCH") {
        const yes = Boolean(action.condition && evaluateWhatsAppAutomationCondition(action.condition, ctx));
        await addEvent(runId, automation.id, "branch_evaluated", "SUCCESS", { result: yes ? "YES" : "NO", condition: action.condition }, undefined, actionIndex);
        const chosen = yes ? action.thenActions || [] : action.elseActions || [];
        const combined = [...chosen, ...actions.slice(index + 1)];
        return executePlan(combined, automation, runId, ctx, actionIndex + 1);
      }
      if (action.type === "DELAY") {
        const dueAt = new Date(Date.now() + seconds(action.unit, action.amount) * 1000).toISOString();
        const job = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_automation_jobs", body: {
          run_id: runId, automation_id: automation.id, status: "PENDING", due_at: dueAt, action_index: actionIndex,
          payload: { remainingActions: actions.slice(index + 1), context: ctx }, attempts: 0, max_attempts: 5,
        } });
        if (!job.ok) throw new Error(job.message);
        await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: { status: "WAITING", next_action_index: actionIndex + 1, updated_at: new Date().toISOString() } });
        await addEvent(runId, automation.id, "delay_scheduled", "SUCCESS", { dueAt, amount: action.amount, unit: action.unit }, undefined, actionIndex);
        return { status: "WAITING" };
      }
      const result = await executeSingle(action, automation, runId, ctx, actionIndex);
      if (result?.status === "STOPPED") return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Automation action failed.";
      await addEvent(runId, automation.id, "action_failed", "ERROR", { action: action.type }, message, actionIndex);
      return { status: "FAILED", error: message };
    }
  }
  return { status: "SUCCEEDED" };
}

async function finishRun(runId: string, automation: WhatsAppAutomation, ctx: WhatsAppAutomationRuntimeContext, result: ExecutionResult) {
  if (result.status === "WAITING") return;
  const status = result.status === "FAILED" ? "FAILED" : "SUCCEEDED";
  await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: {
    status, completed_at: new Date().toISOString(), error_code: result.status === "FAILED" ? "ACTION_FAILED" : null,
    error_message: result.error || null, updated_at: new Date().toISOString(),
  } });
  await addEvent(runId, automation.id, status === "FAILED" ? "run_failed" : "run_completed", status === "FAILED" ? "ERROR" : "SUCCESS", {}, result.error);
  await activity(ctx, status === "FAILED" ? "automation_failed" : "automation_completed", { automationId: automation.id, automationName: automation.name, runId, error: result.error || null });
}

async function candidateAutomations(event: WhatsAppAutomationEvent) {
  const filter = event.type === "NEW_MESSAGE" ? "trigger_type=in.(NEW_MESSAGE,KEYWORD)" : `trigger_type=eq.${event.type}`;
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_automations?status=eq.ACTIVE&${filter}&select=*&order=created_at.asc&limit=100`);
  return (rows || []).map(normalizeWhatsAppAutomationRow);
}

export async function dispatchWhatsAppAutomationEvent(event: WhatsAppAutomationEvent) {
  if ((event.depth || 0) > 10) return { started: 0, skipped: 1, failed: 0 };
  const [ctx, automations] = await Promise.all([loadContext(event), candidateAutomations(event)]);
  let started = 0; let skipped = 0; let failed = 0;
  for (const automation of automations) {
    if (ctx.ancestry.includes(automation.id)) { skipped += 1; continue; }
    if (!automationMatchesEvent(automation, event, ctx)) continue;
    const created = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_automation_runs", body: {
      automation_id: automation.id, automation_version: automation.version, status: "QUEUED", trigger_type: automation.triggerType,
      trigger_event_key: event.eventKey, contact_id: ctx.contact?.id || null, conversation_id: ctx.conversation?.id || null,
      trigger_payload: event.payload || {}, context: ctx, next_action_index: 0,
    } });
    if (!created.ok) {
      if (created.code === POSTGRES_UNIQUE_VIOLATION) { skipped += 1; continue; }
      failed += 1; continue;
    }
    const runId = text(created.rows[0]?.id); if (!runId) { failed += 1; continue; }
    if (!entryConditionsMatch(automation, ctx)) {
      skipped += 1;
      await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: { status: "SKIPPED", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
      await addEvent(runId, automation.id, "conditions_not_met", "SKIPPED");
      continue;
    }
    started += 1;
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: { status: "RUNNING", started_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    await addEvent(runId, automation.id, "run_started", "INFO", { trigger: getWhatsAppAutomationTriggerLabel(automation.triggerType) });
    await activity(ctx, "automation_started", { automationId: automation.id, automationName: automation.name, runId });
    const executionContext = { ...ctx, ancestry: [...ctx.ancestry, automation.id], depth: ctx.depth + 1 };
    const result = await executePlan(automation.actions, automation, runId, executionContext);
    await finishRun(runId, automation, executionContext, result);
    if (result.status === "FAILED") failed += 1;
  }
  return { started, skipped, failed };
}

async function processDueJobs(limit: number) {
  const now = new Date().toISOString();
  const jobs = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_automation_jobs?status=eq.PENDING&due_at=lte.${encodeURIComponent(now)}&select=*&order=due_at.asc&limit=${Math.max(1, Math.min(limit, 50))}`,
  );
  let processed = 0; let failed = 0;
  for (const job of jobs || []) {
    const jobId = text(job.id); const runId = text(job.run_id); const automationId = text(job.automation_id);
    const claimed = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_jobs?id=eq.${encodeURIComponent(jobId)}&status=eq.PENDING`, body: { status: "PROCESSING", locked_at: now, attempts: Number(job.attempts || 0) + 1, updated_at: now } });
    if (!claimed.ok || !claimed.rows.length) continue;
    const [runRows, automationRows] = await Promise.all([
      readWhatsAppRows<Record<string, unknown>>(`whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}&select=*&limit=1`),
      readWhatsAppRows<Record<string, unknown>>(`whatsapp_automations?id=eq.${encodeURIComponent(automationId)}&select=*&limit=1`),
    ]);
    const run = runRows?.[0]; const automation = automationRows?.[0] ? normalizeWhatsAppAutomationRow(automationRows[0]) : null;
    if (!run || !automation || text(run.status) === "CANCELLED") {
      await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_jobs?id=eq.${encodeURIComponent(jobId)}`, body: { status: "CANCELLED", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
      continue;
    }
    const payload = object(job.payload); const remaining = Array.isArray(payload.remainingActions) ? payload.remainingActions as WhatsAppAutomationAction[] : [];
    const ctx = payload.context as WhatsAppAutomationRuntimeContext;
    await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: { status: "RUNNING", updated_at: new Date().toISOString() } });
    const result = await executePlan(remaining, automation, runId, ctx, Number(job.action_index || 0) + 1);
    if (result.status === "FAILED") {
      const attempts = Number(job.attempts || 0) + 1; const max = Number(job.max_attempts || 5);
      if (attempts < max) {
        const due = new Date(Date.now() + Math.min(3600, 30 * 2 ** attempts) * 1000).toISOString();
        await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_jobs?id=eq.${encodeURIComponent(jobId)}`, body: { status: "PENDING", due_at: due, locked_at: null, last_error: result.error, updated_at: new Date().toISOString() } });
        await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_runs?id=eq.${encodeURIComponent(runId)}`, body: { status: "WAITING", updated_at: new Date().toISOString() } });
      } else {
        failed += 1;
        await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_jobs?id=eq.${encodeURIComponent(jobId)}`, body: { status: "FAILED", completed_at: new Date().toISOString(), last_error: result.error, updated_at: new Date().toISOString() } });
        await finishRun(runId, automation, ctx, result);
      }
    } else {
      await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_automation_jobs?id=eq.${encodeURIComponent(jobId)}`, body: { status: "SUCCEEDED", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
      await finishRun(runId, automation, ctx, result);
    }
    processed += 1;
  }
  return { processed, failed };
}

async function scanNoReplyTriggers() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_automations?status=eq.ACTIVE&trigger_type=in.(NO_CUSTOMER_REPLY,NO_AGENT_REPLY)&select=*&order=created_at.asc&limit=50",
  );
  let dispatched = 0;
  for (const raw of rows || []) {
    const automation = normalizeWhatsAppAutomationRow(raw);
    const threshold = Date.now() - seconds(text(automation.triggerConfig.unit).toUpperCase(), Number(automation.triggerConfig.amount)) * 1000;
    const conversations = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_conversations?status=eq.open&last_message_at=lte.${encodeURIComponent(new Date(threshold).toISOString())}&select=id,contact_id,last_message_at&order=last_message_at.asc&limit=100`,
    );
    for (const conversation of conversations || []) {
      const conversationId = text(conversation.id); const messages = await readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=whatsapp_message_id,direction,message_timestamp&order=message_timestamp.desc&limit=1`,
      );
      const latest = messages?.[0]; if (!latest) continue;
      const direction = text(latest.direction);
      if (automation.triggerType === "NO_AGENT_REPLY" && direction !== "inbound") continue;
      if (automation.triggerType === "NO_CUSTOMER_REPLY" && direction !== "outbound") continue;
      const at = Date.parse(text(latest.message_timestamp)); if (!Number.isFinite(at) || at > threshold) continue;
      const result = await dispatchWhatsAppAutomationEvent({
        type: automation.triggerType, eventKey: `${automation.triggerType.toLowerCase()}:${conversationId}:${text(latest.whatsapp_message_id)}`,
        contactId: text(conversation.contact_id), conversationId,
      });
      dispatched += result.started;
    }
  }
  return dispatched;
}

async function scanBusinessHours() {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_automations?status=eq.ACTIVE&trigger_type=eq.BUSINESS_HOURS&select=*&limit=50");
  if (!rows?.length) return 0;
  const { settings } = await loadWhatsAppSettings({ maxAgeMs: 0 });
  if (!settings.businessHours.enabled) return 0;
  const now = new Date(); const before = new Date(now.getTime() - 60_000);
  const current = isWhatsAppBusinessHoursOpen(settings.businessHours, now); const previous = isWhatsAppBusinessHoursOpen(settings.businessHours, before);
  if (current === null || previous === null || current === previous) return 0;
  const transition = current ? "OPENED" : "CLOSED";
  const minute = now.toISOString().slice(0, 16);
  const result = await dispatchWhatsAppAutomationEvent({ type: "BUSINESS_HOURS", eventKey: `business-hours:${transition}:${minute}`, triggerValue: transition });
  return result.started;
}

export async function processWhatsAppAutomationQueue(limit = 25) {
  const jobs = await processDueJobs(limit);
  const [noReply, businessHours] = await Promise.all([scanNoReplyTriggers(), scanBusinessHours()]);
  return { jobsProcessed: jobs.processed, jobsFailed: jobs.failed, timedRunsStarted: noReply, businessHoursRunsStarted: businessHours };
}
