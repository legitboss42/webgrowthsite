import { classifyWhatsAppIntent } from "./classify";
import { getWhatsAppStatusesBelow, shouldApplyWhatsAppStatus } from "./messageStatus";
import { normalizeWhatsAppRecipient } from "./send";
import type { WhatsAppLeadKeywordRules } from "./settings";

export type InboundMessageRecord = {
  messageId: string;
  waId: string;
  displayName?: string;
  text?: string;
  timestamp: number;
  type?: string;
  mediaId?: string;
  mediaMimeType?: string;
  mediaSha256?: string;
  mediaVoice?: boolean;
  mediaFilename?: string;
};

export type OutboundMessageRecord = Omit<InboundMessageRecord, "displayName"> & {
  conversationId?: string;
};

export type StoredContact = { id: string; waId: string; displayName?: string };
export type StoredConversation = { id: string; contactId: string; lastMessageAt: number };
export type StoredMessage = {
  id: string;
  messageId: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  messageType?: string;
  text?: string;
  timestamp: number;
  deliveryStatus?: string;
  deliveryError?: string;
  mediaId?: string;
  mediaMimeType?: string;
  mediaSha256?: string;
  mediaVoice?: boolean;
  mediaFilename?: string;
};

export type WhatsAppStore = {
  recordInbound(input: InboundMessageRecord): Promise<{ duplicate: boolean }>;
  recordOutbound(input: OutboundMessageRecord): Promise<void>;
  /**
   * Records a delivery status. Only ever moves forward: an out-of-order webhook
   * cannot walk `delivered` back to `sent`, and nothing can un-fail a failed message.
   * `error` is an already-sanitized sentence, never a provider payload.
   */
  updateMessageStatus(messageId: string, status: string, error?: string): Promise<void>;
};

type SupabaseStoreOptions = {
  url: string;
  serviceRoleKey: string;
  fetch?: typeof globalThis.fetch;
  /**
   * Operator keyword rules from the Settings page. Optional: without them the
   * store classifies exactly as it did before settings existed.
   */
  leadKeywords?: WhatsAppLeadKeywordRules;
};

export type WhatsAppReplyContext = {
  conversationId: string;
  waId: string;
  customerMessageTimestamp: number;
  replyToMessageId: string;
};

export async function getSupabaseWhatsAppReplyContext(
  options: SupabaseStoreOptions,
  conversationId: string,
  suppliedWaId: string,
): Promise<WhatsAppReplyContext | null> {
  const fetcher = options.fetch || globalThis.fetch;
  const baseUrl = options.url.replace(/\/$/, "");
  const headers = { apikey: options.serviceRoleKey, Authorization: `Bearer ${options.serviceRoleKey}` };
  const suppliedRecipient = normalizeWhatsAppRecipient(suppliedWaId);
  if (!suppliedRecipient || !conversationId.trim()) return null;

  const conversationResponse = await fetcher(
    `${baseUrl}/rest/v1/whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,status,whatsapp_contacts!inner(wa_id)&limit=1`,
    { headers },
  );
  if (!conversationResponse.ok) throw new Error(`Supabase WhatsApp conversation request failed: ${conversationResponse.status}`);
  const conversations = (await conversationResponse.json()) as Array<{ id?: string; status?: string; whatsapp_contacts?: { wa_id?: string } | Array<{ wa_id?: string }> }>;
  const conversation = conversations[0];
  const contact = Array.isArray(conversation?.whatsapp_contacts) ? conversation?.whatsapp_contacts[0] : conversation?.whatsapp_contacts;
  const actualRecipient = typeof contact?.wa_id === "string" ? normalizeWhatsAppRecipient(contact.wa_id) : null;
  if (!conversation || conversation.status !== "open" || !actualRecipient || actualRecipient !== suppliedRecipient) return null;

  const messageResponse = await fetcher(
    `${baseUrl}/rest/v1/whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&direction=eq.inbound&select=whatsapp_message_id,message_timestamp&order=message_timestamp.desc&limit=1`,
    { headers },
  );
  if (!messageResponse.ok) throw new Error(`Supabase WhatsApp message request failed: ${messageResponse.status}`);
  const messages = (await messageResponse.json()) as Array<{ whatsapp_message_id?: string; message_timestamp?: string }>;
  const latestInbound = messages[0];
  const timestamp = latestInbound?.message_timestamp ? Date.parse(latestInbound.message_timestamp) : Number.NaN;
  if (!latestInbound?.whatsapp_message_id || !Number.isFinite(timestamp)) return null;

  return {
    conversationId: String(conversation.id),
    waId: actualRecipient,
    replyToMessageId: latestInbound.whatsapp_message_id,
    customerMessageTimestamp: Math.floor(timestamp / 1000),
  };
}

type SupabaseRow = { id: string };

export function createSupabaseWhatsAppStore(options: SupabaseStoreOptions): WhatsAppStore {
  const fetcher = options.fetch || globalThis.fetch;
  const request = async <T extends SupabaseRow>(path: string, init: RequestInit) => {
    const response = await fetcher(`${options.url.replace(/\/$/, "")}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: options.serviceRoleKey,
        Authorization: `Bearer ${options.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`Supabase WhatsApp store request failed: ${response.status}`);
    return (await response.json()) as T[];
  };

  const getConversation = async (input: InboundMessageRecord) => {
    const classification = classifyWhatsAppIntent(input.text || "", options.leadKeywords);
    const contacts = await request<{ id: string }>("whatsapp_contacts?on_conflict=wa_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ wa_id: input.waId, phone: input.waId, display_name: input.displayName, lead_temperature: classification.temperature, updated_at: new Date().toISOString() }),
    });
    const contact = contacts[0];
    if (!contact) throw new Error("Supabase did not return a WhatsApp contact");
    const timestamp = new Date(input.timestamp * 1000).toISOString();
    const conversations = await request<{ id: string }>("whatsapp_conversations?on_conflict=contact_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ contact_id: contact.id, first_message_at: timestamp, last_message_at: timestamp, intent: classification.intent, human_review_required: classification.humanReviewRequired, updated_at: new Date().toISOString() }),
    });
    const conversation = conversations[0];
    if (!conversation) throw new Error("Supabase did not return a WhatsApp conversation");
    return conversation;
  };

  return {
    async recordInbound(input) {
      const eventRows = await request<{ id: string }>("whatsapp_events?on_conflict=meta_event_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ meta_event_id: input.messageId, event_type: "incoming_message", payload: { message_id: input.messageId }, processed: false }),
      });
      if (!eventRows[0]) return { duplicate: true };
      const conversation = await getConversation(input);
      await request<{ id: string }>("whatsapp_messages?on_conflict=whatsapp_message_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          conversation_id: conversation.id,
          whatsapp_message_id: input.messageId,
          direction: "inbound",
          message_type: input.type || "text",
          message_text: input.text,
          message_timestamp: new Date(input.timestamp * 1000).toISOString(),
          raw_event_reference: eventRows[0].id,
          media_id: input.mediaId,
          media_mime_type: input.mediaMimeType,
          media_sha256: input.mediaSha256,
          media_voice: input.mediaVoice === true,
          media_filename: input.mediaFilename,
        }),
      });
      await request<{ id: string }>(`whatsapp_events?id=eq.${encodeURIComponent(eventRows[0].id)}`, { method: "PATCH", body: JSON.stringify({ processed: true }) });
      return { duplicate: false };
    },
    async recordOutbound(input) {
      const timestamp = new Date(input.timestamp * 1000).toISOString();
      const conversation = input.conversationId
        ? { id: input.conversationId }
        : await getConversation(input);
      if (input.conversationId) {
        await request<{ id: string }>(`whatsapp_conversations?id=eq.${encodeURIComponent(input.conversationId)}`, {
          method: "PATCH",
          body: JSON.stringify({ last_message_at: timestamp, updated_at: new Date().toISOString() }),
        });
      }
      await request<{ id: string }>("whatsapp_messages?on_conflict=whatsapp_message_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({
          conversation_id: conversation.id,
          whatsapp_message_id: input.messageId,
          direction: "outbound",
          message_type: input.type || "text",
          message_text: input.text,
          message_timestamp: timestamp,
          // Ours, not Meta's: the Cloud API accepted the message and gave us an id.
          // Ranked below `sent`, so the first real webhook supersedes it. Without this
          // an outbound message would sit with no status at all until a webhook lands.
          delivery_status: "accepted",
          media_id: input.mediaId,
          media_mime_type: input.mediaMimeType,
          media_sha256: input.mediaSha256,
          media_voice: input.mediaVoice === true,
          media_filename: input.mediaFilename,
        }),
      });
    },
    async updateMessageStatus(messageId, status, error) {
      // Expressed as one conditional PATCH rather than a read followed by a write, so
      // two webhooks arriving together cannot interleave and lose an update. The
      // filter is the guard: rows already at or beyond `status` simply do not match.
      const overwritable = getWhatsAppStatusesBelow(status);
      const guard = overwritable.length
        ? `&or=(delivery_status.is.null,delivery_status.in.(${overwritable.join(",")}))`
        : "&delivery_status.is.null";
      const path = `whatsapp_messages?whatsapp_message_id=eq.${encodeURIComponent(messageId)}${guard}`;

      if (error) {
        try {
          await request<{ id: string }>(path, {
            method: "PATCH",
            body: JSON.stringify({ delivery_status: status, delivery_error: error }),
          });
          return;
        } catch {
          // `delivery_error` is an additive migration and may not have been applied on
          // this deployment yet. The status is the part that matters, so fall through
          // and store it alone rather than dropping the webhook entirely.
          console.warn("WhatsApp delivery_error column unavailable; storing the status only");
        }
      }

      await request<{ id: string }>(path, {
        method: "PATCH",
        body: JSON.stringify({ delivery_status: status }),
      });
    },
  };
}

export function createMemoryWhatsAppStore(): WhatsAppStore & {
  events: string[];
  contacts: StoredContact[];
  conversations: StoredConversation[];
  messages: StoredMessage[];
} {
  const events: string[] = [];
  const contacts: StoredContact[] = [];
  const conversations: StoredConversation[] = [];
  const messages: StoredMessage[] = [];

  const getConversation = (waId: string, timestamp: number, displayName?: string) => {
    let contact = contacts.find((item) => item.waId === waId);
    if (!contact) {
      contact = { id: `contact-${contacts.length + 1}`, waId, displayName };
      contacts.push(contact);
    }
    let conversation = conversations.find((item) => item.contactId === contact?.id);
    if (!conversation) {
      conversation = { id: `conversation-${conversations.length + 1}`, contactId: contact.id, lastMessageAt: timestamp };
      conversations.push(conversation);
    }
    conversation.lastMessageAt = Math.max(conversation.lastMessageAt, timestamp);
    return conversation;
  };

  return {
    events,
    contacts,
    conversations,
    messages,
    async recordInbound(input) {
      if (events.includes(input.messageId)) return { duplicate: true };
      events.push(input.messageId);
      const conversation = getConversation(input.waId, input.timestamp, input.displayName);
      messages.push({
        id: `message-${messages.length + 1}`,
        messageId: input.messageId,
        conversationId: conversation.id,
        direction: "inbound",
        messageType: input.type || "text",
        text: input.text,
        timestamp: input.timestamp,
        mediaId: input.mediaId,
        mediaMimeType: input.mediaMimeType,
        mediaSha256: input.mediaSha256,
        mediaVoice: input.mediaVoice === true,
        mediaFilename: input.mediaFilename,
      });
      return { duplicate: false };
    },
    async recordOutbound(input) {
      if (messages.some((item) => item.messageId === input.messageId)) return;
      const conversation = input.conversationId
        ? conversations.find((item) => item.id === input.conversationId) || getConversation(input.waId, input.timestamp)
        : getConversation(input.waId, input.timestamp);
      conversation.lastMessageAt = Math.max(conversation.lastMessageAt, input.timestamp);
      messages.push({
        id: `message-${messages.length + 1}`,
        messageId: input.messageId,
        conversationId: conversation.id,
        direction: "outbound",
        messageType: input.type || "text",
        text: input.text,
        timestamp: input.timestamp,
        deliveryStatus: "accepted",
        mediaId: input.mediaId,
        mediaMimeType: input.mediaMimeType,
        mediaSha256: input.mediaSha256,
        mediaVoice: input.mediaVoice === true,
        mediaFilename: input.mediaFilename,
      });
    },
    async updateMessageStatus(messageId, status, error) {
      const message = messages.find((item) => item.messageId === messageId);
      // The same forward-only rule the Supabase store enforces in its PATCH filter.
      if (!message || !shouldApplyWhatsAppStatus(message.deliveryStatus, status)) return;
      message.deliveryStatus = status;
      if (error) message.deliveryError = error;
    },
  };
}
