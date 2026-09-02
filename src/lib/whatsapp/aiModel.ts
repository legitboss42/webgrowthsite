export const WHATSAPP_AI_AGENT_STATUSES = ["DRAFT", "ACTIVE", "PAUSED"] as const;
export type WhatsAppAIAgentStatus = (typeof WHATSAPP_AI_AGENT_STATUSES)[number];

export const WHATSAPP_AI_KNOWLEDGE_MODES = ["KNOWLEDGE_ONLY", "KNOWLEDGE_PLUS_GENERAL"] as const;
export type WhatsAppAIKnowledgeMode = (typeof WHATSAPP_AI_KNOWLEDGE_MODES)[number];

export const WHATSAPP_AI_FEATURES = ["ASSIST", "SUMMARY", "SANDBOX", "AGENT", "AUTOMATION"] as const;
export type WhatsAppAIFeature = (typeof WHATSAPP_AI_FEATURES)[number];

export const WHATSAPP_AI_ACTION_TYPES = [
  "ADD_TAG",
  "REMOVE_TAG",
  "UPDATE_CRM_STAGE",
  "UPDATE_CONTACT_FIELD",
  "ADD_INTERNAL_NOTE",
  "ASSIGN_CONVERSATION",
  "SEND_WHATSAPP_FLOW",
  "CLOSE_CONVERSATION",
  "REQUEST_HUMAN",
] as const;
export type WhatsAppAIActionType = (typeof WHATSAPP_AI_ACTION_TYPES)[number];

export type WhatsAppAISettings = {
  enabled: boolean;
  provider: "VERCEL_AI_GATEWAY";
  model: string;
  assistEnabled: boolean;
  agentsEnabled: boolean;
  defaultKnowledgeMode: WhatsAppAIKnowledgeMode;
  dailyRequestLimit: number;
  monthlyBudgetUsd: number;
  maxOutputTokens: number;
  maxAgentTurns: number;
};

export type WhatsAppAIAgent = {
  id: string;
  name: string;
  description: string;
  role: string;
  instructions: string;
  tone: string;
  knowledgeMode: WhatsAppAIKnowledgeMode;
  knowledgeSourceIds: string[];
  allowedActions: WhatsAppAIActionType[];
  handoffRules: Record<string, unknown>;
  workingHours: Record<string, unknown>;
  maxTurns: number;
  fallbackMessage: string;
  modelOverride?: string;
  status: WhatsAppAIAgentStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppAIProposedAction = {
  type: WhatsAppAIActionType;
  payload: Record<string, unknown>;
};

export type WhatsAppAIResponse = {
  reply: string;
  summary: string;
  handoff: boolean;
  actions: WhatsAppAIProposedAction[];
};

const ACTIONS = new Set<string>(WHATSAPP_AI_ACTION_TYPES);
const AGENT_STATUSES = new Set<string>(WHATSAPP_AI_AGENT_STATUSES);
const KNOWLEDGE_MODES = new Set<string>(WHATSAPP_AI_KNOWLEDGE_MODES);

function text(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function stringArray(value: unknown, maxItems = 100) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => text(item, 120)).filter(Boolean))).slice(0, maxItems);
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeWhatsAppAISettings(row: Record<string, unknown> | null | undefined): WhatsAppAISettings {
  const mode = text(row?.default_knowledge_mode, 40).toUpperCase();
  return {
    enabled: row?.enabled === true,
    provider: "VERCEL_AI_GATEWAY",
    model: text(row?.model, 160) || "google/gemini-3.5-flash-lite",
    assistEnabled: row?.assist_enabled !== false,
    agentsEnabled: row?.agents_enabled === true,
    defaultKnowledgeMode: KNOWLEDGE_MODES.has(mode) ? mode as WhatsAppAIKnowledgeMode : "KNOWLEDGE_ONLY",
    dailyRequestLimit: numberInRange(row?.daily_request_limit, 50, 1, 10_000),
    monthlyBudgetUsd: Math.max(0, Number(row?.monthly_budget_usd) || 0),
    maxOutputTokens: numberInRange(row?.max_output_tokens, 350, 50, 4000),
    maxAgentTurns: numberInRange(row?.max_agent_turns, 10, 1, 50),
  };
}

export function normalizeWhatsAppAIAgent(row: Record<string, unknown>): WhatsAppAIAgent {
  const status = text(row.status, 20).toUpperCase();
  const mode = text(row.knowledge_mode, 40).toUpperCase();
  return {
    id: text(row.id, 100),
    name: text(row.name, 120) || "AI Agent",
    description: text(row.description, 1000),
    role: text(row.role, 120) || "Customer service assistant",
    instructions: text(row.instructions, 12_000),
    tone: text(row.tone, 120) || "Professional, concise and helpful",
    knowledgeMode: KNOWLEDGE_MODES.has(mode) ? mode as WhatsAppAIKnowledgeMode : "KNOWLEDGE_ONLY",
    knowledgeSourceIds: stringArray(row.knowledge_source_ids, 100),
    allowedActions: stringArray(row.allowed_actions, 30).filter((item): item is WhatsAppAIActionType => ACTIONS.has(item)),
    handoffRules: record(row.handoff_rules),
    workingHours: record(row.working_hours),
    maxTurns: numberInRange(row.max_turns, 10, 1, 50),
    fallbackMessage: text(row.fallback_message, 1000) || "I’ll connect you with someone who can help.",
    ...(text(row.model_override, 160) ? { modelOverride: text(row.model_override, 160) } : {}),
    status: AGENT_STATUSES.has(status) ? status as WhatsAppAIAgentStatus : "DRAFT",
    createdAt: text(row.created_at, 80) || undefined,
    updatedAt: text(row.updated_at, 80) || undefined,
  };
}

export function validateWhatsAppAIAgentInput(input: unknown) {
  const row = record(input);
  const name = text(row.name, 120);
  const role = text(row.role, 120);
  const instructions = text(row.instructions, 12_000);
  const status = text(row.status, 20).toUpperCase() || "DRAFT";
  const mode = text(row.knowledgeMode ?? row.knowledge_mode, 40).toUpperCase() || "KNOWLEDGE_ONLY";
  if (!name) return { ok: false as const, error: "Enter an AI Agent name." };
  if (!role) return { ok: false as const, error: "Describe the AI Agent role." };
  if (!instructions) return { ok: false as const, error: "Add instructions for the AI Agent." };
  if (!AGENT_STATUSES.has(status)) return { ok: false as const, error: "Choose a valid AI Agent status." };
  if (!KNOWLEDGE_MODES.has(mode)) return { ok: false as const, error: "Choose a valid knowledge mode." };
  const allowedActions = stringArray(row.allowedActions ?? row.allowed_actions, 30).filter((item): item is WhatsAppAIActionType => ACTIONS.has(item));
  return {
    ok: true as const,
    value: {
      name,
      description: text(row.description, 1000),
      role,
      instructions,
      tone: text(row.tone, 120) || "Professional, concise and helpful",
      knowledgeMode: mode as WhatsAppAIKnowledgeMode,
      knowledgeSourceIds: stringArray(row.knowledgeSourceIds ?? row.knowledge_source_ids, 100),
      allowedActions,
      handoffRules: record(row.handoffRules ?? row.handoff_rules),
      workingHours: record(row.workingHours ?? row.working_hours),
      maxTurns: numberInRange(row.maxTurns ?? row.max_turns, 10, 1, 50),
      fallbackMessage: text(row.fallbackMessage ?? row.fallback_message, 1000) || "I’ll connect you with someone who can help.",
      modelOverride: text(row.modelOverride ?? row.model_override, 160) || null,
      status: status as WhatsAppAIAgentStatus,
    },
  };
}

function stripCodeFence(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export function parseWhatsAppAIResponse(value: string, allowedActions: readonly WhatsAppAIActionType[] = WHATSAPP_AI_ACTION_TYPES): WhatsAppAIResponse {
  const allowed = new Set<string>(allowedActions);
  let parsed: Record<string, unknown> = {};
  try {
    parsed = record(JSON.parse(stripCodeFence(value)));
  } catch {
    return { reply: text(value, 4096), summary: "", handoff: false, actions: [] };
  }
  const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
  const actions: WhatsAppAIProposedAction[] = [];
  for (const raw of rawActions.slice(0, 12)) {
    const action = record(raw);
    const type = text(action.type, 60).toUpperCase();
    if (!ACTIONS.has(type) || !allowed.has(type)) continue;
    actions.push({ type: type as WhatsAppAIActionType, payload: record(action.payload) });
  }
  return {
    reply: text(parsed.reply, 4096),
    summary: text(parsed.summary, 4000),
    handoff: parsed.handoff === true,
    actions,
  };
}

export function buildWhatsAppAIJsonContract() {
  return `Return ONLY valid JSON with this exact shape: {"reply":"message to customer","summary":"short internal summary","handoff":false,"actions":[{"type":"ACTION_NAME","payload":{}}]}. Never include markdown. If no action is needed, actions must be an empty array.`;
}
