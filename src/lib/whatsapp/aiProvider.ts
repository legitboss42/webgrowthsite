import { readWhatsAppRows, mutateWhatsAppRest } from "@/app/admin/whatsapp/data";
import type { WhatsAppAISettings } from "./aiModel";

export type WhatsAppAIProviderMessage = { role: "system" | "user" | "assistant"; content: string };
export type WhatsAppAIProviderResult =
  | { ok: true; text: string; model: string; inputTokens: number | null; outputTokens: number | null; estimatedCostUsd: number | null }
  | { ok: false; code: "DISABLED" | "NOT_CONFIGURED" | "DAILY_LIMIT" | "BUDGET_DISABLED" | "MONTHLY_LIMIT" | "PROVIDER_ERROR"; error: string };

type Pricing = { input: number; output: number };
let pricingCache: { expiresAt: number; rows: Map<string, Pricing> } | null = null;

function authToken() {
  return process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || "";
}

async function getPricing(model: string): Promise<Pricing | null> {
  const now = Date.now();
  if (pricingCache && pricingCache.expiresAt > now) return pricingCache.rows.get(model) || null;
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: Array<{ id?: string; pricing?: { input?: string | number; output?: string | number } }>; models?: Array<{ id?: string; pricing?: { input?: string | number; output?: string | number } }> };
    const rows = new Map<string, Pricing>();
    for (const item of payload.data || payload.models || []) {
      if (!item.id || !item.pricing) continue;
      const input = Number(item.pricing.input);
      const output = Number(item.pricing.output);
      if (Number.isFinite(input) && Number.isFinite(output)) rows.set(item.id, { input, output });
    }
    pricingCache = { expiresAt: now + 6 * 60 * 60 * 1000, rows };
    return rows.get(model) || null;
  } catch {
    return null;
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

export async function callWhatsAppAIProvider(input: {
  settings: WhatsAppAISettings;
  feature: string;
  messages: WhatsAppAIProviderMessage[];
  model?: string;
  maxOutputTokens?: number;
  agentId?: string;
  conversationId?: string;
  runId?: string;
}): Promise<WhatsAppAIProviderResult> {
  if (!input.settings.enabled) return { ok: false, code: "DISABLED", error: "AI is disabled in workspace settings." };
  const token = authToken();
  if (!token) return { ok: false, code: "NOT_CONFIGURED", error: "AI Gateway authentication is not configured on this deployment." };
  if (input.settings.monthlyBudgetUsd <= 0) return { ok: false, code: "BUDGET_DISABLED", error: "AI spending is locked at $0. Set an explicit budget before enabling real model calls." };

  const usage = await currentUsage(input.settings);
  if (usage.dailyCount >= input.settings.dailyRequestLimit) return { ok: false, code: "DAILY_LIMIT", error: "The workspace AI daily request limit has been reached." };
  if (usage.monthlySpend >= input.settings.monthlyBudgetUsd) return { ok: false, code: "MONTHLY_LIMIT", error: "The workspace AI monthly budget has been reached." };

  const model = input.model?.trim() || input.settings.model;
  const maxTokens = Math.min(input.settings.maxOutputTokens, Math.max(50, input.maxOutputTokens || input.settings.maxOutputTokens));
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: input.messages, max_tokens: maxTokens, temperature: 0.2, stream: false }),
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
    const text = payload?.choices?.[0]?.message?.content?.trim() || "";
    if (!text) return { ok: false, code: "PROVIDER_ERROR", error: "The AI provider returned an empty response." };
    const inputTokens = Number(payload?.usage?.prompt_tokens ?? payload?.usage?.input_tokens);
    const outputTokens = Number(payload?.usage?.completion_tokens ?? payload?.usage?.output_tokens);
    const normalizedInput = Number.isFinite(inputTokens) ? inputTokens : null;
    const normalizedOutput = Number.isFinite(outputTokens) ? outputTokens : null;
    const pricing = await getPricing(payload?.model || model);
    const estimatedCostUsd = pricing && normalizedInput !== null && normalizedOutput !== null
      ? normalizedInput * pricing.input + normalizedOutput * pricing.output
      : null;

    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_ai_usage",
      body: {
        run_id: input.runId || null,
        agent_id: input.agentId || null,
        conversation_id: input.conversationId || null,
        feature: input.feature,
        provider: "VERCEL_AI_GATEWAY",
        model: payload?.model || model,
        input_tokens: normalizedInput,
        output_tokens: normalizedOutput,
        estimated_cost_usd: estimatedCostUsd,
      },
    });

    return { ok: true, text, model: payload?.model || model, inputTokens: normalizedInput, outputTokens: normalizedOutput, estimatedCostUsd };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach the AI provider.";
    return { ok: false, code: "PROVIDER_ERROR", error: message.slice(0, 500) };
  }
}
