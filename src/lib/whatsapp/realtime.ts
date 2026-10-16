export type WhatsAppRealtimeEvent = {
  table: string;
  operation: string;
};

export type WhatsAppRealtimeFeature = "inbox" | "presence" | "collaboration" | "calls";

export const WHATSAPP_INBOX_FALLBACK_MS = 300_000;
export const WHATSAPP_PRESENCE_FALLBACK_MS = 300_000;
export const WHATSAPP_COLLABORATION_FALLBACK_MS = 60_000;
export const WHATSAPP_CALLS_FALLBACK_MS = 30_000;

const FEATURE_TABLES: Record<WhatsAppRealtimeFeature, ReadonlySet<string>> = {
  inbox: new Set(["whatsapp_conversations", "whatsapp_messages"]),
  presence: new Set(["whatsapp_team_members", "whatsapp_note_mentions", "whatsapp_internal_notes"]),
  collaboration: new Set([
    "whatsapp_internal_notes",
    "whatsapp_note_mentions",
    "whatsapp_team_activity",
    "whatsapp_conversation_presence",
    "whatsapp_team_members",
    "whatsapp_conversations",
  ]),
  calls: new Set(["whatsapp_calls"]),
};

export function isWhatsAppRealtimeEventRelevant(
  feature: WhatsAppRealtimeFeature,
  event: WhatsAppRealtimeEvent,
) {
  return FEATURE_TABLES[feature].has(event.table);
}
