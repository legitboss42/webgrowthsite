export const WHATSAPP_AUTOMATION_STATUSES = ["DRAFT", "ACTIVE", "PAUSED"] as const;
export type WhatsAppAutomationStatus = (typeof WHATSAPP_AUTOMATION_STATUSES)[number];

export const WHATSAPP_AUTOMATION_TRIGGER_TYPES = [
  "NEW_MESSAGE", "KEYWORD", "NEW_CONTACT", "CONVERSATION_OPENED", "TAG_ADDED", "CRM_STAGE_CHANGED",
  "CONVERSATION_ASSIGNED", "MISSED_CALL", "NO_CUSTOMER_REPLY", "NO_AGENT_REPLY",
  "BUSINESS_HOURS", "WEBHOOK",
] as const;
export type WhatsAppAutomationTriggerType = (typeof WHATSAPP_AUTOMATION_TRIGGER_TYPES)[number];

export const WHATSAPP_AUTOMATION_ACTION_TYPES = [
  "SEND_TEXT", "ASK_QUESTION", "SEND_TEMPLATE", "SEND_SAVED_REPLY", "ASSIGN_CONVERSATION", "ADD_TAG",
  "REMOVE_TAG", "UPDATE_CRM_STAGE", "UPDATE_CONTACT_FIELD", "ADD_INTERNAL_NOTE", "DELAY",
  "CALL_WEBHOOK", "BRANCH", "STOP",
] as const;
export type WhatsAppAutomationActionType = (typeof WHATSAPP_AUTOMATION_ACTION_TYPES)[number];

export const WHATSAPP_AUTOMATION_CONDITION_OPERATORS = [
  "EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS", "STARTS_WITH", "GREATER_THAN",
  "LESS_THAN", "EXISTS", "NOT_EXISTS",
] as const;
export type WhatsAppAutomationConditionOperator = (typeof WHATSAPP_AUTOMATION_CONDITION_OPERATORS)[number];
export type WhatsAppAutomationConditionJoin = "AND" | "OR";
export type WhatsAppAutomationDelayUnit = "MINUTES" | "HOURS" | "DAYS";
export type WhatsAppAutomationQuestionMode = "BUTTONS" | "LIST";

export type WhatsAppAutomationQuestionOption = {
  id: string;
  title: string;
  description?: string;
};

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
  condition?: WhatsAppAutomationCondition;
  thenActions?: WhatsAppAutomationAction[];
  elseActions?: WhatsAppAutomationAction[];
  questionMode?: WhatsAppAutomationQuestionMode;
  choices?: WhatsAppAutomationQuestionOption[];
  listButtonText?: string;
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

export type WhatsAppAutomationRunStatus = "QUEUED" | "RUNNING" | "WAITING" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "CANCELLED";
export type WhatsAppAutomationRun = {
  id: string;
  automationId: string;
  automationVersion: number;
  status: WhatsAppAutomationRunStatus;
  triggerType: string;
  triggerEventKey?: string;
  contactId?: string;
  conversationId?: string;
  nextActionIndex: number;
  startedAt?: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppAutomationJobStatus = "PENDING" | "PROCESSING" | "WAITING_INPUT" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type WhatsAppAutomationJob = {
  id: string;
  runId: string;
  automationId: string;
  status: WhatsAppAutomationJobStatus;
  dueAt: string;
  actionIndex: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt?: string;
};

export const WHATSAPP_AUTOMATION_TRIGGER_OPTIONS: Array<{ value: WhatsAppAutomationTriggerType; label: string; description: string }> = [
  { value: "NEW_MESSAGE", label: "New incoming message", description: "Runs whenever a customer sends a new WhatsApp message." },
  { value: "KEYWORD", label: "Keyword / phrase", description: "Runs when a customer message contains the configured phrase." },
  { value: "NEW_CONTACT", label: "New contact", description: "Runs the first time a contact is created." },
  { value: "CONVERSATION_OPENED", label: "Update lifecycle · Open chat", description: "Runs once when the conversation lifecycle changes to Open, whether a customer message reopens the chat or a team member uses Open chat manually." },
  { value: "TAG_ADDED", label: "Tag added", description: "Runs when a selected CRM tag is newly added." },
  { value: "CRM_STAGE_CHANGED", label: "CRM stage changed", description: "Runs when a contact moves into a selected pipeline stage." },
  { value: "CONVERSATION_ASSIGNED", label: "Conversation assigned", description: "Runs when a conversation is assigned." },
  { value: "MISSED_CALL", label: "Missed WhatsApp call", description: "Runs after an inbound WhatsApp call ends without being answered." },
  { value: "NO_CUSTOMER_REPLY", label: "No customer reply", description: "Runs after an outbound message receives no customer reply for a configured period." },
  { value: "NO_AGENT_REPLY", label: "No agent reply", description: "Runs after an inbound message receives no agent reply for a configured period." },
  { value: "BUSINESS_HOURS", label: "Business-hours transition", description: "Runs when configured business hours open or close." },
  { value: "WEBHOOK", label: "Inbound webhook", description: "Runs when the public automation webhook key receives JSON." },
];

export const WHATSAPP_AUTOMATION_CONDITION_FIELDS = [
  { value: "answer", label: "Last question answer" },
  { value: "message.text", label: "Message text" },
  { value: "message.type", label: "Message type" },
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
  { value: "SEND_TEXT", label: "Send text", description: "Send a free-form WhatsApp message inside the 24-hour service window." },
  { value: "ASK_QUESTION", label: "Ask a question", description: "Send reply buttons or a choice list, wait for the contact to choose, then continue the workflow." },
  { value: "SEND_TEMPLATE", label: "Send approved template", description: "Send an approved Meta template. Language can be supplied separately." },
  { value: "SEND_SAVED_REPLY", label: "Send Saved Reply", description: "Send a Team Saved Reply, including its saved media when present." },
  { value: "ASSIGN_CONVERSATION", label: "Assign conversation", description: "Assign the conversation to an active team member." },
  { value: "ADD_TAG", label: "Add tag", description: "Add a CRM tag and emit a Tag Added automation event." },
  { value: "REMOVE_TAG", label: "Remove tag", description: "Remove a CRM tag." },
  { value: "UPDATE_CRM_STAGE", label: "Change CRM stage", description: "Move the contact through the CRM pipeline." },
  { value: "UPDATE_CONTACT_FIELD", label: "Update contact field", description: "Update a supported built-in field or custom.<field>." },
  { value: "ADD_INTERNAL_NOTE", label: "Add internal note", description: "Add a private note to the conversation timeline." },
  { value: "DELAY", label: "Wait / delay", description: "Persist this run and resume it after minutes, hours, or days." },
  { value: "CALL_WEBHOOK", label: "HTTP request", description: "POST workflow context to an external HTTPS webhook." },
  { value: "BRANCH", label: "Branch", description: "Create Yes / No paths using one condition. Empty paths are allowed while building." },
  { value: "STOP", label: "Stop workflow", description: "End the selected path immediately." },
];

const VALID_STATUSES = new Set<string>(WHATSAPP_AUTOMATION_STATUSES);
const VALID_TRIGGERS = new Set<string>(WHATSAPP_AUTOMATION_TRIGGER_TYPES);
const VALID_ACTIONS = new Set<string>(WHATSAPP_AUTOMATION_ACTION_TYPES);
const VALID_OPERATORS = new Set<string>(WHATSAPP_AUTOMATION_CONDITION_OPERATORS);
const DELAY_UNITS = new Set<string>(["MINUTES", "HOURS", "DAYS"]);
export const WHATSAPP_AUTOMATION_MAX_STEPS = 100;

function cleanString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string | number | boolean>;
  const output: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-zA-Z0-9_.-]{1,60}$/.test(key)) continue;
    if (typeof raw === "string") output[key] = raw.trim().slice(0, 1000);
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
    else if (typeof raw === "boolean") output[key] = raw;
  }
  return output;
}

function validateTriggerConfig(type: WhatsAppAutomationTriggerType, config: Record<string, string | number | boolean>): string | null {
  if (type === "KEYWORD" && !cleanString(config.keyword, 200)) return "Enter the keyword or phrase this workflow should match.";
  if (type === "TAG_ADDED" && !cleanString(config.tag, 100)) return "Choose the tag that should trigger this workflow.";
  if (type === "CRM_STAGE_CHANGED" && !cleanString(config.stage, 80)) return "Choose the CRM stage that should trigger this workflow.";
  if (type === "CONVERSATION_ASSIGNED" && config.memberId && !cleanString(config.memberId, 100)) return "Choose a valid team member.";
  if (type === "NO_CUSTOMER_REPLY" || type === "NO_AGENT_REPLY") {
    const amount = Number(config.amount);
    const unit = cleanString(config.unit, 20).toUpperCase();
    if (!Number.isFinite(amount) || amount < 1 || amount > 365) return "Enter a valid no-reply delay amount.";
    if (!DELAY_UNITS.has(unit)) return "Choose minutes, hours, or days for the no-reply delay.";
  }
  if (type === "BUSINESS_HOURS") {
    const transition = cleanString(config.transition, 20).toUpperCase();
    if (transition !== "OPENED" && transition !== "CLOSED") return "Choose whether this runs when business hours open or close.";
  }
  if (type === "WEBHOOK") {
    const key = cleanString(config.key, 80);
    if (!/^[a-z0-9_-]{8,80}$/i.test(key)) return "Webhook keys must use 8–80 letters, numbers, underscores, or hyphens.";
  }
  return null;
}

function normalizeCondition(value: unknown): WhatsAppAutomationCondition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const field = cleanString(row.field, 120);
  const operator = cleanString(row.operator, 30).toUpperCase();
  if (!field || !VALID_OPERATORS.has(operator)) return null;
  return { field, operator: operator as WhatsAppAutomationConditionOperator, value: cleanString(row.value, 1000) };
}

function normalizeQuestionChoice(value: unknown): WhatsAppAutomationQuestionOption | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const id = cleanString(row.id, 200);
  const title = cleanString(row.title, 24);
  const description = cleanString(row.description, 72);
  if (!id || !title) return null;
  return { id, title, ...(description ? { description } : {}) };
}

function normalizeAction(value: unknown, depth = 0): WhatsAppAutomationAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 5) return null;
  const row = value as Record<string, unknown>;
  const type = cleanString(row.type, 40).toUpperCase();
  if (!VALID_ACTIONS.has(type)) return null;
  const action: WhatsAppAutomationAction = { type: type as WhatsAppAutomationActionType };
  const primary = cleanString(row.value, 4000);
  const secondary = cleanString(row.value2, 1000);
  if (primary) action.value = primary;
  if (secondary) action.value2 = secondary;
  if (row.amount !== undefined) {
    const amount = Number(row.amount);
    if (Number.isFinite(amount)) action.amount = amount;
  }
  const unit = cleanString(row.unit, 20).toUpperCase();
  if (DELAY_UNITS.has(unit)) action.unit = unit as WhatsAppAutomationDelayUnit;
  if (action.type === "BRANCH") {
    action.condition = normalizeCondition(row.condition) || undefined;
    action.thenActions = Array.isArray(row.thenActions) ? row.thenActions.map((item) => normalizeAction(item, depth + 1)).filter((item): item is WhatsAppAutomationAction => Boolean(item)) : [];
    action.elseActions = Array.isArray(row.elseActions) ? row.elseActions.map((item) => normalizeAction(item, depth + 1)).filter((item): item is WhatsAppAutomationAction => Boolean(item)) : [];
  }
  if (action.type === "ASK_QUESTION") {
    const mode = cleanString(row.questionMode, 20).toUpperCase();
    action.questionMode = mode === "LIST" ? "LIST" : "BUTTONS";
    action.choices = Array.isArray(row.choices) ? row.choices.map(normalizeQuestionChoice).filter((item): item is WhatsAppAutomationQuestionOption => Boolean(item)) : [];
    const listButtonText = cleanString(row.listButtonText, 20);
    if (listButtonText) action.listButtonText = listButtonText;
  }
  return action;
}

function validateQuestion(action: WhatsAppAutomationAction, label: string) {
  if (!action.value?.trim()) return `${label} needs a question.`;
  if (action.value.trim().length > 1024) return `${label} question must be 1024 characters or fewer.`;
  const mode = action.questionMode || "BUTTONS";
  const choices = action.choices || [];
  const max = mode === "BUTTONS" ? 3 : 10;
  if (choices.length < 2 || choices.length > max) return `${label} needs 2–${max} choices for ${mode === "BUTTONS" ? "reply buttons" : "a choice list"}.`;
  const ids = new Set<string>();
  for (const choice of choices) {
    if (!choice.id.trim() || !choice.title.trim()) return `${label} choices need an ID and title.`;
    if (ids.has(choice.id.toLowerCase())) return `${label} choice IDs must be unique.`;
    ids.add(choice.id.toLowerCase());
    if (mode === "BUTTONS" && choice.title.length > 20) return `${label} reply-button titles must be 20 characters or fewer.`;
    if (mode === "LIST" && choice.title.length > 24) return `${label} list titles must be 24 characters or fewer.`;
  }
  if (mode === "LIST" && (action.listButtonText || "Choose").length > 20) return `${label} list button text must be 20 characters or fewer.`;
  if (action.value2 && !/^(custom\.[A-Za-z0-9_.-]{1,80}|email|phone|company|display_name|opt_in_status)$/.test(action.value2)) {
    return `${label} answer field must be custom.<field> or a supported built-in contact field.`;
  }
  return null;
}

function validateAction(action: WhatsAppAutomationAction, label: string): string | null {
  if (["SEND_TEXT", "SEND_TEMPLATE", "SEND_SAVED_REPLY", "ASSIGN_CONVERSATION", "ADD_TAG", "REMOVE_TAG", "UPDATE_CRM_STAGE", "ADD_INTERNAL_NOTE", "CALL_WEBHOOK"].includes(action.type) && !action.value?.trim()) return `${label} needs a value.`;
  if (action.type === "ASK_QUESTION") return validateQuestion(action, label);
  if (action.type === "UPDATE_CONTACT_FIELD" && (!action.value?.trim() || !action.value2?.trim())) return `${label} needs both a field name and a value.`;
  if (action.type === "CALL_WEBHOOK") {
    try { if (new URL(action.value || "").protocol !== "https:") return `${label} must use an HTTPS webhook URL.`; }
    catch { return `${label} needs a valid HTTPS webhook URL.`; }
  }
  if (action.type === "DELAY") {
    if (!action.amount || action.amount < 1 || action.amount > 365) return `${label} needs a delay amount between 1 and 365.`;
    if (!action.unit) return `${label} needs a delay unit.`;
  }
  if (action.type === "BRANCH") {
    if (!action.condition) return `${label} needs a branch condition.`;
    if (!new Set(["EXISTS", "NOT_EXISTS"]).has(action.condition.operator) && !action.condition.value.trim()) return `${label} needs a comparison value.`;
  }
  return null;
}

export function countWhatsAppAutomationSteps(actions: WhatsAppAutomationAction[]): number {
  return actions.reduce((total, action) => total + 1 + (action.type === "BRANCH" ? countWhatsAppAutomationSteps(action.thenActions || []) + countWhatsAppAutomationSteps(action.elseActions || []) : 0), 0);
}

function validateActions(actions: WhatsAppAutomationAction[], path = "Action"): string | null {
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const label = `${path} ${index + 1}`;
    const error = validateAction(action, label);
    if (error) return error;
    if (action.type === "STOP" && index !== actions.length - 1) return `${label}: Stop workflow must be the final action on its path.`;
    if (action.type === "BRANCH") {
      const yes = validateActions(action.thenActions || [], `${label} Yes action`); if (yes) return yes;
      const no = validateActions(action.elseActions || [], `${label} No action`); if (no) return no;
    }
  }
  return null;
}

function allActions(actions: WhatsAppAutomationAction[]): WhatsAppAutomationAction[] {
  const output: WhatsAppAutomationAction[] = [];
  for (const action of actions) {
    output.push(action);
    if (action.type === "BRANCH") output.push(...allActions(action.thenActions || []), ...allActions(action.elseActions || []));
  }
  return output;
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
  if (rawConditions.length > 20) return { ok: false, error: "Use at most 20 entry conditions in one automation." };
  const conditions: WhatsAppAutomationCondition[] = [];
  for (const raw of rawConditions) {
    const condition = normalizeCondition(raw);
    if (!condition) return { ok: false, error: "Each condition needs a valid field and operator." };
    if (!new Set(["EXISTS", "NOT_EXISTS"]).has(condition.operator) && !condition.value) return { ok: false, error: "Each condition needs a comparison value." };
    conditions.push(condition);
  }

  const rawActions = Array.isArray(value.actions) ? value.actions : [];
  if (!rawActions.length) return { ok: false, error: "Add at least one action." };
  const actions: WhatsAppAutomationAction[] = [];
  for (const raw of rawActions) {
    const action = normalizeAction(raw);
    if (!action) return { ok: false, error: "One or more workflow actions are invalid." };
    actions.push(action);
  }
  if (countWhatsAppAutomationSteps(actions) > WHATSAPP_AUTOMATION_MAX_STEPS) return { ok: false, error: `Use at most ${WHATSAPP_AUTOMATION_MAX_STEPS} workflow steps.` };
  const actionError = validateActions(actions); if (actionError) return { ok: false, error: actionError };

  const flattened = allActions(actions);
  if (triggerType === "TAG_ADDED") {
    const triggerTag = cleanString(triggerConfig.tag, 100).toLowerCase();
    if (flattened.some((action) => action.type === "ADD_TAG" && action.value?.trim().toLowerCase() === triggerTag)) return { ok: false, error: "This workflow can re-add its own trigger tag. Choose a different tag to avoid a loop." };
  }
  if (triggerType === "CRM_STAGE_CHANGED") {
    const triggerStage = cleanString(triggerConfig.stage, 80).toUpperCase();
    if (flattened.some((action) => action.type === "UPDATE_CRM_STAGE" && action.value?.trim().toUpperCase() === triggerStage)) return { ok: false, error: "This workflow can set the same CRM stage that triggered it. Choose a different stage to avoid a loop." };
  }

  return { ok: true, value: { name, description, status: status as WhatsAppAutomationStatus, triggerType: triggerType as WhatsAppAutomationTriggerType, triggerConfig, conditionJoin, conditions, actions } };
}

export function normalizeWhatsAppAutomationRow(row: Record<string, unknown>): WhatsAppAutomation {
  const checked = validateWhatsAppAutomationInput({ name: row.name, description: row.description, status: row.status, triggerType: row.trigger_type, triggerConfig: row.trigger_config, conditionJoin: row.condition_join, conditions: row.conditions, actions: row.actions });
  const value: WhatsAppAutomationInput = checked.ok ? checked.value : { name: cleanString(row.name, 80) || "Invalid automation", description: cleanString(row.description, 240), status: "PAUSED", triggerType: "NEW_MESSAGE", triggerConfig: {}, conditionJoin: "AND", conditions: [], actions: [{ type: "STOP" }] };
  return {
    id: String(row.id || ""), ...value, version: Math.max(1, Number(row.version) || 1),
    createdByMemberId: typeof row.created_by_member_id === "string" ? row.created_by_member_id : undefined,
    updatedByMemberId: typeof row.updated_by_member_id === "string" ? row.updated_by_member_id : undefined,
    activatedAt: typeof row.activated_at === "string" ? row.activated_at : undefined,
    pausedAt: typeof row.paused_at === "string" ? row.paused_at : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function normalizeWhatsAppAutomationRunRow(row: Record<string, unknown>): WhatsAppAutomationRun {
  return {
    id: String(row.id || ""), automationId: String(row.automation_id || ""), automationVersion: Number(row.automation_version) || 1,
    status: String(row.status || "QUEUED") as WhatsAppAutomationRunStatus, triggerType: String(row.trigger_type || ""),
    triggerEventKey: typeof row.trigger_event_key === "string" ? row.trigger_event_key : undefined,
    contactId: typeof row.contact_id === "string" ? row.contact_id : undefined,
    conversationId: typeof row.conversation_id === "string" ? row.conversation_id : undefined,
    nextActionIndex: Number(row.next_action_index) || 0,
    startedAt: typeof row.started_at === "string" ? row.started_at : undefined,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : undefined,
    errorCode: typeof row.error_code === "string" ? row.error_code : undefined,
    errorMessage: typeof row.error_message === "string" ? row.error_message : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function normalizeWhatsAppAutomationJobRow(row: Record<string, unknown>): WhatsAppAutomationJob {
  return {
    id: String(row.id || ""), runId: String(row.run_id || ""), automationId: String(row.automation_id || ""),
    status: String(row.status || "PENDING") as WhatsAppAutomationJobStatus, dueAt: String(row.due_at || ""),
    actionIndex: Number(row.action_index) || 0, attempts: Number(row.attempts) || 0, maxAttempts: Number(row.max_attempts) || 5,
    lastError: typeof row.last_error === "string" ? row.last_error : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

export function getWhatsAppAutomationTriggerLabel(type: WhatsAppAutomationTriggerType) {
  return WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.find((item) => item.value === type)?.label || type;
}
export function getWhatsAppAutomationActionLabel(type: WhatsAppAutomationActionType) {
  return WHATSAPP_AUTOMATION_ACTION_OPTIONS.find((item) => item.value === type)?.label || type;
}
