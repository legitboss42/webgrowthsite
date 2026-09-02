export const WHATSAPP_AUTOMATION_STATUSES = ["DRAFT", "ACTIVE", "PAUSED"] as const;
export type WhatsAppAutomationStatus = (typeof WHATSAPP_AUTOMATION_STATUSES)[number];

export const WHATSAPP_AUTOMATION_TRIGGER_TYPES = [
  "NEW_MESSAGE",
  "KEYWORD",
  "NEW_CONTACT",
  "TAG_ADDED",
  "CRM_STAGE_CHANGED",
  "CONVERSATION_ASSIGNED",
  "MISSED_CALL",
  "NO_CUSTOMER_REPLY",
  "NO_AGENT_REPLY",
  "BUSINESS_HOURS",
  "WEBHOOK",
] as const;
export type WhatsAppAutomationTriggerType = (typeof WHATSAPP_AUTOMATION_TRIGGER_TYPES)[number];

export const WHATSAPP_AUTOMATION_ACTION_TYPES = [
  "SEND_TEXT",
  "SEND_TEMPLATE",
  "SEND_SAVED_REPLY",
  "ASSIGN_CONVERSATION",
  "ADD_TAG",
  "REMOVE_TAG",
  "UPDATE_CRM_STAGE",
  "UPDATE_CONTACT_FIELD",
  "ADD_INTERNAL_NOTE",
  "DELAY",
  "CALL_WEBHOOK",
  "STOP",
] as const;
export type WhatsAppAutomationActionType = (typeof WHATSAPP_AUTOMATION_ACTION_TYPES)[number];

export const WHATSAPP_AUTOMATION_CONDITION_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "EXISTS",
  "NOT_EXISTS",
] as const;
export type WhatsAppAutomationConditionOperator = (typeof WHATSAPP_AUTOMATION_CONDITION_OPERATORS)[number];
export type WhatsAppAutomationConditionJoin = "AND" | "OR";
export type WhatsAppAutomationDelayUnit = "MINUTES" | "HOURS" | "DAYS";

export type WhatsAppAutomationCondition = {
  field: string;
  operator: WhatsAppAutomationConditionOperator;
  value: string;
};

export type WhatsAppAutomationAction = {
  type: WhatsAppAutomationActionType;
  value?: string;
  value2?: string;
  amount?: number;
  unit?: WhatsAppAutomationDelayUnit;
};

export type WhatsAppAutomationInput = {
  name: string;
  description: string;
  status: WhatsAppAutomationStatus;
  triggerType: WhatsAppAutomationTriggerType;
  triggerConfig: Record<string, string | number | boolean>;
  conditionJoin: WhatsAppAutomationConditionJoin;
  conditions: WhatsAppAutomationCondition[];
  actions: WhatsAppAutomationAction[];
};

export type WhatsAppAutomation = WhatsAppAutomationInput & {
  id: string;
  version: number;
  createdByMemberId?: string;
  updatedByMemberId?: string;
  activatedAt?: string;
  pausedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const WHATSAPP_AUTOMATION_TRIGGER_OPTIONS: Array<{ value: WhatsAppAutomationTriggerType; label: string; description: string }> = [
  { value: "NEW_MESSAGE", label: "New incoming message", description: "Runs when a customer sends a new WhatsApp message." },
  { value: "KEYWORD", label: "Keyword / message contains", description: "Runs when an incoming message matches a keyword rule." },
  { value: "NEW_CONTACT", label: "New contact created", description: "Runs the first time a contact is created in Web Growth." },
  { value: "TAG_ADDED", label: "Tag added", description: "Runs when a selected CRM tag is added to a contact." },
  { value: "CRM_STAGE_CHANGED", label: "CRM stage changed", description: "Runs when a contact moves into a selected pipeline stage." },
  { value: "CONVERSATION_ASSIGNED", label: "Conversation assigned", description: "Runs when a conversation is assigned to a team member." },
  { value: "MISSED_CALL", label: "Missed WhatsApp call", description: "Runs when an inbound WhatsApp call is missed." },
  { value: "NO_CUSTOMER_REPLY", label: "No customer reply", description: "Runs after the customer has not replied for a configured period." },
  { value: "NO_AGENT_REPLY", label: "No agent reply", description: "Runs after an inbound message has waited without an agent reply." },
  { value: "BUSINESS_HOURS", label: "Business-hours transition", description: "Runs when business hours open or close." },
  { value: "WEBHOOK", label: "Inbound webhook", description: "Runs when a Web Growth automation webhook key is called." },
];

export const WHATSAPP_AUTOMATION_CONDITION_FIELDS = [
  { value: "message.text", label: "Message text" },
  { value: "contact.tags", label: "Contact tags" },
  { value: "contact.lead_stage", label: "CRM stage" },
  { value: "contact.phone", label: "Contact phone" },
  { value: "contact.email", label: "Contact email" },
  { value: "contact.company", label: "Contact company" },
  { value: "contact.opt_in_status", label: "Consent status" },
  { value: "conversation.assigned_member_id", label: "Assigned team member" },
  { value: "conversation.status", label: "Conversation status" },
  { value: "business_hours", label: "Business hours" },
] as const;

export const WHATSAPP_AUTOMATION_ACTION_OPTIONS: Array<{ value: WhatsAppAutomationActionType; label: string; description: string }> = [
  { value: "SEND_TEXT", label: "Send text message", description: "Send a normal WhatsApp text when the service window allows it." },
  { value: "SEND_TEMPLATE", label: "Send approved template", description: "Send an approved Meta template by template name." },
  { value: "SEND_SAVED_REPLY", label: "Send Saved Reply", description: "Send a saved-reply shortcut." },
  { value: "ASSIGN_CONVERSATION", label: "Assign conversation", description: "Assign the conversation to a team-member ID." },
  { value: "ADD_TAG", label: "Add tag", description: "Add a CRM tag to the contact." },
  { value: "REMOVE_TAG", label: "Remove tag", description: "Remove a CRM tag from the contact." },
  { value: "UPDATE_CRM_STAGE", label: "Change CRM stage", description: "Move the contact to a pipeline stage." },
  { value: "UPDATE_CONTACT_FIELD", label: "Update contact field", description: "Update a built-in or custom contact field." },
  { value: "ADD_INTERNAL_NOTE", label: "Add internal note", description: "Append a private note to the contact/conversation timeline." },
  { value: "DELAY", label: "Wait / delay", description: "Persist the run and resume it later." },
  { value: "CALL_WEBHOOK", label: "Call external webhook", description: "POST the automation context to an external HTTPS endpoint." },
  { value: "STOP", label: "Stop workflow", description: "Finish the current workflow without running later actions." },
];

const VALID_STATUSES = new Set<string>(WHATSAPP_AUTOMATION_STATUSES);
const VALID_TRIGGERS = new Set<string>(WHATSAPP_AUTOMATION_TRIGGER_TYPES);
const VALID_ACTIONS = new Set<string>(WHATSAPP_AUTOMATION_ACTION_TYPES);
const VALID_OPERATORS = new Set<string>(WHATSAPP_AUTOMATION_CONDITION_OPERATORS);
const DELAY_UNITS = new Set<string>(["MINUTES", "HOURS", "DAYS"]);

function cleanString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string | number | boolean>;
  const output: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-zA-Z0-9_.-]{1,60}$/.test(key)) continue;
    if (typeof raw === "string") output[key] = raw.trim().slice(0, 500);
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
    else if (typeof raw === "boolean") output[key] = raw;
  }
  return output;
}

function validateTriggerConfig(type: WhatsAppAutomationTriggerType, config: Record<string, string | number | boolean>): string | null {
  if (type === "KEYWORD" && !cleanString(config.keyword, 200)) return "Enter the keyword or phrase this workflow should match.";
  if (type === "TAG_ADDED" && !cleanString(config.tag, 100)) return "Choose the tag that should trigger this workflow.";
  if (type === "CRM_STAGE_CHANGED" && !cleanString(config.stage, 80)) return "Choose the CRM stage that should trigger this workflow.";
  if ((type === "NO_CUSTOMER_REPLY" || type === "NO_AGENT_REPLY")) {
    const amount = Number(config.amount);
    const unit = cleanString(config.unit, 20).toUpperCase();
    if (!Number.isFinite(amount) || amount < 1 || amount > 365) return "Enter a valid no-reply delay amount.";
    if (!DELAY_UNITS.has(unit)) return "Choose minutes, hours, or days for the no-reply delay.";
  }
  if (type === "BUSINESS_HOURS") {
    const transition = cleanString(config.transition, 20).toUpperCase();
    if (!new Set(["OPENED", "CLOSED"]).has(transition)) return "Choose whether this runs when business hours open or close.";
  }
  if (type === "WEBHOOK") {
    const key = cleanString(config.key, 80);
    if (!/^[a-z0-9_-]{3,80}$/i.test(key)) return "Webhook keys must use 3–80 letters, numbers, underscores, or hyphens.";
  }
  return null;
}

function normalizeCondition(value: unknown): WhatsAppAutomationCondition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const field = cleanString(row.field, 100);
  const operator = cleanString(row.operator, 30).toUpperCase();
  if (!field || !VALID_OPERATORS.has(operator)) return null;
  return { field, operator: operator as WhatsAppAutomationConditionOperator, value: cleanString(row.value, 500) };
}

function normalizeAction(value: unknown): WhatsAppAutomationAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const type = cleanString(row.type, 40).toUpperCase();
  if (!VALID_ACTIONS.has(type)) return null;
  const action: WhatsAppAutomationAction = { type: type as WhatsAppAutomationActionType };
  const primary = cleanString(row.value, 4000);
  const secondary = cleanString(row.value2, 500);
  if (primary) action.value = primary;
  if (secondary) action.value2 = secondary;
  if (row.amount !== undefined) {
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) action.amount = amount;
  }
  const unit = cleanString(row.unit, 20).toUpperCase();
  if (DELAY_UNITS.has(unit)) action.unit = unit as WhatsAppAutomationDelayUnit;
  return action;
}

function validateAction(action: WhatsAppAutomationAction, index: number): string | null {
  const label = `Action ${index + 1}`;
  if (["SEND_TEXT", "SEND_TEMPLATE", "SEND_SAVED_REPLY", "ASSIGN_CONVERSATION", "ADD_TAG", "REMOVE_TAG", "UPDATE_CRM_STAGE", "ADD_INTERNAL_NOTE", "CALL_WEBHOOK"].includes(action.type) && !action.value?.trim()) {
    return `${label} needs a value.`;
  }
  if (action.type === "UPDATE_CONTACT_FIELD" && (!action.value?.trim() || !action.value2?.trim())) return `${label} needs both a field name and a value.`;
  if (action.type === "CALL_WEBHOOK") {
    try {
      const url = new URL(action.value || "");
      if (!new Set(["https:", "http:"]).has(url.protocol)) return `${label} must use an HTTP or HTTPS webhook URL.`;
    } catch {
      return `${label} needs a valid webhook URL.`;
    }
  }
  if (action.type === "DELAY") {
    if (!action.amount || action.amount < 1 || action.amount > 365) return `${label} needs a delay amount between 1 and 365.`;
    if (!action.unit) return `${label} needs a delay unit.`;
  }
  return null;
}

export function validateWhatsAppAutomationInput(value: Record<string, unknown>): { ok: true; value: WhatsAppAutomationInput } | { ok: false; error: string } {
  const name = cleanString(value.name, 80);
  if (name.length < 2) return { ok: false, error: "Automation name must be at least 2 characters." };
  const description = cleanString(value.description, 240);
  const status = cleanString(value.status, 20).toUpperCase();
  if (!VALID_STATUSES.has(status)) return { ok: false, error: "Choose Draft, Active, or Paused." };
  const triggerType = cleanString(value.triggerType, 40).toUpperCase();
  if (!VALID_TRIGGERS.has(triggerType)) return { ok: false, error: "Choose a valid automation trigger." };
  const triggerConfig = cleanConfig(value.triggerConfig);
  const triggerError = validateTriggerConfig(triggerType as WhatsAppAutomationTriggerType, triggerConfig);
  if (triggerError) return { ok: false, error: triggerError };

  const conditionJoin = cleanString(value.conditionJoin, 10).toUpperCase() === "OR" ? "OR" : "AND";
  const rawConditions = Array.isArray(value.conditions) ? value.conditions : [];
  if (rawConditions.length > 10) return { ok: false, error: "Use at most 10 conditions in one automation." };
  const conditions: WhatsAppAutomationCondition[] = [];
  for (const raw of rawConditions) {
    const condition = normalizeCondition(raw);
    if (!condition) return { ok: false, error: "Each condition needs a valid field and operator." };
    if (!new Set(["EXISTS", "NOT_EXISTS"]).has(condition.operator) && !condition.value) return { ok: false, error: "Each condition needs a comparison value." };
    conditions.push(condition);
  }

  const rawActions = Array.isArray(value.actions) ? value.actions : [];
  if (rawActions.length < 1) return { ok: false, error: "Add at least one action." };
  if (rawActions.length > 12) return { ok: false, error: "Use at most 12 actions in one automation." };
  const actions: WhatsAppAutomationAction[] = [];
  for (let index = 0; index < rawActions.length; index += 1) {
    const action = normalizeAction(rawActions[index]);
    if (!action) return { ok: false, error: `Action ${index + 1} is not valid.` };
    const error = validateAction(action, index);
    if (error) return { ok: false, error };
    if (action.type === "STOP" && index !== rawActions.length - 1) return { ok: false, error: "Stop workflow must be the final action." };
    actions.push(action);
  }

  if (triggerType === "TAG_ADDED") {
    const triggerTag = cleanString(triggerConfig.tag, 100).toLowerCase();
    if (actions.some((action) => action.type === "ADD_TAG" && action.value?.trim().toLowerCase() === triggerTag)) {
      return { ok: false, error: "This workflow would immediately re-add its own trigger tag. Choose a different action to avoid a loop." };
    }
  }
  if (triggerType === "CRM_STAGE_CHANGED") {
    const triggerStage = cleanString(triggerConfig.stage, 80).toUpperCase();
    if (actions.some((action) => action.type === "UPDATE_CRM_STAGE" && action.value?.trim().toUpperCase() === triggerStage)) {
      return { ok: false, error: "This workflow would immediately set the same CRM stage that triggered it. Choose a different stage to avoid a loop." };
    }
  }

  return {
    ok: true,
    value: {
      name,
      description,
      status: status as WhatsAppAutomationStatus,
      triggerType: triggerType as WhatsAppAutomationTriggerType,
      triggerConfig,
      conditionJoin,
      conditions,
      actions,
    },
  };
}

export function normalizeWhatsAppAutomationRow(row: Record<string, unknown>): WhatsAppAutomation {
  const checked = validateWhatsAppAutomationInput({
    name: row.name,
    description: row.description,
    status: row.status,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config,
    conditionJoin: row.condition_join,
    conditions: row.conditions,
    actions: row.actions,
  });
  const fallback: WhatsAppAutomationInput = {
    name: cleanString(row.name, 80) || "Untitled automation",
    description: cleanString(row.description, 240),
    status: VALID_STATUSES.has(cleanString(row.status, 20).toUpperCase()) ? cleanString(row.status, 20).toUpperCase() as WhatsAppAutomationStatus : "DRAFT",
    triggerType: VALID_TRIGGERS.has(cleanString(row.trigger_type, 40).toUpperCase()) ? cleanString(row.trigger_type, 40).toUpperCase() as WhatsAppAutomationTriggerType : "NEW_MESSAGE",
    triggerConfig: cleanConfig(row.trigger_config),
    conditionJoin: cleanString(row.condition_join, 10).toUpperCase() === "OR" ? "OR" : "AND",
    conditions: Array.isArray(row.conditions) ? row.conditions.map(normalizeCondition).filter((item): item is WhatsAppAutomationCondition => Boolean(item)) : [],
    actions: Array.isArray(row.actions) ? row.actions.map(normalizeAction).filter((item): item is WhatsAppAutomationAction => Boolean(item)) : [],
  };
  const base = checked.ok ? checked.value : fallback;
  return {
    id: cleanString(row.id, 100),
    ...base,
    version: Number.isFinite(Number(row.version)) ? Math.max(1, Number(row.version)) : 1,
    createdByMemberId: cleanString(row.created_by_member_id, 100) || undefined,
    updatedByMemberId: cleanString(row.updated_by_member_id, 100) || undefined,
    activatedAt: cleanString(row.activated_at, 100) || undefined,
    pausedAt: cleanString(row.paused_at, 100) || undefined,
    createdAt: cleanString(row.created_at, 100) || undefined,
    updatedAt: cleanString(row.updated_at, 100) || undefined,
  };
}

export function getWhatsAppAutomationTriggerLabel(type: WhatsAppAutomationTriggerType) {
  return WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.find((option) => option.value === type)?.label || type;
}

export function getWhatsAppAutomationActionLabel(type: WhatsAppAutomationActionType) {
  return WHATSAPP_AUTOMATION_ACTION_OPTIONS.find((option) => option.value === type)?.label || type;
}
