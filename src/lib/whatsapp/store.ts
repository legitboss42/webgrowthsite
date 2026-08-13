export type InboundMessageRecord = {
  messageId: string;
  waId: string;
  displayName?: string;
  text?: string;
  timestamp: number;
};

export type StoredContact = { id: string; waId: string; displayName?: string };
export type StoredConversation = { id: string; contactId: string; lastMessageAt: number };
export type StoredMessage = {
  id: string;
  messageId: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  text?: string;
  timestamp: number;
  deliveryStatus?: string;
};

export type WhatsAppStore = {
  recordInbound(input: InboundMessageRecord): Promise<{ duplicate: boolean }>;
  recordOutbound(input: Omit<InboundMessageRecord, "displayName">): Promise<void>;
  updateMessageStatus(messageId: string, status: string): Promise<void>;
};

type SupabaseStoreOptions = {
  url: string;
  serviceRoleKey: string;
  fetch?: typeof globalThis.fetch;
};

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
    const contacts = await request<{ id: string }>("whatsapp_contacts?on_conflict=wa_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ wa_id: input.waId, phone: input.waId, display_name: input.displayName, updated_at: new Date().toISOString() }),
    });
    const contact = contacts[0];
    if (!contact) throw new Error("Supabase did not return a WhatsApp contact");
    const timestamp = new Date(input.timestamp * 1000).toISOString();
    const conversations = await request<{ id: string }>("whatsapp_conversations?on_conflict=contact_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ contact_id: contact.id, first_message_at: timestamp, last_message_at: timestamp, updated_at: new Date().toISOString() }),
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
        body: JSON.stringify({ conversation_id: conversation.id, whatsapp_message_id: input.messageId, direction: "inbound", message_type: "text", message_text: input.text, message_timestamp: new Date(input.timestamp * 1000).toISOString(), raw_event_reference: eventRows[0].id }),
      });
      await request<{ id: string }>(`whatsapp_events?id=eq.${encodeURIComponent(eventRows[0].id)}`, { method: "PATCH", body: JSON.stringify({ processed: true }) });
      return { duplicate: false };
    },
    async recordOutbound(input) {
      const conversation = await getConversation(input);
      await request<{ id: string }>("whatsapp_messages?on_conflict=whatsapp_message_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ conversation_id: conversation.id, whatsapp_message_id: input.messageId, direction: "outbound", message_type: "text", message_text: input.text, message_timestamp: new Date(input.timestamp * 1000).toISOString() }),
      });
    },
    async updateMessageStatus(messageId, status) {
      await request<{ id: string }>(`whatsapp_messages?whatsapp_message_id=eq.${encodeURIComponent(messageId)}`, { method: "PATCH", body: JSON.stringify({ delivery_status: status }) });
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
      messages.push({ id: `message-${messages.length + 1}`, messageId: input.messageId, conversationId: conversation.id, direction: "inbound", text: input.text, timestamp: input.timestamp });
      return { duplicate: false };
    },
    async recordOutbound(input) {
      if (messages.some((item) => item.messageId === input.messageId)) return;
      const conversation = getConversation(input.waId, input.timestamp);
      messages.push({ id: `message-${messages.length + 1}`, messageId: input.messageId, conversationId: conversation.id, direction: "outbound", text: input.text, timestamp: input.timestamp });
    },
    async updateMessageStatus(messageId, status) {
      const message = messages.find((item) => item.messageId === messageId);
      if (message) message.deliveryStatus = status;
    },
  };
}
