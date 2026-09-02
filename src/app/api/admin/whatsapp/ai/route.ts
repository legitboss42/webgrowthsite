import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canWhatsAppAccessConversation, getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { generateWhatsAppAI, loadWhatsAppAIAgents, loadWhatsAppAISettings } from "@/lib/whatsapp/aiRuntime";
import { normalizeWhatsAppAISettings, validateWhatsAppAIAgentInput } from "@/lib/whatsapp/aiModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function text(value: unknown, max = 4000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function record(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
async function json(request: Request) { try { return await request.json() as Record<string, unknown>; } catch { return null; } }
function providerReady() { return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()); }

async function guard(request: Request, mutation = false) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (mutation && !isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

function requireSupervisor(access: Awaited<ReturnType<typeof getWhatsAppWorkspaceAccess>>) {
  return Boolean(access && canWhatsAppRoleSuperviseTeam(access.role));
}

function chunkKnowledge(content: string) {
  const normalized = content.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\n+/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > 1800 && current) { chunks.push(current); current = paragraph; }
    else current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) chunks.push(current);
  return chunks.flatMap((item) => item.length <= 2200 ? [item] : Array.from({ length: Math.ceil(item.length / 1800) }, (_, index) => item.slice(index * 1800, (index + 1) * 1800))).slice(0, 250);
}

async function usageSummary(days = 30) {
  const safeDays = Math.min(90, Math.max(1, Math.round(days)));
  const since = new Date(Date.now() - safeDays * 86400000).toISOString();
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_runs?created_at=gte.${encodeURIComponent(since)}&select=id,feature,status,agent_id,input_tokens,output_tokens,estimated_cost_usd,metadata,created_at&order=created_at.desc&limit=10000`);
  const usage = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_usage?created_at=gte.${encodeURIComponent(since)}&select=feature,model,input_tokens,output_tokens,estimated_cost_usd,created_at&order=created_at.desc&limit=10000`);
  const byFeature: Record<string, number> = {};
  let succeeded = 0, failed = 0, handoffs = 0, inputTokens = 0, outputTokens = 0, estimatedCost = 0;
  for (const row of rows || []) {
    const feature = text(row.feature, 40) || "UNKNOWN"; byFeature[feature] = (byFeature[feature] || 0) + 1;
    if (row.status === "SUCCEEDED") succeeded += 1; if (row.status === "FAILED") failed += 1;
    if (record(row.metadata).handoff === true) handoffs += 1;
  }
  for (const row of usage || []) {
    inputTokens += Number(row.input_tokens) || 0; outputTokens += Number(row.output_tokens) || 0; estimatedCost += Number(row.estimated_cost_usd) || 0;
  }
  return { days: safeDays, requests: usage?.length || 0, runs: rows?.length || 0, succeeded, failed, handoffs, inputTokens, outputTokens, estimatedCostUsd: estimatedCost, byFeature };
}

export async function GET(request: Request) {
  const auth = await guard(request); if ("response" in auth) return auth.response;
  const url = new URL(request.url); const view = text(url.searchParams.get("view"), 40).toLowerCase() || "status";
  if (view === "status") {
    const settings = await loadWhatsAppAISettings();
    return NextResponse.json({ settings, providerReady: providerReady(), supervisor: canWhatsAppRoleSuperviseTeam(auth.access.role) });
  }
  if (view === "conversation") {
    const conversationId = text(url.searchParams.get("conversationId"), 100);
    if (!conversationId || !await canWhatsAppAccessConversation(auth.access, conversationId, { allowUnassigned: true })) return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,ai_handling_mode,ai_agent_id,ai_turn_count,human_review_required&limit=1`);
    return NextResponse.json({ conversation: rows?.[0] || null });
  }
  if (!canWhatsAppRoleSuperviseTeam(auth.access.role)) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });
  if (view === "dashboard") {
    const [settings, agents, knowledge, usage] = await Promise.all([
      loadWhatsAppAISettings(), loadWhatsAppAIAgents(),
      readWhatsAppRows<Record<string, unknown>>("whatsapp_ai_knowledge_sources?select=id,title,source_type,status,created_at,updated_at&order=updated_at.desc&limit=500"),
      usageSummary(Number(url.searchParams.get("days")) || 30),
    ]);
    return NextResponse.json({ settings, agents, knowledge: knowledge || [], usage, providerReady: providerReady() });
  }
  return NextResponse.json({ error: "Unknown AI view." }, { status: 400 });
}

export async function POST(request: Request) {
  const auth = await guard(request, true); if ("response" in auth) return auth.response;
  const input = await json(request); if (!input) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const action = text(input.action, 50).toUpperCase();

  if (action === "GENERATE") {
    const feature = text(input.feature, 30).toUpperCase();
    if (!new Set(["ASSIST", "SUMMARY", "SANDBOX"]).has(feature)) return NextResponse.json({ error: "Choose a supported AI generation feature." }, { status: 400 });
    const conversationId = text(input.conversationId, 100) || undefined;
    if (conversationId && !await canWhatsAppAccessConversation(auth.access, conversationId, { allowUnassigned: true })) return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    if (feature === "SANDBOX" && !canWhatsAppRoleSuperviseTeam(auth.access.role)) return NextResponse.json({ error: "Owner or Manager access is required for AI Agent testing." }, { status: 403 });
    const result = await generateWhatsAppAI({ feature: feature as "ASSIST" | "SUMMARY" | "SANDBOX", conversationId, agentId: text(input.agentId, 100) || undefined, prompt: text(input.prompt, 4000), mode: text(input.mode, 60), saveSummary: input.saveSummary === true });
    return result.ok ? NextResponse.json(result) : NextResponse.json(result, { status: result.code === "BUDGET_DISABLED" || result.code === "DISABLED" ? 409 : 502 });
  }

  if (action === "TAKEOVER") {
    const conversationId = text(input.conversationId, 100);
    if (!conversationId || !await canWhatsAppAccessConversation(auth.access, conversationId, { allowUnassigned: true })) return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, body: { ai_handling_mode: "HUMAN", ai_turn_count: 0, ai_last_handoff_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (!requireSupervisor(auth.access)) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });

  if (action === "SAVE_SETTINGS") {
    const currentRows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_ai_settings?id=eq.default&select=*&limit=1");
    const merged = { ...(currentRows?.[0] || {}),
      enabled: input.enabled === true, provider: "VERCEL_AI_GATEWAY", model: text(input.model, 160) || "google/gemini-3.5-flash-lite",
      assist_enabled: input.assistEnabled !== false, agents_enabled: input.agentsEnabled === true,
      default_knowledge_mode: text(input.defaultKnowledgeMode, 40).toUpperCase() === "KNOWLEDGE_PLUS_GENERAL" ? "KNOWLEDGE_PLUS_GENERAL" : "KNOWLEDGE_ONLY",
      daily_request_limit: Math.min(10000, Math.max(1, Number(input.dailyRequestLimit) || 50)),
      monthly_budget_usd: Math.max(0, Number(input.monthlyBudgetUsd) || 0), max_output_tokens: Math.min(4000, Math.max(50, Number(input.maxOutputTokens) || 350)),
      max_agent_turns: Math.min(50, Math.max(1, Number(input.maxAgentTurns) || 10)), updated_by_member_id: auth.access.memberId, updated_at: new Date().toISOString(),
    };
    const normalized = normalizeWhatsAppAISettings(merged);
    const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: "whatsapp_ai_settings?id=eq.default", body: {
      enabled: normalized.enabled, provider: normalized.provider, model: normalized.model, assist_enabled: normalized.assistEnabled, agents_enabled: normalized.agentsEnabled,
      default_knowledge_mode: normalized.defaultKnowledgeMode, daily_request_limit: normalized.dailyRequestLimit, monthly_budget_usd: normalized.monthlyBudgetUsd,
      max_output_tokens: normalized.maxOutputTokens, max_agent_turns: normalized.maxAgentTurns, updated_by_member_id: auth.access.memberId, updated_at: new Date().toISOString(),
    } });
    return result.ok ? NextResponse.json({ ok: true, settings: normalized }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "CREATE_AGENT" || action === "UPDATE_AGENT") {
    const checked = validateWhatsAppAIAgentInput(input); if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const id = action === "UPDATE_AGENT" ? text(input.id, 100) : randomUUID(); if (!id) return NextResponse.json({ error: "AI Agent ID is required." }, { status: 400 });
    const body = { name: checked.value.name, description: checked.value.description, role: checked.value.role, instructions: checked.value.instructions, tone: checked.value.tone,
      knowledge_mode: checked.value.knowledgeMode, knowledge_source_ids: checked.value.knowledgeSourceIds, allowed_actions: checked.value.allowedActions, handoff_rules: checked.value.handoffRules,
      working_hours: checked.value.workingHours, max_turns: checked.value.maxTurns, fallback_message: checked.value.fallbackMessage, model_override: checked.value.modelOverride, status: checked.value.status,
      updated_by_member_id: auth.access.memberId, updated_at: new Date().toISOString(), ...(action === "CREATE_AGENT" ? { id, created_by_member_id: auth.access.memberId } : {}) };
    const result = await mutateWhatsAppRest({ method: action === "CREATE_AGENT" ? "POST" : "PATCH", pathAndQuery: action === "CREATE_AGENT" ? "whatsapp_ai_agents" : `whatsapp_ai_agents?id=eq.${encodeURIComponent(id)}`, body });
    return result.ok ? NextResponse.json({ ok: true, id }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "DELETE_AGENT") {
    const id = text(input.id, 100); if (!id) return NextResponse.json({ error: "AI Agent ID is required." }, { status: 400 });
    const assigned = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?ai_agent_id=eq.${encodeURIComponent(id)}&ai_handling_mode=eq.AI&select=id&limit=1`);
    if (assigned?.length) return NextResponse.json({ error: "Take over conversations using this AI Agent before deleting it." }, { status: 409 });
    const result = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_ai_agents?id=eq.${encodeURIComponent(id)}` });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "CREATE_KNOWLEDGE") {
    const title = text(input.title, 200); const content = text(input.content, 100000); if (!title || !content) return NextResponse.json({ error: "Knowledge title and content are required." }, { status: 400 });
    const chunks = chunkKnowledge(content); if (!chunks.length) return NextResponse.json({ error: "Knowledge content is empty." }, { status: 400 });
    const id = randomUUID();
    const source = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_ai_knowledge_sources", body: { id, title, source_type: "MANUAL", source_uri: null, content, status: "READY", created_by_member_id: auth.access.memberId, updated_by_member_id: auth.access.memberId } });
    if (!source.ok) return NextResponse.json({ error: source.message }, { status: 500 });
    for (let index = 0; index < chunks.length; index += 50) {
      const batch = chunks.slice(index, index + 50).map((chunk, offset) => ({ source_id: id, chunk_index: index + offset, content: chunk }));
      const saved = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_ai_knowledge_chunks", body: batch });
      if (!saved.ok) return NextResponse.json({ error: "Knowledge source was created but its search chunks could not be saved." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id, chunks: chunks.length });
  }

  if (action === "DELETE_KNOWLEDGE") {
    const id = text(input.id, 100); if (!id) return NextResponse.json({ error: "Knowledge source ID is required." }, { status: 400 });
    const result = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_ai_knowledge_sources?id=eq.${encodeURIComponent(id)}` });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "ASSIGN_AI") {
    const conversationId = text(input.conversationId, 100); const agentId = text(input.agentId, 100);
    if (!conversationId || !agentId) return NextResponse.json({ error: "Conversation and AI Agent are required." }, { status: 400 });
    const agents = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_agents?id=eq.${encodeURIComponent(agentId)}&status=eq.ACTIVE&select=id&limit=1`);
    if (!agents?.[0]) return NextResponse.json({ error: "Only an Active AI Agent can handle a live conversation." }, { status: 409 });
    const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, body: { ai_agent_id: agentId, ai_handling_mode: "AI", ai_turn_count: 0, human_review_required: false, updated_at: new Date().toISOString() } });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown AI action." }, { status: 400 });
}
