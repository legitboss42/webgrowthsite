export type WhatsAppSegmentJoin = "AND" | "OR";
export type WhatsAppSegmentOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "EXISTS"
  | "NOT_EXISTS"
  | "BEFORE"
  | "AFTER";

export type WhatsAppSegmentCondition = {
  field: string;
  operator: WhatsAppSegmentOperator;
  value?: string;
};

export type WhatsAppSegment = {
  id: string;
  name: string;
  description: string;
  conditionJoin: WhatsAppSegmentJoin;
  conditions: WhatsAppSegmentCondition[];
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppCampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type WhatsAppCampaign = {
  id: string;
  name: string;
  description: string;
  status: WhatsAppCampaignStatus;
  segmentId?: string;
  audienceSnapshot: Record<string, unknown>;
  templateId: string;
  templateName: string;
  templateLanguage: string;
  templateCategory?: string;
  templateSnapshot: Record<string, unknown>;
  variableMappings: Record<string, string>;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
  audienceCount: number;
  eligibleCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  skippedCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppCampaignContact = {
  id: string;
  waId: string;
  phone?: string;
  displayName?: string;
  businessName?: string;
  email?: string;
  source?: string;
  leadStage?: string;
  leadTemperature?: string;
  tags: string[];
  customFields: Record<string, string>;
  optInStatus: "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";
  optInAt?: string;
  optOutAt?: string;
  lifecycle?: string;
  lastMessageAt?: string;
  assignedMemberId?: string;
};

const OPERATORS: WhatsAppSegmentOperator[] = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "EXISTS",
  "NOT_EXISTS",
  "BEFORE",
  "AFTER",
];

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringRecord(value: unknown) {
  return Object.fromEntries(
    Object.entries(record(value))
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, item]) => [key, item.trim()]),
  );
}

export function normalizeWhatsAppSegmentCondition(value: unknown): WhatsAppSegmentCondition | null {
  const row = record(value);
  const field = text(row.field, 120);
  const operator = OPERATORS.includes(row.operator as WhatsAppSegmentOperator)
    ? (row.operator as WhatsAppSegmentOperator)
    : null;
  if (!field || !operator) return null;
  const condition: WhatsAppSegmentCondition = { field, operator };
  const nextValue = text(row.value, 500);
  if (nextValue) condition.value = nextValue;
  return condition;
}

export function validateWhatsAppSegmentInput(raw: Record<string, unknown>) {
  const name = text(raw.name, 100);
  const description = text(raw.description, 500);
  const conditionJoin: WhatsAppSegmentJoin = raw.conditionJoin === "OR" ? "OR" : "AND";
  const conditions = Array.isArray(raw.conditions)
    ? raw.conditions.map(normalizeWhatsAppSegmentCondition).filter((item): item is WhatsAppSegmentCondition => Boolean(item))
    : [];
  if (!name) return { ok: false as const, error: "Audience name is required." };
  if (conditions.length > 20) return { ok: false as const, error: "Use at most 20 audience conditions." };
  return { ok: true as const, value: { name, description, conditionJoin, conditions } };
}

export function normalizeWhatsAppSegmentRow(row: Record<string, unknown>): WhatsAppSegment {
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    description: typeof row.description === "string" ? row.description : "",
    conditionJoin: row.condition_join === "OR" ? "OR" : "AND",
    conditions: Array.isArray(row.conditions)
      ? row.conditions.map(normalizeWhatsAppSegmentCondition).filter((item): item is WhatsAppSegmentCondition => Boolean(item))
      : [],
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function normalizeWhatsAppCampaignRow(row: Record<string, unknown>): WhatsAppCampaign {
  const status = String(row.status || "DRAFT").toUpperCase() as WhatsAppCampaignStatus;
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    description: typeof row.description === "string" ? row.description : "",
    status,
    segmentId: typeof row.segment_id === "string" ? row.segment_id : undefined,
    audienceSnapshot: record(row.audience_snapshot),
    templateId: String(row.template_id || ""),
    templateName: String(row.template_name || ""),
    templateLanguage: String(row.template_language || "en_US"),
    templateCategory: typeof row.template_category === "string" ? row.template_category : undefined,
    templateSnapshot: record(row.template_snapshot),
    variableMappings: stringRecord(row.variable_mappings),
    scheduledAt: typeof row.scheduled_at === "string" ? row.scheduled_at : undefined,
    startedAt: typeof row.started_at === "string" ? row.started_at : undefined,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : undefined,
    pausedAt: typeof row.paused_at === "string" ? row.paused_at : undefined,
    cancelledAt: typeof row.cancelled_at === "string" ? row.cancelled_at : undefined,
    audienceCount: Math.max(0, Number(row.audience_count) || 0),
    eligibleCount: Math.max(0, Number(row.eligible_count) || 0),
    sentCount: Math.max(0, Number(row.sent_count) || 0),
    deliveredCount: Math.max(0, Number(row.delivered_count) || 0),
    readCount: Math.max(0, Number(row.read_count) || 0),
    repliedCount: Math.max(0, Number(row.replied_count) || 0),
    failedCount: Math.max(0, Number(row.failed_count) || 0),
    skippedCount: Math.max(0, Number(row.skipped_count) || 0),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function normalizeWhatsAppCampaignContact(row: Record<string, unknown>): WhatsAppCampaignContact {
  const conversationRaw = row.whatsapp_conversations;
  const conversation = Array.isArray(conversationRaw)
    ? record(conversationRaw[0])
    : record(conversationRaw);
  return {
    id: String(row.id || ""),
    waId: String(row.wa_id || ""),
    phone: typeof row.phone === "string" ? row.phone : undefined,
    displayName: typeof row.display_name === "string" ? row.display_name : undefined,
    businessName: typeof row.business_name === "string" ? row.business_name : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    source: typeof row.source === "string" ? row.source : undefined,
    leadStage: typeof row.lead_stage === "string" ? row.lead_stage : undefined,
    leadTemperature: typeof row.lead_temperature === "string" ? row.lead_temperature : undefined,
    tags: Array.isArray(row.tags) ? row.tags.filter((item): item is string => typeof item === "string") : [],
    customFields: stringRecord(row.custom_fields),
    optInStatus: row.opt_in_status === "OPTED_IN" || row.opt_in_status === "OPTED_OUT" ? row.opt_in_status : "UNKNOWN",
    optInAt: typeof row.opt_in_at === "string" ? row.opt_in_at : undefined,
    optOutAt: typeof row.opt_out_at === "string" ? row.opt_out_at : undefined,
    lifecycle: typeof conversation.status === "string" ? conversation.status : undefined,
    lastMessageAt: typeof conversation.last_message_at === "string" ? conversation.last_message_at : undefined,
    assignedMemberId: typeof conversation.assigned_member_id === "string" ? conversation.assigned_member_id : undefined,
  };
}

function fieldValue(contact: WhatsAppCampaignContact, field: string): string | string[] | undefined {
  if (field.startsWith("custom.")) return contact.customFields[field.slice(7)];
  if (field === "tags") return contact.tags;
  if (field === "lead_stage") return contact.leadStage;
  if (field === "lead_temperature") return contact.leadTemperature;
  if (field === "source") return contact.source;
  if (field === "opt_in_status") return contact.optInStatus;
  if (field === "lifecycle") return contact.lifecycle;
  if (field === "assigned_member_id") return contact.assignedMemberId;
  if (field === "last_message_at") return contact.lastMessageAt;
  if (field === "email") return contact.email;
  if (field === "company") return contact.businessName;
  if (field === "name") return contact.displayName;
  return undefined;
}

function compareCondition(contact: WhatsAppCampaignContact, condition: WhatsAppSegmentCondition) {
  const current = fieldValue(contact, condition.field);
  const target = (condition.value || "").trim();
  const list = Array.isArray(current) ? current : current === undefined ? [] : [String(current)];
  const lowered = list.map((item) => item.toLowerCase());
  const targetLower = target.toLowerCase();

  if (condition.operator === "EXISTS") return list.some((item) => item.trim().length > 0);
  if (condition.operator === "NOT_EXISTS") return !list.some((item) => item.trim().length > 0);
  if (condition.operator === "EQUALS") return lowered.some((item) => item === targetLower);
  if (condition.operator === "NOT_EQUALS") return !lowered.some((item) => item === targetLower);
  if (condition.operator === "CONTAINS") return lowered.some((item) => item.includes(targetLower));
  if (condition.operator === "NOT_CONTAINS") return !lowered.some((item) => item.includes(targetLower));

  const currentDate = list[0] ? Date.parse(list[0]) : Number.NaN;
  const targetDate = Date.parse(target);
  if (!Number.isFinite(currentDate) || !Number.isFinite(targetDate)) return false;
  if (condition.operator === "BEFORE") return currentDate < targetDate;
  if (condition.operator === "AFTER") return currentDate > targetDate;
  return false;
}

export function matchesWhatsAppSegment(
  contact: WhatsAppCampaignContact,
  conditions: WhatsAppSegmentCondition[],
  join: WhatsAppSegmentJoin,
) {
  if (!conditions.length) return true;
  const results = conditions.map((condition) => compareCondition(contact, condition));
  return join === "OR" ? results.some(Boolean) : results.every(Boolean);
}

export function isValidWhatsAppCampaignRecipient(waId: string) {
  const digits = waId.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function getWhatsAppCampaignEligibility(contact: WhatsAppCampaignContact) {
  if (contact.optInStatus === "OPTED_OUT") return { eligible: false, reason: "OPTED_OUT" } as const;
  if (contact.optInStatus !== "OPTED_IN") return { eligible: false, reason: "CONSENT_REQUIRED" } as const;
  if (!isValidWhatsAppCampaignRecipient(contact.waId)) return { eligible: false, reason: "INVALID_NUMBER" } as const;
  return { eligible: true, reason: null } as const;
}

export function firstName(displayName: string | undefined) {
  return (displayName || "").trim().split(/\s+/)[0] || "there";
}
