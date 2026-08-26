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
  direction?: unknown;
  delivery_status?: unknown;
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

/* -------------------------------------------------------------------------- */
/* Change detection                                                           */
/* -------------------------------------------------------------------------- */

/**
 * How many of the most recent messages the poll inspects.
 *
 * Small on purpose. The inbox never needs to re-read the whole conversation list to
 * learn that something moved: a new message in either direction, or a delivery
 * receipt landing on a recent one, always shows up inside this window.
 */
export const WHATSAPP_INBOX_ACTIVITY_LIMIT = 12;

export type WhatsAppInboxActivity = {
  /** The newest inbound message, for the desktop/mobile alert. Null if none is in the window. */
  latest: WhatsAppInboxNotification | null;
  /**
   * A short digest of the recent thread state. It changes when a message arrives in
   * either direction and when a delivery status moves, and it is the only thing the
   * browser compares — so an idle inbox does no work at all.
   */
  fingerprint: string;
};

function readText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function buildWhatsAppInboxFingerprint(rows: NotificationRow[]) {
  return rows
    .map((row) =>
      [
        readText(row.whatsapp_message_id),
        readText(row.direction),
        readText(row.delivery_status),
      ].join(":"),
    )
    .join("|");
}

export function buildWhatsAppInboxActivity(rows: NotificationRow[]): WhatsAppInboxActivity {
  // The window covers both directions, so the newest inbound row has to be picked out
  // of it rather than assumed to be first.
  const newestInbound = rows.find((row) => row.direction === "inbound");
  return {
    latest: newestInbound ? buildWhatsAppInboxNotification(newestInbound) : null,
    fingerprint: buildWhatsAppInboxFingerprint(rows),
  };
}
