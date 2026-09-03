import { readWhatsAppRows, mutateWhatsAppRest } from "@/app/admin/whatsapp/data";
import type { WhatsAppAIFeature, WhatsAppAISettings } from "./aiModel";

export type WhatsAppAIProviderMessage = { role: "system" | "user" | "assistant"; content: string };
export type WhatsAppAIGatewayModel = {
  id: string;
  name: string;
  provider: string;
  type: string;
  inputPrice: number | null;
  outputPrice: number | null;
  contextWindow: number | null;
  maxTokens: number | null;
};
export type WhatsAppAIGatewayCredits =
  | { ok: true; balanceUsd: number; totalUsedUsd: number }
  | { ok: false; error: string };
export type WhatsAppAIProviderStatus = {
  ready: boolean;
  paidUsageLocked: boolean;
  billingMode: WhatsAppAISettings["billingMode"];
  credits: WhatsAppAIGatewayCredits | null;
  selectedModel: string | null;
  modelCount: number;
  error?: string;
};
export type WhatsAppAIProviderResult =
  | { ok: true; text: string; model: string; inputTokens: number | null; outputTokens: number | null; estimatedCostUsd: number | null; latencyMs: number; creditBalanceUsd: number | null }
  | { ok: false; code: "DISABLED" | "NOT_CONFIGURED" | "DAILY_LIMIT" | "BUDGET_DISABLED" | "MONTHLY_LIMIT" | "FREE_CREDITS_EXHAUSTED" | "CREDITS_UNAVAILABLE" | "MODEL_UNAVAILABLE" | "PROVIDER_ERROR"; error: string };

type ModelCache = { expiresAt: number; models: WhatsAppAIGatewayModel[] };
let modelCache: ModelCache | null = null;
let creditsCache: { expiresAt: number; value: WhatsAppAIGatewayCredits } | null = null;

function authToken() {
  return process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || "";
}

export function isWhatsAppAIProviderReady() {
  return Boolean(authToken());
}

function finite(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function listWhatsAppAIGatewayModels(force = false): Promise<WhatsAppAIGatewayModel[]> {
  const now = Date.now();
  if (!force && modelCache && modelCache.expiresAt > now) return modelCache.models;
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", { cache: "no-store" });
    if (!response.ok) return modelCache?.models || [];
    const payload = await response.json() as { data?: Array<Record<string, unknown>>; models?: Array<Record<string, unknown>> };
    const models = (payload.data || payload.models || []).map((item) => {
      const pricing = item.pricing && typeof item.pricing === "object" ? item.pricing as Record<string, unknown> : {};
      const id = typeof item.id === "string" ? item.id : "";
      return {
        id,
        name: typeof item.name === "string" ? item.name : id,
        provider: typeof item.owned_by === "string" ? item.owned_by : id.split("/")[0] || "unknown",
        type: typeof item.type === "string" ? item.type : "language",
        inputPrice: finite(pricing.input),
        outputPrice: finite(pricing.output),
        contextWindow: finite(item.context_window),
        maxTokens: finite(item.max_tokens),
      } satisfies WhatsAppAIGatewayModel;
    }).filter((model) => model.id && model.type === "language");
    modelCache = { expiresAt: now + 6 * 60 * 60 * 1000, models };
    return models;
  } catch {
    return modelCache?.models || [];
  }
}

function modelQualityScore(model: WhatsAppAIGatewayModel, feature: WhatsAppAIFeature | string) {
  const id = model.id.toLowerCase();
  let score = 0;
  if (id.includes("flash-lite")) score += 130;
  else if (id.includes("flash")) score += 110;
  if (id.includes("nano")) score += 100;
  if (id.includes("mini")) score += 80;
  if (id.includes("gemini")) score += 25;
  if (id.includes("gpt")) score += 15;
  if (id.includes("preview")) score -= 12;
  if (feature === "AGENT" || feature === "AUTOMATION") {
    if (id.includes("pro")) score += 18;
    if (id.includes("sonnet")) score += 14;
  } else if (id.includes("lite") || id.includes("nano")) score += 20;
  const input = model.inputPrice ?? Number.POSITIVE_INFINITY;
  const output = model.outputPrice ?? Number.POSITIVE_INFINITY;
  if (Number.isFinite(input) && Number.isFinite(output)) score += Math.max(0, 60 - (input * 1_000_000 + output * 1_000_000) * 0.25);
  else score -= 100;
  return score;
}

export function rankWhatsAppAIModels(models: WhatsAppAIGatewayModel[], feature: WhatsAppAIFeature | string) {
  return [...models]
    .filter((model) => model.inputPrice !== null && model.outputPrice !== null)
    .sort((a, b) => modelQualityScore(b, feature) - modelQualityScore(a, feature));
}

export function estimateWhatsAppAIMaxCost(input: {
  messages: WhatsAppAIProviderMessage[];
  maxOutputTokens: number;
  model: WhatsAppAIGatewayModel;
}) {
  if (input.model.inputPrice === null || input.model.outputPrice === null) return null;
  const inputCharacters = input.messages.reduce((sum, message) => sum + message.content.length, 0);
  const estimatedInputTokens = Math.ceil(inputCharacters / 3.6) + input.messages.length * 8;
  return estimatedInputTokens * input.model.inputPrice + input.maxOutputTokens * input.model.outputPrice;
}

export async function getWhatsAppAIGatewayCredits(force = false): Promise<WhatsAppAIGatewayCredits> {
  const token = authToken();
  if (!token) return { ok: false, error: "AI Gateway authentication is not configured." };
  const now = Date.now();
  if (!force && creditsCache && creditsCache.expiresAt > now) return creditsCache.value;
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const value = { ok: false as const, error: `AI credit check failed with HTTP ${response.status}.` };
      creditsCache = { expiresAt: now + 30_000, value };
      return value;
    }
    const payload = await response.json() as { balance?: unknown; total_used?: unknown };
    const balanceUsd = Number(payload.balance);
    const totalUsedUsd = Number(payload.total_used);
    if (!Number.isFinite(balanceUsd) || !Number.isFinite(totalUsedUsd)) {
      const value = { ok: false as const, error: "AI Gateway returned an invalid credit balance." };
      creditsCache = { expiresAt: now + 30_000, value };
      return value;
    }
    const value = { ok: true as const, balanceUsd, totalUsedUsd };
    creditsCache = { expiresAt: now + 60_000, value };
    return value;
  } catch {
    const value = { ok: false as const, error: "AI Gateway credit balance is temporarily unavailable." };
    creditsCache = { expiresAt: now + 30_000, value };
    return value;
  }
}

async function currentUsage(settings: WhatsAppAISettings) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));
  const [daily, monthly] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_usage?created_at=gte.${encodeURIComponent(dayStart.toISOString())}&select=id&limit=${settings.dailyRequestLimit + 1}`),
    readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_usage?created_at=gte.${encodeURIComponent(monthStart.toISOString())}&select=estimated_cost_usd&limit=10000`),
  ]);
  const monthlySpend = (monthly || []).reduce((sum, row) => {
    const value = Number(row.estimated_cost_usd);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return { dailyCount: daily?.length ?? 0, monthlySpend };
}

async function resolveModelPlan(feature: WhatsAppAIFeature | string, override?: string) {
  const models = await listWhatsAppAIGatewayModels();
  if (override && override !== "AUTO") {
    const explicit = models.find((model) => model.id === override);
    if (explicit) return { primary: explicit, fallbacks: [] as WhatsAppAIGatewayModel[], models };
  }
  const ranked = rankWhatsAppAIModels(models, feature);
  return { primary: ranked[0] || null, fallbacks: ranked.slice(1, 3), models };
}

export async function getWhatsAppAIProviderStatus(settings: WhatsAppAISettings): Promise<WhatsAppAIProviderStatus> {
  if (!isWhatsAppAIProviderReady()) return { ready: false, paidUsageLocked: settings.billingMode !== "BUDGET_CAPPED", billingMode: settings.billingMode, credits: null, selectedModel: null, modelCount: 0, error: "AI authentication is not configured." };
  const [credits, plan] = await Promise.all([getWhatsAppAIGatewayCredits(), resolveModelPlan("ASSIST", settings.model)]);
  return {
    ready: Boolean(plan.primary) && (settings.billingMode !== "FREE_ONLY" || credits.ok),
    paidUsageLocked: settings.billingMode !== "BUDGET_CAPPED",
    billingMode: settings.billingMode,
    credits,
    selectedModel: plan.primary?.id || null,
    modelCount: plan.models.length,
    ...(!plan.primary ? { error: "No priced language model is currently available through AI routing." } : {}),
  };
}

export async function callWhatsAppAIProvider(input: {
  settings: WhatsAppAISettings;
  feature: WhatsAppAIFeature | string;
  messages: WhatsAppAIProviderMessage[];
  model?: string;
  maxOutputTokens?: number;
  agentId?: string;
  conversationId?: string;
  runId?: string;
}): Promise<WhatsAppAIProviderResult> {
  if (!input.settings.enabled) return { ok: false, code: "DISABLED", error: "AI is disabled in workspace settings." };
  const token = authToken();
  if (!token) return { ok: false, code: "NOT_CONFIGURED", error: "AI authentication is not configured on this deployment." };
  if (input.settings.billingMode === "DISABLED") return { ok: false, code: "BUDGET_DISABLED", error: "AI usage is disabled for this workspace." };

  const usage = await currentUsage(input.settings);
  if (usage.dailyCount >= input.settings.dailyRequestLimit) return { ok: false, code: "DAILY_LIMIT", error: "The workspace AI daily request limit has been reached." };
  if (input.settings.billingMode === "BUDGET_CAPPED") {
    if (input.settings.monthlyBudgetUsd <= 0) return { ok: false, code: "BUDGET_DISABLED", error: "Set a positive monthly AI budget before using Budget Capped mode." };
    if (usage.monthlySpend >= input.settings.monthlyBudgetUsd) return { ok: false, code: "MONTHLY_LIMIT", error: "The workspace AI monthly budget has been reached." };
  }

  const plan = await resolveModelPlan(input.feature, input.model || input.settings.model);
  if (!plan.primary) return { ok: false, code: "MODEL_UNAVAILABLE", error: "No suitable priced language model is available through automatic AI routing." };
  const maxTokens = Math.min(input.settings.maxOutputTokens, Math.max(50, input.maxOutputTokens || input.settings.maxOutputTokens), plan.primary.maxTokens || 4000);
  let credits: WhatsAppAIGatewayCredits | null = null;
  if (input.settings.billingMode === "FREE_ONLY") {
    credits = await getWhatsAppAIGatewayCredits(true);
    if (!credits.ok) return { ok: false, code: "CREDITS_UNAVAILABLE", error: "Free AI credits could not be verified, so AI was paused to prevent paid usage." };
    const projected = estimateWhatsAppAIMaxCost({ messages: input.messages, maxOutputTokens: maxTokens, model: plan.primary });
    if (projected === null) return { ok: false, code: "MODEL_UNAVAILABLE", error: "The selected AI route has no verified price, so Free Only mode refused the request." };
    if (credits.balanceUsd - projected < input.settings.freeCreditFloorUsd) {
      return { ok: false, code: "FREE_CREDITS_EXHAUSTED", error: "Free AI allowance is too low for this request. AI has been paused to prevent paid usage." };
    }
  }

  const startedAt = Date.now();
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: plan.primary.id,
        ...(input.settings.billingMode === "BUDGET_CAPPED" && plan.fallbacks.length ? { models: plan.fallbacks.map((model) => model.id) } : {}),
        messages: input.messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        stream: false,
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as null | {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
      error?: { message?: string };
    };
    if (!response.ok) {
      const message = payload?.error?.message?.trim().slice(0, 500) || `AI Gateway request failed with HTTP ${response.status}.`;
      return { ok: false, code: "PROVIDER_ERROR", error: message };
    }
    const responseText = payload?.choices?.[0]?.message?.content?.trim() || "";
    if (!responseText) return { ok: false, code: "PROVIDER_ERROR", error: "The AI provider returned an empty response." };
    const inputTokens = Number(payload?.usage?.prompt_tokens ?? payload?.usage?.input_tokens);
    const outputTokens = Number(payload?.usage?.completion_tokens ?? payload?.usage?.output_tokens);
    const normalizedInput = Number.isFinite(inputTokens) ? inputTokens : null;
    const normalizedOutput = Number.isFinite(outputTokens) ? outputTokens : null;
    const actualModel = plan.models.find((model) => model.id === (payload?.model || plan.primary.id)) || plan.primary;
    const estimatedCostUsd = actualModel.inputPrice !== null && actualModel.outputPrice !== null && normalizedInput !== null && normalizedOutput !== null
      ? normalizedInput * actualModel.inputPrice + normalizedOutput * actualModel.outputPrice
      : null;
    const latencyMs = Date.now() - startedAt;

    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_ai_usage",
      body: {
        run_id: input.runId || null,
        agent_id: input.agentId || null,
        conversation_id: input.conversationId || null,
        feature: input.feature,
        provider: "VERCEL_AI_GATEWAY",
        model: payload?.model || plan.primary.id,
        input_tokens: normalizedInput,
        output_tokens: normalizedOutput,
        estimated_cost_usd: estimatedCostUsd,
      },
    });

    if (input.settings.billingMode === "FREE_ONLY") creditsCache = null;
    return { ok: true, text: responseText, model: payload?.model || plan.primary.id, inputTokens: normalizedInput, outputTokens: normalizedOutput, estimatedCostUsd, latencyMs, creditBalanceUsd: credits?.ok ? credits.balanceUsd : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach the AI provider.";
    return { ok: false, code: "PROVIDER_ERROR", error: message.slice(0, 500) };
  }
}
