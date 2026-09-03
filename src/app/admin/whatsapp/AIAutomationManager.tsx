"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WhatsAppAIAgent, WhatsAppAIActionPolicy, WhatsAppAIActionType, WhatsAppAISettings } from "@/lib/whatsapp/aiModel";
import { WHATSAPP_AI_ACTION_TYPES } from "@/lib/whatsapp/aiModel";
import AISettingsControls, { type WhatsAppAIProviderView } from "./AISettingsControls";

type KnowledgeRow = { id: string; title: string; source_type: string; source_uri?: string | null; metadata?: Record<string, unknown>; status: string; created_at?: string; updated_at?: string };
type ApprovalRow = { id: string; run_id: string; action_type: string; proposed_payload: Record<string, unknown>; created_at?: string };
type Usage = { days: number; requests: number; runs: number; succeeded: number; failed: number; handoffs: number; objectivesCompleted: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number; byFeature: Record<string, number> };
type Dashboard = { settings: WhatsAppAISettings; agents: WhatsAppAIAgent[]; knowledge: KnowledgeRow[]; usage: Usage; approvals: ApprovalRow[]; provider: WhatsAppAIProviderView };
type SandboxDebug = { reply?: string; summary?: string; sources?: string[]; actions?: Array<{ type: string; policy?: string; payload?: Record<string, unknown> }>; objectiveComplete?: boolean; collectedFields?: Array<{ field: string; value: string }>; model?: string; inputTokens?: number | null; outputTokens?: number | null; estimatedCostUsd?: number | null; latencyMs?: number; creditBalanceUsd?: number | null };
type Tab = "agents" | "knowledge" | "approvals" | "playground" | "usage" | "settings";

const ACTION_LABELS: Record<WhatsAppAIActionType, string> = {
  ADD_TAG: "Add tag", REMOVE_TAG: "Remove tag", UPDATE_CRM_STAGE: "Change CRM stage", UPDATE_CONTACT_FIELD: "Update contact field", ADD_INTERNAL_NOTE: "Add internal note", ASSIGN_CONVERSATION: "Assign conversation", SEND_WHATSAPP_FLOW: "Send WhatsApp Flow", CLOSE_CONVERSATION: "Close conversation", REQUEST_HUMAN: "Request human",
};

function defaultPolicies(): Partial<Record<WhatsAppAIActionType, WhatsAppAIActionPolicy>> {
  return {
    ADD_TAG: "AUTO",
    REMOVE_TAG: "AUTO",
    UPDATE_CRM_STAGE: "APPROVAL",
    UPDATE_CONTACT_FIELD: "AUTO",
    ADD_INTERNAL_NOTE: "AUTO",
    ASSIGN_CONVERSATION: "APPROVAL",
    SEND_WHATSAPP_FLOW: "APPROVAL",
    CLOSE_CONVERSATION: "APPROVAL",
    REQUEST_HUMAN: "AUTO",
  };
}

function createEmptyAgent(): WhatsAppAIAgent {
  const policies = defaultPolicies();
  return {
    id: "", name: "", description: "", role: "Customer service assistant", objective: "", requiredFields: [], objectiveCompletion: "HANDOFF",
    instructions: "Answer using approved business knowledge. Ask concise follow-up questions when information is missing. Never invent prices, policies or guarantees.",
    tone: "Professional, concise and helpful", knowledgeMode: "KNOWLEDGE_ONLY", uncertaintyMode: "STRICT", knowledgeSourceIds: [],
    allowedActions: WHATSAPP_AI_ACTION_TYPES.filter((action) => policies[action] !== "NEVER"), actionPolicies: policies,
    handoffRules: {}, workingHours: {}, maxTurns: 10, fallbackMessage: "I’ll connect you with someone who can help.", status: "DRAFT",
  };
}

const PRESETS: Array<{ key: string; label: string; patch: Partial<WhatsAppAIAgent> }> = [
  { key: "reception", label: "Receptionist", patch: { name: "AI Receptionist", role: "Receptionist", objective: "Answer common enquiries and route customers to the right next step.", requiredFields: [], instructions: "Answer common questions using approved knowledge. Keep replies brief. If the request needs a specialist or the answer is uncertain, request a human.", uncertaintyMode: "STRICT" } },
  { key: "sales", label: "Sales Qualifier", patch: { name: "Sales Qualifier", role: "Sales assistant", objective: "Qualify new sales enquiries and prepare a clean handoff to a human salesperson.", requiredFields: ["service", "business_name", "budget", "timeline"], instructions: "Understand what the customer needs, collect the required qualification fields naturally, answer service questions using approved knowledge, and never invent a custom price or discount.", uncertaintyMode: "STRICT", objectiveCompletion: "HANDOFF" } },
  { key: "support", label: "Customer Support", patch: { name: "Support Agent", role: "Customer support", objective: "Resolve supported customer questions and escalate issues that require a human.", requiredFields: [], instructions: "Diagnose the customer's issue from the conversation and approved knowledge. Never make unsupported promises. Escalate billing disputes, complaints or unresolved issues.", uncertaintyMode: "STRICT" } },
  { key: "custom", label: "Custom", patch: {} },
];

function FieldLabel({ children }: { children: React.ReactNode }) { return <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{children}</span>; }
function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-rule bg-paper-sunk px-2 py-1 text-[0.65rem] font-semibold text-ink-soft">{children}</span>; }

async function postAI(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/whatsapp/ai/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "AI request failed.");
  return body;
}

export default function AIAutomationManager() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("agents");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [agentDraft, setAgentDraft] = useState<WhatsAppAIAgent>(createEmptyAgent());
  const [knowledgeMode, setKnowledgeMode] = useState<"TEXT" | "WEBSITE" | "FAQ" | "DOCUMENT">("TEXT");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [sandboxAgentId, setSandboxAgentId] = useState("");
  const [sandboxInput, setSandboxInput] = useState("How can you help me?");
  const [sandboxTurns, setSandboxTurns] = useState<Array<{ role: "Customer" | "AI"; text: string }>>([]);
  const [sandboxDebug, setSandboxDebug] = useState<SandboxDebug | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/whatsapp/ai/?view=dashboard&days=30", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json() as Dashboard;
    setDashboard(body);
    if (!sandboxAgentId && body.agents[0]?.id) setSandboxAgentId(body.agents[0].id);
  }, [sandboxAgentId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeCount = useMemo(() => dashboard?.agents.filter((agent) => agent.status === "ACTIVE").length || 0, [dashboard]);

  async function saveSettings() {
    if (!dashboard) return;
    setBusy(true); setFeedback("");
    try {
      const body = await postAI({ action: "SAVE_SETTINGS", ...dashboard.settings });
      setFeedback("AI settings saved.");
      if (body.settings && body.provider) setDashboard({ ...dashboard, settings: body.settings as WhatsAppAISettings, provider: body.provider as WhatsAppAIProviderView });
      else await refresh();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "AI settings could not be saved."); }
    finally { setBusy(false); }
  }

  async function saveAgent() {
    setBusy(true); setFeedback("");
    try {
      await postAI({ action: agentDraft.id ? "UPDATE_AGENT" : "CREATE_AGENT", ...agentDraft });
      setAgentDraft(createEmptyAgent()); setFeedback("AI Agent saved."); await refresh();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "AI Agent could not be saved."); }
    finally { setBusy(false); }
  }

  async function deleteAgent(id: string) {
    if (!confirm("Delete this AI Agent?")) return;
    setBusy(true); setFeedback("");
    try { await postAI({ action: "DELETE_AGENT", id }); if (agentDraft.id === id) setAgentDraft(createEmptyAgent()); await refresh(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "AI Agent could not be deleted."); }
    finally { setBusy(false); }
  }

  async function saveKnowledge() {
    setBusy(true); setFeedback("");
    try {
      if (knowledgeMode === "WEBSITE") {
        await postAI({ action: "IMPORT_URL_KNOWLEDGE", title: knowledgeTitle || knowledgeUrl, url: knowledgeUrl });
      } else if (knowledgeMode === "FAQ") {
        await postAI({ action: "CREATE_KNOWLEDGE", title: knowledgeTitle || faqQuestion, content: `Question: ${faqQuestion}\n\nAnswer: ${faqAnswer}`, metadata: { kind: "FAQ", question: faqQuestion } });
      } else if (knowledgeMode === "DOCUMENT") {
        if (!documentFile) throw new Error("Choose a text document first.");
        if (documentFile.size > 1_500_000) throw new Error("Keep text documents under 1.5 MB for this first knowledge importer.");
        const allowed = /\.(txt|md|csv|json|html|xml)$/i.test(documentFile.name);
        if (!allowed) throw new Error("Supported document formats are TXT, Markdown, CSV, JSON, HTML and XML.");
        const content = await documentFile.text();
        await postAI({ action: "IMPORT_DOCUMENT_KNOWLEDGE", title: knowledgeTitle || documentFile.name, fileName: documentFile.name, mimeType: documentFile.type, content });
      } else {
        await postAI({ action: "CREATE_KNOWLEDGE", title: knowledgeTitle, content: knowledgeContent, metadata: { kind: "TEXT" } });
      }
      setKnowledgeTitle(""); setKnowledgeContent(""); setKnowledgeUrl(""); setFaqQuestion(""); setFaqAnswer(""); setDocumentFile(null);
      setFeedback("Knowledge source added and indexed."); await refresh();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Knowledge could not be saved."); }
    finally { setBusy(false); }
  }

  async function deleteKnowledge(id: string) {
    setBusy(true); setFeedback("");
    try { await postAI({ action: "DELETE_KNOWLEDGE", id }); await refresh(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Knowledge source could not be deleted."); }
    finally { setBusy(false); }
  }

  async function decideApproval(id: string, approve: boolean) {
    setBusy(true); setFeedback("");
    try { await postAI({ action: approve ? "APPROVE_ACTION" : "REJECT_ACTION", id }); setFeedback(approve ? "AI action approved and executed." : "AI action rejected."); await refresh(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "AI action could not be updated."); }
    finally { setBusy(false); }
  }

  async function runSandbox() {
    if (!sandboxAgentId || !sandboxInput.trim()) return;
    setBusy(true); setFeedback("");
    try {
      const turns = [...sandboxTurns, { role: "Customer" as const, text: sandboxInput.trim() }];
      const transcript = turns.map((turn) => `${turn.role}: ${turn.text}`).join("\n");
      const body = await postAI({ action: "GENERATE", feature: "SANDBOX", agentId: sandboxAgentId, prompt: transcript });
      const reply = String(body.reply || body.text || "");
      setSandboxTurns([...turns, { role: "AI", text: reply || "(No customer reply proposed)" }]);
      setSandboxInput(""); setSandboxDebug(body as SandboxDebug); setFeedback("Sandbox run complete. No customer or CRM record was changed.");
      await refresh();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Sandbox failed."); }
    finally { setBusy(false); }
  }

  if (!dashboard) return <div className="rounded-2xl border border-rule bg-paper p-8 text-sm text-ink-faint">Loading AI Agents…</div>;

  const selectedSandboxAgent = dashboard.agents.find((agent) => agent.id === sandboxAgentId);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2">
      <Pill>{dashboard.settings.enabled ? "AI enabled" : "AI disabled"}</Pill>
      <Pill>{dashboard.settings.billingMode === "FREE_ONLY" ? "Free credits only" : dashboard.settings.billingMode.replaceAll("_", " ")}</Pill>
      <Pill>{activeCount} active Agent{activeCount === 1 ? "" : "s"}</Pill>
      <Pill>{dashboard.approvals.length} approval{dashboard.approvals.length === 1 ? "" : "s"} waiting</Pill>
    </div>

    <div className="flex gap-1 overflow-x-auto border-b border-rule">
      {(["agents","knowledge","approvals","playground","usage","settings"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold capitalize ${tab === item ? "border-ledger text-ledger" : "border-transparent text-ink-faint"}`}>{item === "playground" ? "Test playground" : item}{item === "approvals" && dashboard.approvals.length ? ` (${dashboard.approvals.length})` : ""}</button>)}
    </div>

    {tab === "agents" ? <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
      <section className="rounded-2xl border border-rule bg-paper p-4">
        <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-ink">AI Agents</h2><p className="mt-1 text-xs text-ink-faint">Virtual team members with their own objectives, knowledge and permissions.</p></div><button onClick={() => setAgentDraft(createEmptyAgent())} className="rounded-lg border border-rule px-3 py-1.5 text-xs font-semibold">New</button></div>
        <div className="mt-4 space-y-2">{dashboard.agents.length ? dashboard.agents.map((agent) => <button key={agent.id} onClick={() => setAgentDraft(agent)} className={`block w-full rounded-xl border p-3 text-left ${agentDraft.id === agent.id ? "border-ledger bg-ledger-tint" : "border-rule"}`}><div className="flex items-center gap-2"><span className="font-semibold text-ink">{agent.name}</span><Pill>{agent.status}</Pill></div><p className="mt-1 text-xs text-ink-faint">{agent.role}</p><p className="mt-1 line-clamp-2 text-xs text-ink-soft">{agent.objective || "No objective configured"}</p></button>) : <p className="rounded-xl border border-dashed border-rule p-5 text-sm text-ink-faint">No AI Agents yet.</p>}</div>
      </section>
      <section className="rounded-2xl border border-rule bg-paper p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-ink">{agentDraft.id ? "Edit AI Agent" : "Create AI Agent"}</h3><p className="mt-1 text-xs text-ink-faint">Start from a role template or configure the Agent manually.</p></div>{agentDraft.id ? <button onClick={() => void deleteAgent(agentDraft.id)} className="text-xs font-semibold text-rose-700">Delete</button> : null}</div>
        <div className="mt-4 flex flex-wrap gap-2">{PRESETS.map((preset) => <button key={preset.key} onClick={() => setAgentDraft({ ...createEmptyAgent(), ...preset.patch, id: agentDraft.id })} className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold hover:bg-paper-sunk">{preset.label}</button>)}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label><FieldLabel>Name</FieldLabel><input value={agentDraft.name} onChange={(e) => setAgentDraft({ ...agentDraft, name: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label>
          <label><FieldLabel>Status</FieldLabel><select value={agentDraft.status} onChange={(e) => setAgentDraft({ ...agentDraft, status: e.target.value as WhatsAppAIAgent["status"] })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option></select></label>
          <label><FieldLabel>Role</FieldLabel><input value={agentDraft.role} onChange={(e) => setAgentDraft({ ...agentDraft, role: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label>
          <label><FieldLabel>Tone</FieldLabel><input value={agentDraft.tone} onChange={(e) => setAgentDraft({ ...agentDraft, tone: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label>
        </div>
        <label className="mt-3 block"><FieldLabel>Objective</FieldLabel><textarea rows={3} value={agentDraft.objective} onChange={(e) => setAgentDraft({ ...agentDraft, objective: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" placeholder="What should this Agent accomplish before its job is complete?" /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><FieldLabel>Required information</FieldLabel><input value={agentDraft.requiredFields.join(", ")} onChange={(e) => setAgentDraft({ ...agentDraft, requiredFields: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" placeholder="service, budget, timeline" /></label><label><FieldLabel>When objective is complete</FieldLabel><select value={agentDraft.objectiveCompletion} onChange={(e) => setAgentDraft({ ...agentDraft, objectiveCompletion: e.target.value as WhatsAppAIAgent["objectiveCompletion"] })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option value="HANDOFF">Hand off to human</option><option value="CONTINUE">Continue conversation</option></select></label></div>
        <label className="mt-3 block"><FieldLabel>Instructions</FieldLabel><textarea rows={7} value={agentDraft.instructions} onChange={(e) => setAgentDraft({ ...agentDraft, instructions: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm leading-6" /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-3"><label><FieldLabel>Knowledge behaviour</FieldLabel><select value={agentDraft.knowledgeMode} onChange={(e) => setAgentDraft({ ...agentDraft, knowledgeMode: e.target.value as WhatsAppAIAgent["knowledgeMode"] })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option value="KNOWLEDGE_ONLY">Knowledge only</option><option value="KNOWLEDGE_PLUS_GENERAL">Knowledge + general</option></select></label><label><FieldLabel>When uncertain</FieldLabel><select value={agentDraft.uncertaintyMode} onChange={(e) => setAgentDraft({ ...agentDraft, uncertaintyMode: e.target.value as WhatsAppAIAgent["uncertaintyMode"] })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option value="STRICT">Strict</option><option value="BALANCED">Balanced</option><option value="FLEXIBLE">Flexible</option></select></label><label><FieldLabel>Max turns</FieldLabel><input type="number" min="1" max="50" value={agentDraft.maxTurns} onChange={(e) => setAgentDraft({ ...agentDraft, maxTurns: Number(e.target.value) })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label></div>
        <label className="mt-3 block"><FieldLabel>Fallback / handoff message</FieldLabel><input value={agentDraft.fallbackMessage} onChange={(e) => setAgentDraft({ ...agentDraft, fallbackMessage: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label>
        <div className="mt-4"><FieldLabel>Knowledge sources</FieldLabel><div className="grid gap-2 sm:grid-cols-2">{dashboard.knowledge.length ? dashboard.knowledge.map((source) => <label key={source.id} className="flex items-center gap-2 rounded-lg border border-rule px-2.5 py-2 text-xs"><input type="checkbox" checked={agentDraft.knowledgeSourceIds.includes(source.id)} onChange={(e) => setAgentDraft({ ...agentDraft, knowledgeSourceIds: e.target.checked ? [...agentDraft.knowledgeSourceIds, source.id] : agentDraft.knowledgeSourceIds.filter((id) => id !== source.id) })} />{source.title}</label>) : <p className="text-xs text-ink-faint">Add knowledge sources first.</p>}</div></div>
        <div className="mt-4"><FieldLabel>Action permissions</FieldLabel><div className="grid gap-2 md:grid-cols-2">{WHATSAPP_AI_ACTION_TYPES.map((action) => <label key={action} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-rule px-3 py-2"><span className="text-xs font-semibold text-ink">{ACTION_LABELS[action]}</span><select value={agentDraft.actionPolicies[action] || "NEVER"} onChange={(e) => { const policy = e.target.value as WhatsAppAIActionPolicy; const actionPolicies = { ...agentDraft.actionPolicies, [action]: policy }; setAgentDraft({ ...agentDraft, actionPolicies, allowedActions: WHATSAPP_AI_ACTION_TYPES.filter((item) => actionPolicies[item] !== "NEVER") }); }} className="rounded-lg border border-rule bg-paper-raised px-2 py-1.5 text-xs"><option value="AUTO">Automatic</option><option value="APPROVAL">Approval required</option><option value="NEVER">Never</option></select></label>)}</div></div>
        <button disabled={busy || !agentDraft.name.trim() || !agentDraft.instructions.trim()} onClick={() => void saveAgent()} className="mt-5 rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Saving…" : "Save AI Agent"}</button>
      </section>
    </div> : null}

    {tab === "knowledge" ? <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
      <section><div><h2 className="text-base font-semibold text-ink">Knowledge Base</h2><p className="mt-1 text-xs text-ink-faint">Shared, workspace-scoped knowledge can be attached to one or many AI Agents.</p></div><div className="mt-4 grid gap-2">{dashboard.knowledge.length ? dashboard.knowledge.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-rule bg-paper p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{item.title}</p><p className="mt-1 text-[0.68rem] text-ink-faint">{item.source_type}{item.source_uri ? ` · ${item.source_uri}` : ""} · {item.status}</p></div><button disabled={busy} onClick={() => void deleteKnowledge(item.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700">Delete</button></div>) : <p className="rounded-xl border border-dashed border-rule bg-paper p-6 text-sm text-ink-faint">No knowledge sources yet.</p>}</div></section>
      <section className="rounded-2xl border border-rule bg-paper p-4"><h3 className="text-sm font-semibold text-ink">Add knowledge</h3><div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-paper-sunk p-1">{(["TEXT","WEBSITE","FAQ","DOCUMENT"] as const).map((mode) => <button key={mode} onClick={() => setKnowledgeMode(mode)} className={`rounded-lg px-2 py-2 text-[0.68rem] font-semibold ${knowledgeMode === mode ? "bg-paper-raised text-ledger shadow-sm" : "text-ink-faint"}`}>{mode === "DOCUMENT" ? "Document" : mode === "WEBSITE" ? "Website" : mode}</button>)}</div>
        <label className="mt-4 block"><FieldLabel>Title</FieldLabel><input value={knowledgeTitle} onChange={(e) => setKnowledgeTitle(e.target.value)} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm" placeholder="Services and pricing" /></label>
        {knowledgeMode === "TEXT" ? <label className="mt-3 block"><FieldLabel>Approved content</FieldLabel><textarea rows={14} value={knowledgeContent} onChange={(e) => setKnowledgeContent(e.target.value)} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm leading-6" placeholder="Paste approved business information." /></label> : null}
        {knowledgeMode === "WEBSITE" ? <label className="mt-3 block"><FieldLabel>Public webpage URL</FieldLabel><input type="url" value={knowledgeUrl} onChange={(e) => setKnowledgeUrl(e.target.value)} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm" placeholder="https://example.com/services" /><span className="mt-1 block text-[0.68rem] text-ink-faint">The server imports readable public text and blocks local/private network targets.</span></label> : null}
        {knowledgeMode === "FAQ" ? <><label className="mt-3 block"><FieldLabel>Question</FieldLabel><textarea rows={3} value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm" /></label><label className="mt-3 block"><FieldLabel>Approved answer</FieldLabel><textarea rows={6} value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm" /></label></> : null}
        {knowledgeMode === "DOCUMENT" ? <label className="mt-3 block"><FieldLabel>Text document</FieldLabel><input type="file" accept=".txt,.md,.csv,.json,.html,.xml,text/plain,text/csv,application/json,text/markdown,text/html,application/xml,text/xml" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className="block w-full text-xs text-ink-soft" /><span className="mt-1 block text-[0.68rem] leading-5 text-ink-faint">TXT, Markdown, CSV, JSON, HTML and XML are supported without adding a document-processing bill.</span></label> : null}
        <button disabled={busy} onClick={() => void saveKnowledge()} className="mt-4 rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Importing…" : "Add to Knowledge Base"}</button>
      </section>
    </div> : null}

    {tab === "approvals" ? <section><div><h2 className="text-base font-semibold text-ink">Human approvals</h2><p className="mt-1 text-xs text-ink-faint">Actions configured as Approval required stop here until a supervisor decides.</p></div><div className="mt-4 space-y-2">{dashboard.approvals.length ? dashboard.approvals.map((item) => <article key={item.id} className="rounded-xl border border-rule bg-paper p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{ACTION_LABELS[item.action_type as WhatsAppAIActionType] || item.action_type}</p><pre className="mt-2 max-w-2xl whitespace-pre-wrap break-words rounded-lg bg-paper-sunk p-2 text-[0.68rem] text-ink-soft">{JSON.stringify(item.proposed_payload, null, 2)}</pre></div><div className="flex gap-2"><button disabled={busy} onClick={() => void decideApproval(item.id, false)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Reject</button><button disabled={busy} onClick={() => void decideApproval(item.id, true)} className="rounded-lg bg-ledger px-3 py-2 text-xs font-semibold text-white">Approve</button></div></div></article>) : <p className="rounded-xl border border-dashed border-rule bg-paper p-8 text-center text-sm text-ink-faint">No AI actions are waiting for approval.</p>}</div></section> : null}

    {tab === "playground" ? <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]"><section className="rounded-2xl border border-rule bg-paper p-4"><div><h2 className="text-base font-semibold text-ink">Agent test playground</h2><p className="mt-1 text-xs text-ink-faint">Multi-turn test conversation. It never sends WhatsApp messages or mutates CRM data.</p></div><label className="mt-4 block"><FieldLabel>AI Agent</FieldLabel><select value={sandboxAgentId} onChange={(e) => { setSandboxAgentId(e.target.value); setSandboxTurns([]); setSandboxDebug(null); }} className="w-full rounded-xl border border-rule px-3 py-2.5 text-sm"><option value="">Choose an Agent…</option>{dashboard.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.status}</option>)}</select></label><div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto rounded-xl bg-paper-sunk p-3">{sandboxTurns.length ? sandboxTurns.map((turn, index) => <div key={index} className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-6 ${turn.role === "Customer" ? "bg-paper-raised text-ink" : "ml-auto bg-ledger-tint text-ink"}`}><p className="mb-1 text-[0.62rem] font-semibold uppercase text-ink-faint">{turn.role}</p>{turn.text}</div>) : <p className="py-8 text-center text-sm text-ink-faint">Start a simulated customer conversation.</p>}</div><textarea rows={3} value={sandboxInput} onChange={(e) => setSandboxInput(e.target.value)} className="mt-3 w-full rounded-xl border border-rule px-3 py-2 text-sm" placeholder="Type the next customer message" /><div className="mt-2 flex gap-2"><button disabled={busy || !sandboxAgentId || !sandboxInput.trim()} onClick={() => void runSandbox()} className="rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Running…" : "Send test message"}</button><button onClick={() => { setSandboxTurns([]); setSandboxDebug(null); }} className="rounded-xl border border-rule px-4 py-2.5 text-sm">Reset</button></div></section>
      <aside className="rounded-2xl border border-rule bg-paper p-4"><h3 className="text-sm font-semibold text-ink">Debugger</h3><p className="mt-1 text-xs text-ink-faint">Shows what the Agent used and what it would have attempted.</p>{sandboxDebug ? <div className="mt-4 space-y-4"><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-paper-sunk p-3"><span className="text-ink-faint">Objective</span><p className="mt-1 font-semibold">{sandboxDebug.objectiveComplete ? "Complete" : "In progress"}</p></div><div className="rounded-lg bg-paper-sunk p-3"><span className="text-ink-faint">Latency</span><p className="mt-1 font-semibold">{sandboxDebug.latencyMs ?? "—"} ms</p></div><div className="rounded-lg bg-paper-sunk p-3"><span className="text-ink-faint">Tokens</span><p className="mt-1 font-semibold">{sandboxDebug.inputTokens ?? 0} in · {sandboxDebug.outputTokens ?? 0} out</p></div><div className="rounded-lg bg-paper-sunk p-3"><span className="text-ink-faint">Estimated cost</span><p className="mt-1 font-semibold">${Number(sandboxDebug.estimatedCostUsd || 0).toFixed(6)}</p></div></div><div><FieldLabel>Knowledge used</FieldLabel>{sandboxDebug.sources?.length ? <div className="flex flex-wrap gap-2">{sandboxDebug.sources.map((source) => <Pill key={source}>{source}</Pill>)}</div> : <p className="text-xs text-ink-faint">No matching knowledge source.</p>}</div><div><FieldLabel>Collected fields</FieldLabel>{sandboxDebug.collectedFields?.length ? <div className="space-y-1">{sandboxDebug.collectedFields.map((item) => <div key={`${item.field}-${item.value}`} className="rounded-lg bg-paper-sunk px-3 py-2 text-xs"><strong>{item.field}</strong>: {item.value}</div>)}</div> : <p className="text-xs text-ink-faint">None reported.</p>}</div><div><FieldLabel>Proposed actions</FieldLabel>{sandboxDebug.actions?.length ? <div className="space-y-1">{sandboxDebug.actions.map((action, index) => <div key={`${action.type}-${index}`} className="rounded-lg bg-paper-sunk px-3 py-2 text-xs"><strong>{action.type}</strong> · {action.policy || "NEVER"}</div>)}</div> : <p className="text-xs text-ink-faint">No actions proposed.</p>}</div><div><FieldLabel>Internal route</FieldLabel><p className="break-all rounded-lg bg-paper-sunk px-3 py-2 text-[0.68rem] text-ink-soft">{sandboxDebug.model || "Automatic route"}</p></div></div> : <p className="mt-4 text-sm text-ink-faint">Run a test to inspect knowledge, objective state, proposed actions and usage.</p>}</aside>
    </div> : null}

    {tab === "usage" ? <section><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Requests",dashboard.usage.requests],["Succeeded",dashboard.usage.succeeded],["Failed",dashboard.usage.failed],["Human handoffs",dashboard.usage.handoffs],["Objectives completed",dashboard.usage.objectivesCompleted],["Input tokens",dashboard.usage.inputTokens.toLocaleString()],["Output tokens",dashboard.usage.outputTokens.toLocaleString()],["Estimated cost",`$${dashboard.usage.estimatedCostUsd.toFixed(4)}`]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-rule bg-paper p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-2 text-2xl font-semibold text-ink">{value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-rule bg-paper p-4"><h3 className="text-sm font-semibold text-ink">Usage by feature</h3><div className="mt-3 space-y-2">{Object.entries(dashboard.usage.byFeature).length ? Object.entries(dashboard.usage.byFeature).map(([feature,count]) => <div key={feature} className="flex justify-between rounded-lg bg-paper-sunk px-3 py-2 text-sm"><span>{feature}</span><strong>{count}</strong></div>) : <p className="text-sm text-ink-faint">No AI runs yet.</p>}</div></div></section> : null}

    {tab === "settings" ? <section className="mx-auto max-w-4xl rounded-2xl border border-rule bg-paper p-5"><AISettingsControls settings={dashboard.settings} provider={dashboard.provider} busy={busy} onChange={(settings) => setDashboard({ ...dashboard, settings })} onSave={() => void saveSettings()} /></section> : null}

    {feedback ? <p className="rounded-xl border border-rule bg-paper-sunk px-4 py-3 text-xs leading-5 text-ink-soft">{feedback}</p> : null}
    {selectedSandboxAgent && tab === "playground" ? <p className="text-[0.68rem] text-ink-faint">Testing {selectedSandboxAgent.name}. Status: {selectedSandboxAgent.status}. Sandbox never executes CRM actions.</p> : null}
  </div>;
}
