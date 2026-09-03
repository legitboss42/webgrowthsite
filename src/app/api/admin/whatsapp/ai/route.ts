import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canWhatsAppAccessConversation, getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { getWhatsAppAIProviderStatus, isWhatsAppAIProviderReady } from "@/lib/whatsapp/aiProvider";
import { approveWhatsAppAIAction, generateWhatsAppAI, loadWhatsAppAIAgents, loadWhatsAppAISettings, rejectWhatsAppAIAction } from "@/lib/whatsapp/aiRuntime";
import { normalizeWhatsAppAISettings, validateWhatsAppAIAgentInput, WHATSAPP_AI_BILLING_MODES } from "@/lib/whatsapp/aiModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function text(value: unknown, max = 4000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function record(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
async function json(request: Request) { try { return await request.json() as Record<string, unknown>; } catch { return null; } }

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

async function saveKnowledgeSource(input: { title: string; content: string; sourceType: "MANUAL" | "URL" | "DOCUMENT"; sourceUri?: string | null; metadata?: Record<string, unknown>; memberId?: string | null }) {
  const chunks = chunkKnowledge(input.content);
  if (!chunks.length) return { ok: false as const, error: "Knowledge content is empty." };
  const id = randomUUID();
  const source = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_ai_knowledge_sources", body: {
    id,
    title: input.title,
    source_type: input.sourceType,
    source_uri: input.sourceUri || null,
    content: input.content,
    metadata: input.metadata || {},
    status: "READY",
    created_by_member_id: input.memberId || null,
    updated_by_member_id: input.memberId || null,
  } });
  if (!source.ok) return { ok: false as const, error: source.message };
  for (let index = 0; index < chunks.length; index += 50) {
    const batch = chunks.slice(index, index + 50).map((chunk, offset) => ({ source_id: id, chunk_index: index + offset, content: chunk }));
    const saved = await mutateWhatsAppRest({ method: "POST", pathAndQuery: "whatsapp_ai_knowledge_chunks", body: batch });
    if (!saved.ok) {
      await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_ai_knowledge_sources?id=eq.${encodeURIComponent(id)}` });
      return { ok: false as const, error: "Knowledge chunks could not be saved." };
    }
  }
  return { ok: true as const, id, chunks: chunks.length };
}

function isBlockedKnowledgeHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "0.0.0.0" || host === "::1" || host.endsWith(".local")) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const match = host.match(/^172\.(\d+)\./); if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

function htmlToText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchPublicKnowledgeUrl(rawUrl: string) {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return { ok: false as const, error: "Enter a valid public website URL." }; }
  if (!new Set(["http:", "https:"]).has(url.protocol) || url.username || url.password || isBlockedKnowledgeHost(url.hostname)) return { ok: false as const, error: "Only public HTTP/HTTPS website URLs can be imported." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": "WebGrowthAIKnowledge/1.0" }, cache: "no-store" });
    if (!response.ok) return { ok: false as const, error: `Website import failed with HTTP ${response.status}.` };
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain") && !type.includes("application/json")) return { ok: false as const, error: "This URL does not return importable text content." };
    const raw = (await response.text()).slice(0, 400_000);
    const content = type.includes("text/html") ? htmlToText(raw) : raw.trim();
    if (!content) return { ok: false as const, error: "No readable knowledge content was found at this URL." };
    return { ok: true as const, content: content.slice(0, 100_000), finalUrl: response.url || url.toString() };
  } catch {
    return { ok: false as const, error: "The website could not be reached safely." };
  } finally { clearTimeout(timeout); }
}

async function usageSummary(days = 30) {
  const safeDays = Math.min(90, Math.max(1, Math.round(days)));
  const since = new Date(Date.now() - safeDays * 86400000).toISOString();
  const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_runs?created_at=gte.${encodeURIComponent(since)}&select=id,feature,status,agent_id,input_tokens,output_tokens,estimated_cost_usd,metadata,created_at&order=created_at.desc&limit=10000`);
  const usage = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_usage?created_at=gte.${encodeURIComponent(since)}&select=feature,model,input_tokens,output_tokens,estimated_cost_usd,created_at&order=created_at.desc&limit=10000`);
  const byFeature: Record<string, number> = {};
  let succeeded = 0, failed = 0, handoffs = 0, objectivesCompleted = 0, inputTokens = 0, outputTokens = 0, estimatedCost = 0;
  for (const row of rows || []) {
    const feature = text(row.feature, 40) || "UNKNOWN"; byFeature[feature] = (byFeature[feature] || 0) + 1;
    if (row.status === "SUCCEEDED") succeeded += 1; if (row.status === "FAILED") failed += 1;
    const metadata = record(row.metadata);
    if (metadata.handoff === true) handoffs += 1;
    if (metadata.objectiveComplete === true) objectivesCompleted += 1;
  }
  for (const row of usage || []) {
    inputTokens += Number(row.input_tokens) || 0; outputTokens += Number(row.output_tokens) || 0; estimatedCost += Number(row.estimated_cost_usd) || 0;
  }
  return { days: safeDays, requests: usage?.length || 0, runs: rows?.length || 0, succeeded, failed, handoffs, objectivesCompleted, inputTokens, outputTokens, estimatedCostUsd: estimatedCost, byFeature };
}

async function dashboardPayload(days: number) {
  const [settings, agents, knowledge, usage, approvals] = await Promise.all([
    loadWhatsAppAISettings(),
    loadWhatsAppAIAgents(),
    readWhatsAppRows<Record<string, unknown>>("whatsapp_ai_knowledge_sources?select=id,title,source_type,source_uri,metadata,status,created_at,updated_at&order=updated_at.desc&limit=500"),
    usageSummary(days),
    readWhatsAppRows<Record<string, unknown>>("whatsapp_ai_actions?status=eq.PROPOSED&select=id,run_id,action_type,proposed_payload,created_at&order=created_at.desc&limit=200"),
  ]);
  const provider = await getWhatsAppAIProviderStatus(settings);
  return { settings, agents, knowledge: knowledge || [], usage, approvals: approvals || [], provider };
}

export async function GET(request: Request) {
  const auth = await guard(request); if ("response" in auth) return auth.response;
  const url = new URL(request.url); const view = text(url.searchParams.get("view"), 40).toLowerCase() || "status";
  if (view === "status") {
    const settings = await loadWhatsAppAISettings();
    const provider = await getWhatsAppAIProviderStatus(settings);
    return NextResponse.json({ settings, providerReady: isWhatsAppAIProviderReady(), provider, supervisor: canWhatsAppRoleSuperviseTeam(auth.access.role) });
  }
  if (view === "conversation") {
    const conversationId = text(url.searchParams.get("conversationId"), 100);
    if (!conversationId || !await canWhatsAppAccessConversation(auth.access, conversationId, { allowUnassigned: true })) return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    const rows = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,ai_handling_mode,ai_agent_id,ai_turn_count,human_review_required&limit=1`);
    return NextResponse.json({ conversation: rows?.[0] || null });
  }
  if (!canWhatsAppRoleSuperviseTeam(auth.access.role)) return NextResponse.json({ error: "Owner or Manager access is required." }, { status: 403 });
  if (view === "dashboard") return NextResponse.json(await dashboardPayload(Number(url.searchParams.get("days")) || 30));
  return NextResponse.json({ error: "Unknown AI view." }, { status: 400 });
}

export async function POST(request: Request) {
  const auth = await guard(request, true); if ("response" in auth) return auth.response;
  const input = await json(request); if (!input) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const action = text(input.action, 60).toUpperCase();

  if (action === "GENERATE") {
    const feature = text(input.feature, 30).toUpperCase();
    if (!new Set(["ASSIST", "SUMMARY", "SANDBOX"]).has(feature)) return NextResponse.json({ error: "Choose a supported AI generation feature." }, { status: 400 });
    const conversationId = text(input.conversationId, 100) || undefined;
    if (conversationId && !await canWhatsAppAccessConversation(auth.access, conversationId, { allowUnassigned: true })) return NextResponse.json({ error: "Conversation access denied." }, { status: 403 });
    if (feature === "SANDBOX" && !canWhatsAppRoleSuperviseTeam(auth.access.role)) return NextResponse.json({ error: "Owner or Manager access is required for AI Agent testing." }, { status: 403 });
    const result = await generateWhatsAppAI({ feature: feature as "ASSIST" | "SUMMARY" | "SANDBOX", conversationId, agentId: text(input.agentId, 100) || undefined, prompt: text(input.prompt, 12000), mode: text(input.mode, 60), saveSummary: input.saveSummary === true });
    if (result.ok) return NextResponse.json(result);
    const conflictCodes = new Set(["BUDGET_DISABLED", "DISABLED", "DAILY_LIMIT", "MONTHLY_LIMIT", "FREE_CREDITS_EXHAUSTED"]);
    return NextResponse.json(result, { status: conflictCodes.has(String(result.code)) ? 409 : 502 });
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
    const requestedBilling = text(input.billingMode, 40).toUpperCase();
    const merged = { ...(currentRows?.[0] || {}),
      enabled: input.enabled === true,
      provider: "VERCEL_AI_GATEWAY",
      model: "AUTO",
      orchestration_mode: "AUTO",
      billing_mode: WHATSAPP_AI_BILLING_MODES.includes(requestedBilling as (typeof WHATSAPP_AI_BILLING_MODES)[number]) ? requestedBilling : "FREE_ONLY",
      free_credit_floor_usd: Math.min(1000, Math.max(0, Number(input.freeCreditFloorUsd) || 0.10)),
      business_instructions: text(input.businessInstructions, 20_000),
      assist_enabled: input.assistEnabled !== false,
      agents_enabled: input.agentsEnabled === true,
      default_knowledge_mode: text(input.defaultKnowledgeMode, 40).toUpperCase() === "KNOWLEDGE_PLUS_GENERAL" ? "KNOWLEDGE_PLUS_GENERAL" : "KNOWLEDGE_ONLY",
      daily_request_limit: Math.min(10000, Math.max(1, Number(input.dailyRequestLimit) || 50)),
      monthly_budget_usd: Math.max(0, Number(input.monthlyBudgetUsd) || 0),
      max_output_tokens: Math.min(4000, Math.max(50, Number(input.maxOutputTokens) || 350)),
      max_agent_turns: Math.min(50, Math.max(1, Number(input.maxAgentTurns) || 10)),
      updated_by_member_id: auth.access.memberId,
      updated_at: new Date().toISOString(),
    };
    const normalized = normalizeWhatsAppAISettings(merged);
    const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: "whatsapp_ai_settings?id=eq.default", body: {
      enabled: normalized.enabled,
      provider: normalized.provider,
      model: "AUTO",
      orchestration_mode: "AUTO",
      billing_mode: normalized.billingMode,
      free_credit_floor_usd: normalized.freeCreditFloorUsd,
      business_instructions: normalized.businessInstructions,
      assist_enabled: normalized.assistEnabled,
      agents_enabled: normalized.agentsEnabled,
      default_knowledge_mode: normalized.defaultKnowledgeMode,
      daily_request_limit: normalized.dailyRequestLimit,
      monthly_budget_usd: normalized.monthlyBudgetUsd,
      max_output_tokens: normalized.maxOutputTokens,
      max_agent_turns: normalized.maxAgentTurns,
      updated_by_member_id: auth.access.memberId,
      updated_at: new Date().toISOString(),
    } });
    return result.ok ? NextResponse.json({ ok: true, settings: normalized, provider: await getWhatsAppAIProviderStatus(normalized) }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "CREATE_AGENT" || action === "UPDATE_AGENT") {
    const checked = validateWhatsAppAIAgentInput(input); if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const id = action === "UPDATE_AGENT" ? text(input.id, 100) : randomUUID(); if (!id) return NextResponse.json({ error: "AI Agent ID is required." }, { status: 400 });
    const body = {
      name: checked.value.name,
      description: checked.value.description,
      role: checked.value.role,
      objective: checked.value.objective,
      required_fields: checked.value.requiredFields,
      objective_completion: checked.value.objectiveCompletion,
      instructions: checked.value.instructions,
      tone: checked.value.tone,
      knowledge_mode: checked.value.knowledgeMode,
      uncertainty_mode: checked.value.uncertaintyMode,
      knowledge_source_ids: checked.value.knowledgeSourceIds,
      allowed_actions: checked.value.allowedActions,
      action_policies: checked.value.actionPolicies,
      handoff_rules: checked.value.handoffRules,
      working_hours: checked.value.workingHours,
      max_turns: checked.value.maxTurns,
      fallback_message: checked.value.fallbackMessage,
      model_override: null,
      status: checked.value.status,
      updated_by_member_id: auth.access.memberId,
      updated_at: new Date().toISOString(),
      ...(action === "CREATE_AGENT" ? { id, created_by_member_id: auth.access.memberId } : {}),
    };
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
    const title = text(input.title, 200); const content = text(input.content, 100_000);
    if (!title || !content) return NextResponse.json({ error: "Knowledge title and content are required." }, { status: 400 });
    const saved = await saveKnowledgeSource({ title, content, sourceType: "MANUAL", metadata: record(input.metadata), memberId: auth.access.memberId });
    return saved.ok ? NextResponse.json(saved) : NextResponse.json({ error: saved.error }, { status: 500 });
  }

  if (action === "IMPORT_URL_KNOWLEDGE") {
    const rawUrl = text(input.url, 2000); const title = text(input.title, 200) || rawUrl;
    const fetched = await fetchPublicKnowledgeUrl(rawUrl);
    if (!fetched.ok) return NextResponse.json({ error: fetched.error }, { status: 400 });
    const saved = await saveKnowledgeSource({ title, content: fetched.content, sourceType: "URL", sourceUri: fetched.finalUrl, metadata: { importedAt: new Date().toISOString() }, memberId: auth.access.memberId });
    return saved.ok ? NextResponse.json(saved) : NextResponse.json({ error: saved.error }, { status: 500 });
  }

  if (action === "IMPORT_DOCUMENT_KNOWLEDGE") {
    const title = text(input.title, 200); const content = text(input.content, 100_000); const fileName = text(input.fileName, 300); const mimeType = text(input.mimeType, 200);
    if (!title || !fileName || !content) return NextResponse.json({ error: "Document title, file and readable text are required." }, { status: 400 });
    const saved = await saveKnowledgeSource({ title, content, sourceType: "DOCUMENT", sourceUri: fileName, metadata: { fileName, mimeType, importedAt: new Date().toISOString() }, memberId: auth.access.memberId });
    return saved.ok ? NextResponse.json(saved) : NextResponse.json({ error: saved.error }, { status: 500 });
  }

  if (action === "DELETE_KNOWLEDGE") {
    const id = text(input.id, 100); if (!id) return NextResponse.json({ error: "Knowledge source ID is required." }, { status: 400 });
    const result = await mutateWhatsAppRest({ method: "DELETE", pathAndQuery: `whatsapp_ai_knowledge_sources?id=eq.${encodeURIComponent(id)}` });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (action === "APPROVE_ACTION" || action === "REJECT_ACTION") {
    const id = text(input.id, 100); if (!id) return NextResponse.json({ error: "AI action ID is required." }, { status: 400 });
    const result = action === "APPROVE_ACTION" ? await approveWhatsAppAIAction(id) : await rejectWhatsAppAIAction(id);
    return result.ok ? NextResponse.json(result) : NextResponse.json({ error: result.error }, { status: 409 });
  }

  if (action === "ASSIGN_AI") {
    const conversationId = text(input.conversationId, 100); const agentId = text(input.agentId, 100);
    if (!conversationId || !agentId) return NextResponse.json({ error: "Conversation and AI Agent are required." }, { status: 400 });
    const settings = await loadWhatsAppAISettings();
    if (!settings.enabled || !settings.agentsEnabled) return NextResponse.json({ error: "Enable AI and Autonomous Agents before assigning an AI Agent." }, { status: 409 });
    const agents = await readWhatsAppRows<Record<string, unknown>>(`whatsapp_ai_agents?id=eq.${encodeURIComponent(agentId)}&status=eq.ACTIVE&select=id&limit=1`);
    if (!agents?.[0]) return NextResponse.json({ error: "Only an Active AI Agent can handle a live conversation." }, { status: 409 });
    const result = await mutateWhatsAppRest({ method: "PATCH", pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`, body: { ai_agent_id: agentId, ai_handling_mode: "AI", ai_turn_count: 0, human_review_required: false, updated_at: new Date().toISOString() } });
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown AI action." }, { status: 400 });
}
