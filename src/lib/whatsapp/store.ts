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
