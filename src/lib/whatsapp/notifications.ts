export type WhatsAppInboxNotification = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
};

type NotificationRow = {
  whatsapp_message_id?: unknown;
  message_text?: unknown;
  message_timestamp?: unknown;
  whatsapp_conversations?: {
    whatsapp_contacts?: {
      display_name?: unknown;
      wa_id?: unknown;
    } | Array<{
      display_name?: unknown;
      wa_id?: unknown;
    }>;
  } | Array<{
    whatsapp_contacts?: {
      display_name?: unknown;
      wa_id?: unknown;
    } | Array<{
      display_name?: unknown;
      wa_id?: unknown;
    }>;
  }>;
};

function first<T>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trimPreview(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
}

export function buildWhatsAppInboxNotification(row: NotificationRow): WhatsAppInboxNotification | null {
  const id = typeof row.whatsapp_message_id === "string" ? row.whatsapp_message_id.trim() : "";
  const receivedAt = typeof row.message_timestamp === "string" ? row.message_timestamp : "";
  if (!id || !receivedAt) return null;

  const conversation = first(row.whatsapp_conversations);
  const contact = first(conversation?.whatsapp_contacts);
  const name =
    typeof contact?.display_name === "string" && contact.display_name.trim()
      ? contact.display_name.trim()
      : typeof contact?.wa_id === "string" && contact.wa_id.trim()
        ? contact.wa_id.trim()
        : "WhatsApp lead";
  const body = typeof row.message_text === "string" && row.message_text.trim()
    ? trimPreview(row.message_text)
    : "New inbound WhatsApp message";

  return {
    id,
    title: `New WhatsApp message from ${name}`,
    body,
    receivedAt,
  };
}

export function shouldShowWhatsAppInboxNotification(
  previousLatestMessageId: string | undefined,
  latest: WhatsAppInboxNotification | null,
) {
  return Boolean(previousLatestMessageId && latest && latest.id !== previousLatestMessageId);
}
