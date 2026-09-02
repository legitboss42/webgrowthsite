import { classifyWhatsAppIntent } from "./classify";
import { getWhatsAppStatusesBelow, shouldApplyWhatsAppStatus } from "./messageStatus";
import { normalizeWhatsAppRecipient } from "./send";
import type { WhatsAppLeadKeywordRules } from "./settings";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

export type InboundMessageRecord = { messageId: string; waId: string; displayName?: string; text?: string; timestamp: number; type?: string; mediaId?: string; mediaMimeType?: string; mediaSha256?: string; mediaVoice?: boolean; mediaFilename?: string };
export type OutboundMessageRecord = Omit<InboundMessageRecord, "displayName"> & { conversationId?: string };
export type StoredContact = { id: string; waId: string; displayName?: string };
export type StoredConversation = { id: string; contactId: string; lastMessageAt: number };
export type StoredMessage = { id: string; messageId: string; conversationId: string; direction: "inbound" | "outbound"; messageType?: string; text?: string; timestamp: number; deliveryStatus?: string; deliveryError?: string; mediaId?: string; mediaMimeType?: string; mediaSha256?: string; mediaVoice?: boolean; mediaFilename?: string };
export type WhatsAppStore = { recordInbound(input: InboundMessageRecord): Promise<{ duplicate: boolean }>; recordOutbound(input: OutboundMessageRecord): Promise<void>; updateMessageStatus(messageId: string, status: string, error?: string): Promise<void> };

type SupabaseStoreOptions = { url: string; serviceRoleKey: string; workspaceId?: string | null; fetch?: typeof globalThis.fetch; leadKeywords?: WhatsAppLeadKeywordRules };
export type WhatsAppReplyContext = { conversationId: string; waId: string; customerMessageTimestamp: number; replyToMessageId: string };

function scopeFilter(workspaceId: string | null | undefined) { return isWhatsAppWorkspaceId(workspaceId) ? `&workspace_id=eq.${encodeURIComponent(workspaceId)}` : ""; }
function tenantBody(body: Record<string, unknown>, workspaceId: string | null | undefined) { return isWhatsAppWorkspaceId(workspaceId) ? { ...body, workspace_id: workspaceId } : body; }

export async function getSupabaseWhatsAppReplyContext(options: SupabaseStoreOptions, conversationId: string, suppliedWaId: string): Promise<WhatsAppReplyContext | null> {
  const fetcher = options.fetch || globalThis.fetch; const baseUrl = options.url.replace(/\/$/, ""); const headers = { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}` }; const suppliedRecipient = normalizeWhatsAppRecipient(suppliedWaId);
  if (!suppliedRecipient || !conversationId.trim()) return null;
  const scope = scopeFilter(options.workspaceId);
  const conversationResponse = await fetcher(`${baseUrl}/rest/v1/whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}${scope}&select=id,status,whatsapp_contacts!inner(wa_id)&limit=1`, { headers });
  if (!conversationResponse.ok) throw new Error(`Supabase WhatsApp conversation request failed: ${conversationResponse.status}`);
  const conversations = await conversationResponse.json() as Array<{ id?: string; status?: string; whatsapp_contacts?: { wa_id?: string } | Array<{ wa_id?: string }> }>;
  const conversation = conversations[0]; const contact = Array.isArray(conversation?.whatsapp_contacts) ? conversation.whatsapp_contacts[0] : conversation?.whatsapp_contacts; const actualRecipient = typeof contact?.wa_id === "string" ? normalizeWhatsAppRecipient(contact.wa_id) : null;
  if (!conversation || conversation.status !== "open" || !actualRecipient || actualRecipient !== suppliedRecipient) return null;
  const messageResponse = await fetcher(`${baseUrl}/rest/v1/whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}${scope}&direction=eq.inbound&select=whatsapp_message_id,message_timestamp&order=message_timestamp.desc&limit=1`, { headers });
  if (!messageResponse.ok) throw new Error(`Supabase WhatsApp message request failed: ${messageResponse.status}`);
  const messages = await messageResponse.json() as Array<{ whatsapp_message_id?: string; message_timestamp?: string }>;
  const latestInbound = messages[0]; const timestamp = latestInbound?.message_timestamp ? Date.parse(latestInbound.message_timestamp) : Number.NaN;
  if (!latestInbound?.whatsapp_message_id || !Number.isFinite(timestamp)) return null;
  return { conversationId: String(conversation.id), waId: actualRecipient, replyToMessageId: latestInbound.whatsapp_message_id, customerMessageTimestamp: Math.floor(timestamp / 1000) };
}

type SupabaseRow = { id: string };
export async function resolveSupabaseWhatsAppQuotedMessageId(options: SupabaseStoreOptions, conversationId: string, candidateMessageId: string | undefined): Promise<string | null> {
  const candidate = candidateMessageId?.trim(); if (!candidate || !conversationId.trim()) return null;
  const fetcher = options.fetch || globalThis.fetch;
  const response = await fetcher(`${options.url.replace(/\/$/, "")}/rest/v1/whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}${scopeFilter(options.workspaceId)}&whatsapp_message_id=eq.${encodeURIComponent(candidate)}&select=whatsapp_message_id&limit=1`, { headers: { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}` } });
  if (!response.ok) throw new Error(`Supabase WhatsApp quoted message request failed: ${response.status}`);
  const rows = await response.json() as Array<{ whatsapp_message_id?: string }>;
  const stored = rows[0]?.whatsapp_message_id; return typeof stored === "string" && stored === candidate ? stored : null;
}

export function createSupabaseWhatsAppStore(options: SupabaseStoreOptions): WhatsAppStore {
  const fetcher = options.fetch || globalThis.fetch;
  const request = async <T extends SupabaseRow>(path: string, init: RequestInit) => {
    const response = await fetcher(`${options.url.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers: { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers } });
    if (!response.ok) throw new Error(`Supabase WhatsApp store request failed: ${response.status}`);
    return await response.json() as T[];
  };
  const scoped = (path: string) => `${path}${path.includes("?") ? "&" : "?"}${isWhatsAppWorkspaceId(options.workspaceId) ? `workspace_id=eq.${encodeURIComponent(options.workspaceId)}` : ""}`.replace(/[?&]$/, "");
  const body = (value: Record<string, unknown>) => tenantBody(value, options.workspaceId);

  const getConversation = async (input: InboundMessageRecord) => {
    const classification = classifyWhatsAppIntent(input.text || "", options.leadKeywords); const nowIso = new Date().toISOString();
    const contactConflict = isWhatsAppWorkspaceId(options.workspaceId) ? "workspace_id,wa_id" : "wa_id";
    const contacts = await request<{ id: string }>(`whatsapp_contacts?on_conflict=${contactConflict}`, {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(body({ wa_id: input.waId, phone: input.waId, display_name: input.displayName, lead_temperature: classification.temperature, updated_at: nowIso })),
    });
    const contact = contacts[0]; if (!contact) throw new Error("Supabase did not return a WhatsApp contact");
    const timestamp = new Date(input.timestamp * 1000).toISOString();
    const inserted = await request<{ id: string }>("whatsapp_conversations?on_conflict=contact_id", {
      method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify(body({ contact_id: contact.id, first_message_at: timestamp, last_message_at: timestamp, intent: classification.intent, human_review_required: classification.humanReviewRequired, updated_at: nowIso })),
    });
    if (inserted[0]) return inserted[0];
    const existing = await request<{ id: string }>(scoped(`whatsapp_conversations?contact_id=eq.${encodeURIComponent(contact.id)}&select=id&limit=1`), { method: "GET" });
    const conversation = existing[0]; if (!conversation) throw new Error("Supabase did not return a WhatsApp conversation");
    const freshnessGuard = `&or=(last_message_at.is.null,last_message_at.lt.${encodeURIComponent(timestamp)})`;
    await request<{ id: string }>(scoped(`whatsapp_conversations?id=eq.${encodeURIComponent(conversation.id)}${freshnessGuard}`), { method: "PATCH", body: JSON.stringify(body({ last_message_at: timestamp, intent: classification.intent, human_review_required: classification.humanReviewRequired, updated_at: nowIso })) });
    return conversation;
  };

  return {
    async recordInbound(input) {
      const eventRows = await request<{ id: string }>("whatsapp_events?on_conflict=meta_event_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(body({ meta_event_id: input.messageId, event_type: "incoming_message", payload: { message_id: input.messageId }, processed: false })) });
      if (!eventRows[0]) return { duplicate: true };
      const conversation = await getConversation(input);
      await request<{ id: string }>("whatsapp_messages?on_conflict=whatsapp_message_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(body({ conversation_id: conversation.id, whatsapp_message_id: input.messageId, direction: "inbound", message_type: input.type || "text", message_text: input.text, message_timestamp: new Date(input.timestamp * 1000).toISOString(), raw_event_reference: eventRows[0].id, media_id: input.mediaId, media_mime_type: input.mediaMimeType, media_sha256: input.mediaSha256, media_voice: input.mediaVoice === true, media_filename: input.mediaFilename })) });
      await request<{ id: string }>(scoped(`whatsapp_events?id=eq.${encodeURIComponent(eventRows[0].id)}`), { method: "PATCH", body: JSON.stringify(body({ processed: true })) });
      return { duplicate: false };
    },
    async recordOutbound(input) {
      const timestamp = new Date(input.timestamp * 1000).toISOString(); const conversation = input.conversationId ? { id: input.conversationId } : await getConversation(input);
      if (input.conversationId) {
        const freshnessGuard = `&or=(last_message_at.is.null,last_message_at.lt.${encodeURIComponent(timestamp)})`;
        await request<{ id: string }>(scoped(`whatsapp_conversations?id=eq.${encodeURIComponent(input.conversationId)}${freshnessGuard}`), { method: "PATCH", body: JSON.stringify(body({ last_message_at: timestamp, updated_at: new Date().toISOString() })) });
      }
      await request<{ id: string }>("whatsapp_messages?on_conflict=whatsapp_message_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(body({ conversation_id: conversation.id, whatsapp_message_id: input.messageId, direction: "outbound", message_type: input.type || "text", message_text: input.text, message_timestamp: timestamp, delivery_status: "accepted", media_id: input.mediaId, media_mime_type: input.mediaMimeType, media_sha256: input.mediaSha256, media_voice: input.mediaVoice === true, media_filename: input.mediaFilename })) });
    },
    async updateMessageStatus(messageId, status, error) {
      const overwritable = getWhatsAppStatusesBelow(status); const guard = overwritable.length ? `&or=(delivery_status.is.null,delivery_status.in.(${overwritable.join(",")}))` : "&delivery_status.is.null"; const path = scoped(`whatsapp_messages?whatsapp_message_id=eq.${encodeURIComponent(messageId)}${guard}`);
      if (error) { try { await request<{ id: string }>(path, { method: "PATCH", body: JSON.stringify(body({ delivery_status: status, delivery_error: error })) }); return; } catch { console.warn("WhatsApp delivery_error column unavailable; storing the status only"); } }
      await request<{ id: string }>(path, { method: "PATCH", body: JSON.stringify(body({ delivery_status: status })) });
    },
  };
}

export function createMemoryWhatsAppStore(): WhatsAppStore & { events: string[]; contacts: StoredContact[]; conversations: StoredConversation[]; messages: StoredMessage[] } {
  const events: string[] = []; const contacts: StoredContact[] = []; const conversations: StoredConversation[] = []; const messages: StoredMessage[] = [];
  const getConversation = (waId: string, timestamp: number, displayName?: string) => { let contact = contacts.find((item) => item.waId === waId); if (!contact) { contact = { id: `contact-${contacts.length + 1}`, waId, displayName }; contacts.push(contact); } let conversation = conversations.find((item) => item.contactId === contact?.id); if (!conversation) { conversation = { id: `conversation-${conversations.length + 1}`, contactId: contact.id, lastMessageAt: timestamp }; conversations.push(conversation); } conversation.lastMessageAt = Math.max(conversation.lastMessageAt, timestamp); return conversation; };
  return {
    events, contacts, conversations, messages,
    async recordInbound(input) { if (events.includes(input.messageId)) return { duplicate: true }; events.push(input.messageId); const conversation = getConversation(input.waId, input.timestamp, input.displayName); messages.push({ id: `message-${messages.length + 1}`, messageId: input.messageId, conversationId: conversation.id, direction: "inbound", messageType: input.type || "text", text: input.text, timestamp: input.timestamp, mediaId: input.mediaId, mediaMimeType: input.mediaMimeType, mediaSha256: input.mediaSha256, mediaVoice: input.mediaVoice === true, mediaFilename: input.mediaFilename }); return { duplicate: false }; },
    async recordOutbound(input) { if (messages.some((item) => item.messageId === input.messageId)) return; const conversation = input.conversationId ? conversations.find((item) => item.id === input.conversationId) || getConversation(input.waId, input.timestamp) : getConversation(input.waId, input.timestamp); conversation.lastMessageAt = Math.max(conversation.lastMessageAt, input.timestamp); messages.push({ id: `message-${messages.length + 1}`, messageId: input.messageId, conversationId: conversation.id, direction: "outbound", messageType: input.type || "text", text: input.text, timestamp: input.timestamp, deliveryStatus: "accepted", mediaId: input.mediaId, mediaMimeType: input.mediaMimeType, mediaSha256: input.mediaSha256, mediaVoice: input.mediaVoice === true, mediaFilename: input.mediaFilename }); },
    async updateMessageStatus(messageId, status, error) { const message = messages.find((item) => item.messageId === messageId); if (!message || !shouldApplyWhatsAppStatus(message.deliveryStatus, status)) return; message.deliveryStatus = status; if (error) message.deliveryError = error; },
  };
}
