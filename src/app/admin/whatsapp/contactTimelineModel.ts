export type WhatsAppContactTimelineKind = "message" | "call" | "activity";

export type WhatsAppContactTimelineItem = {
  id: string;
  kind: WhatsAppContactTimelineKind;
  timestamp: string;
  title: string;
  detail?: string;
  direction?: "inbound" | "outbound";
  status?: string;
  actor?: string;
};

type TimelineInput = {
  messages?: Array<Record<string, unknown>> | null;
  calls?: Array<Record<string, unknown>> | null;
  activities?: Array<Record<string, unknown>> | null;
};

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function timestamp(value: unknown) {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : undefined;
}

function messageLabel(row: Record<string, unknown>) {
  const body = text(row.message_text);
  if (body) return body.length > 220 ? `${body.slice(0, 217)}…` : body;
  const type = text(row.message_type) || "message";
  const filename = text(row.media_filename);
  if (filename) return `${type}: ${filename}`;
  if (type === "audio" && row.media_voice === true) return "Voice note";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function callDetail(row: Record<string, unknown>) {
  const parts: string[] = [];
  const status = text(row.status);
  if (status) parts.push(status.replaceAll("_", " "));
  const seconds = typeof row.duration_seconds === "number" ? row.duration_seconds : Number.NaN;
  if (Number.isFinite(seconds)) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    parts.push(minutes ? `${minutes}m ${remainder}s` : `${remainder}s`);
  }
  return parts.join(" · ") || undefined;
}

function activityCopy(row: Record<string, unknown>) {
  const type = text(row.event_type) || "activity";
  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};

  if (type === "conversation_reply_sent" || type === "availability_changed") return null;
  if (type === "contact_created") return { title: "Contact created", detail: "CRM record created." };
  if (type === "contact_updated") {
    const fields = Array.isArray(metadata.fields)
      ? metadata.fields.filter((value): value is string => typeof value === "string")
      : [];
    return {
      title: "Contact updated",
      detail: fields.length ? `Changed: ${fields.join(", ")}` : "CRM profile changed.",
    };
  }
  if (type === "conversation_assigned") return { title: "Conversation assigned", detail: "A team member took ownership of this conversation." };
  if (type === "conversation_reassigned") return { title: "Conversation reassigned", detail: "Conversation ownership changed." };
  if (type === "conversation_unassigned") return { title: "Conversation unassigned", detail: "Conversation returned to the unassigned inbox." };
  if (type === "internal_note_created") return { title: "Internal note added", detail: "A private team note was added to the conversation." };

  return {
    title: type.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
    detail: undefined,
  };
}

export function buildWhatsAppContactTimeline(input: TimelineInput): WhatsAppContactTimelineItem[] {
  const items: WhatsAppContactTimelineItem[] = [];

  for (const row of input.messages || []) {
    const at = timestamp(row.message_timestamp);
    const id = text(row.id) || text(row.whatsapp_message_id);
    if (!at || !id) continue;
    const direction = row.direction === "outbound" ? "outbound" : "inbound";
    items.push({
      id: `message:${id}`,
      kind: "message",
      timestamp: at,
      title: direction === "outbound" ? "Message sent" : "Message received",
      detail: messageLabel(row),
      direction,
      status: text(row.delivery_status),
    });
  }

  for (const row of input.calls || []) {
    const at = timestamp(row.started_at) || timestamp(row.last_event_at);
    const id = text(row.call_id);
    if (!at || !id) continue;
    const direction = row.direction === "outbound" ? "outbound" : "inbound";
    items.push({
      id: `call:${id}`,
      kind: "call",
      timestamp: at,
      title: direction === "outbound" ? "Outgoing WhatsApp call" : "Incoming WhatsApp call",
      detail: callDetail(row),
      direction,
      status: text(row.status),
    });
  }

  const seenActivity = new Set<string>();
  for (const row of input.activities || []) {
    const rawId = text(row.id);
    const at = timestamp(row.created_at);
    const copy = activityCopy(row);
    if (!rawId || !at || !copy || seenActivity.has(rawId)) continue;
    seenActivity.add(rawId);
    items.push({
      id: `activity:${rawId}`,
      kind: "activity",
      timestamp: at,
      title: copy.title,
      detail: copy.detail,
      actor: text(row.actor_email),
    });
  }

  return items.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
