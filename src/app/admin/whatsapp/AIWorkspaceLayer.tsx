"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import type { WhatsAppAIAgent, WhatsAppAIActionType, WhatsAppAISettings } from "@/lib/whatsapp/aiModel";

const ACTIONS: Array<{ value: WhatsAppAIActionType; label: string }> = [
  { value: "ADD_TAG", label: "Add tag" }, { value: "REMOVE_TAG", label: "Remove tag" }, { value: "UPDATE_CRM_STAGE", label: "Change CRM stage" },
  { value: "UPDATE_CONTACT_FIELD", label: "Update contact field" }, { value: "ADD_INTERNAL_NOTE", label: "Add internal note" }, { value: "ASSIGN_CONVERSATION", label: "Assign conversation" },
  { value: "SEND_WHATSAPP_FLOW", label: "Send Flow" }, { value: "CLOSE_CONVERSATION", label: "Close conversation" }, { value: "REQUEST_HUMAN", label: "Request human" },
];

type KnowledgeRow = { id: string; title: string; source_type: string; status: string; created_at?: string; updated_at?: string };
type Usage = { days: number; requests: number; runs: number; succeeded: number; failed: number; handoffs: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number; byFeature: Record<string, number> };
type Dashboard = { settings: WhatsAppAISettings; agents: WhatsAppAIAgent[]; knowledge: KnowledgeRow[]; usage: Usage; providerReady: boolean };
type ConversationAI = { id?: string; ai_handling_mode?: string; ai_agent_id?: string; ai_turn_count?: number; human_review_required?: boolean };

const emptyAgent = {
  id: "", name: "", description: "", role: "Customer service assistant", instructions: "Answer customer questions using approved business knowledge. Ask concise follow-up questions when information is missing. Never invent prices, policies or guarantees.",
  tone: "Professional, concise and helpful", knowledgeMode: "KNOWLEDGE_ONLY", knowledgeSourceIds: [] as string[], allowedActions: ["ADD_TAG", "UPDATE_CRM_STAGE", "UPDATE_CONTACT_FIELD", "ADD_INTERNAL_NOTE", "REQUEST_HUMAN"] as WhatsAppAIActionType[],
  maxTurns: 10, fallbackMessage: "I’ll connect you with someone who can help.", modelOverride: "", status: "DRAFT",
};

function injectComposerDraft(value: string) {
  const editor = document.querySelector<HTMLTextAreaElement>("#whatsapp-composer-editor");
  if (!editor) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(editor, value); else editor.value = value;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus();
  editor.setSelectionRange(value.length, value.length);
  return true;
}

async function postAI(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/whatsapp/ai/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "AI request failed.");
  return body;
}

function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-rule bg-paper-sunk px-2 py-1 text-[0.65rem] font-semibold text-ink-soft">{children}</span>; }
function FieldLabel({ children }: { children: React.ReactNode }) { return <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{children}</span>; }
function Spinner() { return <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />; }

export default function AIWorkspaceLayer({ role }: { role: WhatsAppTeamRole }) {
  const pathname = usePathname(); const searchParams = useSearchParams();
  const supervisor = role === "owner" || role === "manager";
  const conversationId = pathname?.startsWith("/admin/whatsapp/conversations") ? searchParams.get("lead") : null;
  const [status, setStatus] = useState<{ settings?: WhatsAppAISettings; providerReady?: boolean; supervisor?: boolean }>({});
  const [conversation, setConversation] = useState<ConversationAI | null>(null);
  const [managerOpen, setManagerOpen] = useState(false); const [assistOpen, setAssistOpen] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null); const [tab, setTab] = useState<"settings" | "knowledge" | "agents" | "usage">("settings");
  const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState(""); const [assistResult, setAssistResult] = useState("");
  const [agentDraft, setAgentDraft] = useState({ ...emptyAgent }); const [knowledgeDraft, setKnowledgeDraft] = useState({ title: "", content: "" });
  const [sandboxPrompt, setSandboxPrompt] = useState("How can you help me?"); const [sandboxResult, setSandboxResult] = useState("");

  const refreshStatus = useCallback(async () => {
    const response = await fetch("/api/admin/whatsapp/ai/?view=status", { cache: "no-store" });
    if (response.ok) setStatus(await response.json());
  }, []);
  const refreshConversation = useCallback(async () => {
    if (!conversationId) { setConversation(null); return; }
    const response = await fetch(`/api/admin/whatsapp/ai/?view=conversation&conversationId=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
    if (response.ok) { const body = await response.json() as { conversation?: ConversationAI }; setConversation(body.conversation || null); }
  }, [conversationId]);
  const refreshDashboard = useCallback(async () => {
    if (!supervisor) return;
    const response = await fetch("/api/admin/whatsapp/ai/?view=dashboard&days=30", { cache: "no-store" });
    if (!response.ok) return;
    setDashboard(await response.json());
  }, [supervisor]);

  useEffect(() => { void refreshStatus(); }, [refreshStatus]);
  useEffect(() => { void refreshConversation(); }, [refreshConversation]);
  useEffect(() => { if (managerOpen) void refreshDashboard(); }, [managerOpen, refreshDashboard]);

  const activeAgents = useMemo(() => (dashboard?.agents || []).filter((agent) => agent.status === "ACTIVE"), [dashboard?.agents]);
  const enabled = status.settings?.enabled === true;

  async function generate(mode: string, options: { summary?: boolean; save?: boolean } = {}) {
    if (!conversationId) return;
    setBusy(true); setFeedback("");
    try {
      const body = await postAI({ action: "GENERATE", feature: options.summary ? "SUMMARY" : "ASSIST", conversationId, mode, saveSummary: options.save === true });
      const result = String(options.summary ? body.summary || body.text || "" : body.reply || body.text || "");
      setAssistResult(result);
      if (!options.summary && result) {
        if (!injectComposerDraft(result)) await navigator.clipboard?.writeText(result).catch(() => undefined);
        setFeedback(injectComposerDraft(result) ? "Draft added to the composer. Review it before sending." : "Draft generated. Copy it into the composer before sending.");
      } else setFeedback(options.save ? "Conversation summary saved as an internal note." : "Summary generated.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "AI request failed."); }
    finally { setBusy(false); }
  }

  async function takeOver() {
    if (!conversationId) return; setBusy(true);
    try { await postAI({ action: "TAKEOVER", conversationId }); setFeedback("Human control restored."); await refreshConversation(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to take over."); } finally { setBusy(false); }
  }
  async function assignAI(agentId: string) {
    if (!conversationId || !agentId) return; setBusy(true);
    try { await postAI({ action: "ASSIGN_AI", conversationId, agentId }); setFeedback("AI Agent assigned. New inbound messages can now be handled by it."); await refreshConversation(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to assign AI Agent."); } finally { setBusy(false); }
  }

  async function saveSettings() {
    if (!dashboard) return; setBusy(true); setFeedback("");
    try { await postAI({ action: "SAVE_SETTINGS", ...dashboard.settings }); setFeedback("AI settings saved."); await Promise.all([refreshDashboard(), refreshStatus()]); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to save AI settings."); } finally { setBusy(false); }
  }

  async function saveAgent() {
    setBusy(true); setFeedback("");
    try {
      await postAI({ action: agentDraft.id ? "UPDATE_AGENT" : "CREATE_AGENT", ...agentDraft });
      setAgentDraft({ ...emptyAgent }); setFeedback("AI Agent saved."); await refreshDashboard();
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to save AI Agent."); } finally { setBusy(false); }
  }
  async function deleteAgent(id: string) {
    setBusy(true); try { await postAI({ action: "DELETE_AGENT", id }); if (agentDraft.id === id) setAgentDraft({ ...emptyAgent }); await refreshDashboard(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to delete AI Agent."); } finally { setBusy(false); }
  }
  async function saveKnowledge() {
    setBusy(true); setFeedback("");
    try { const body = await postAI({ action: "CREATE_KNOWLEDGE", ...knowledgeDraft }); setKnowledgeDraft({ title: "", content: "" }); setFeedback(`Knowledge source saved in ${String(body.chunks || 0)} searchable chunk(s).`); await refreshDashboard(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to save knowledge."); } finally { setBusy(false); }
  }
  async function deleteKnowledge(id: string) {
    setBusy(true); try { await postAI({ action: "DELETE_KNOWLEDGE", id }); await refreshDashboard(); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to delete knowledge."); } finally { setBusy(false); }
  }
  async function testAgent() {
    if (!agentDraft.id) { setFeedback("Save the AI Agent before using the sandbox."); return; }
    setBusy(true); setSandboxResult("");
    try { const body = await postAI({ action: "GENERATE", feature: "SANDBOX", agentId: agentDraft.id, prompt: sandboxPrompt }); setSandboxResult(String(body.reply || body.text || "")); setFeedback("Sandbox complete. No customer or CRM record was changed."); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Sandbox failed."); } finally { setBusy(false); }
  }

  return <>
    {conversationId ? <button type="button" onClick={() => setAssistOpen((value) => !value)} className="fixed bottom-[5.6rem] right-5 z-[62] rounded-full border border-emerald-300/60 bg-[#123d30] px-4 py-2 text-xs font-semibold text-white shadow-xl hover:bg-[#0d3026]">✦ AI Assist</button> : null}
    {supervisor ? <button type="button" onClick={() => setManagerOpen(true)} className="fixed bottom-5 left-5 z-[62] grid h-11 min-w-11 place-items-center rounded-full border border-rule bg-paper-raised px-3 text-xs font-bold text-ledger shadow-xl hover:bg-paper-sunk" aria-label="Open AI workspace">AI</button> : null}

    {assistOpen && conversationId ? <div className="fixed bottom-[8.8rem] right-5 z-[70] w-[min(92vw,25rem)] overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-2xl">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3"><div><p className="text-sm font-semibold text-ink">AI Assist</p><p className="text-[0.68rem] text-ink-faint">Human-controlled. Nothing sends automatically from this panel.</p></div><button onClick={() => setAssistOpen(false)} className="rounded-lg px-2 py-1 text-sm text-ink-faint hover:bg-paper-sunk">×</button></div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2"><Pill>{enabled ? "AI enabled" : "AI disabled"}</Pill><Pill>{status.providerReady ? "Provider ready" : "Provider missing"}</Pill><Pill>{conversation?.ai_handling_mode === "AI" ? "AI handling" : "Human handling"}</Pill></div>
        <div className="grid grid-cols-2 gap-2">{[["DRAFT_REPLY","Draft reply"],["SHORTER","Make shorter"],["FRIENDLIER","Friendlier"],["PROFESSIONAL","Professional"]].map(([mode,label]) => <button key={mode} disabled={busy} onClick={() => void generate(mode)} className="rounded-xl border border-rule bg-paper px-3 py-2 text-xs font-semibold text-ink hover:bg-paper-sunk disabled:opacity-50">{busy ? <Spinner /> : label}</button>)}</div>
        <div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => void generate("SUMMARY", { summary: true })} className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold text-ink hover:bg-paper-sunk">Summarize</button><button disabled={busy} onClick={() => void generate("SUMMARY", { summary: true, save: true })} className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold text-ink hover:bg-paper-sunk">Save summary note</button></div>
        {assistResult ? <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-paper-sunk p-3 text-xs leading-5 text-ink-soft">{assistResult}</div> : null}
        {supervisor ? <div className="border-t border-rule pt-3"><FieldLabel>Conversation owner</FieldLabel>{conversation?.ai_handling_mode === "AI" ? <button disabled={busy} onClick={() => void takeOver()} className="w-full rounded-xl bg-[#123d30] px-3 py-2 text-xs font-semibold text-white">Take over from AI</button> : <div className="flex gap-2"><select defaultValue="" onChange={(event) => { if (event.target.value) void assignAI(event.target.value); event.currentTarget.value = ""; }} className="min-w-0 flex-1 rounded-xl border border-rule bg-paper px-3 py-2 text-xs"><option value="">Assign an Active AI Agent…</option>{activeAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><span className="self-center text-[0.65rem] text-ink-faint">{Number(conversation?.ai_turn_count) || 0} turns</span></div>}</div> : null}
        {feedback ? <p className="rounded-lg bg-paper-sunk px-3 py-2 text-[0.68rem] leading-5 text-ink-soft">{feedback}</p> : null}
      </div>
    </div> : null}

    {managerOpen ? <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#07120e]/75 p-2 backdrop-blur-sm sm:p-5"><div className="mx-auto min-h-[calc(100vh-1rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-paper-raised shadow-2xl sm:min-h-[calc(100vh-2.5rem)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-4"><div className="mr-auto"><p className="text-lg font-semibold text-ink">Web Growth AI</p><p className="text-xs text-ink-faint">Assist, knowledge, agents, safety and usage.</p></div><div className="flex flex-wrap gap-1">{(["settings","knowledge","agents","usage"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === item ? "bg-ledger text-white" : "text-ink-soft hover:bg-paper-sunk"}`}>{item}</button>)}</div><button onClick={() => setManagerOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-lg text-ink-faint hover:bg-paper-sunk">×</button></div>
      {!dashboard ? <div className="grid min-h-[50vh] place-items-center text-sm text-ink-faint"><Spinner /></div> : <div className="p-5 sm:p-7">
        {tab === "settings" ? <div className="mx-auto max-w-3xl space-y-6"><div className="rounded-2xl border border-rule bg-paper p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">AI runtime</h2><p className="mt-1 text-xs leading-5 text-ink-faint">Fail-closed by design. Real model calls require AI enabled, provider authentication, and a budget above $0.</p></div><div className="flex gap-2"><Pill>{dashboard.providerReady ? "Provider ready" : "Provider missing"}</Pill><Pill>{dashboard.settings.monthlyBudgetUsd > 0 ? `$${dashboard.settings.monthlyBudgetUsd}/mo cap` : "$0 locked"}</Pill></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Model</FieldLabel><input value={dashboard.settings.model} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, model: e.target.value } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></label><label><FieldLabel>Monthly budget (USD)</FieldLabel><input type="number" min="0" step="0.01" value={dashboard.settings.monthlyBudgetUsd} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, monthlyBudgetUsd: Number(e.target.value) } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></label><label><FieldLabel>Daily request limit</FieldLabel><input type="number" min="1" value={dashboard.settings.dailyRequestLimit} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, dailyRequestLimit: Number(e.target.value) } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></label><label><FieldLabel>Max output tokens</FieldLabel><input type="number" min="50" value={dashboard.settings.maxOutputTokens} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, maxOutputTokens: Number(e.target.value) } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></label><label><FieldLabel>Max autonomous turns</FieldLabel><input type="number" min="1" max="50" value={dashboard.settings.maxAgentTurns} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, maxAgentTurns: Number(e.target.value) } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></label><label><FieldLabel>Default knowledge mode</FieldLabel><select value={dashboard.settings.defaultKnowledgeMode} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, defaultKnowledgeMode: e.target.value as WhatsAppAISettings["defaultKnowledgeMode"] } })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm"><option value="KNOWLEDGE_ONLY">Knowledge only</option><option value="KNOWLEDGE_PLUS_GENERAL">Knowledge + general</option></select></label></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">{[["enabled","Enable AI"],["assistEnabled","AI Assist"],["agentsEnabled","Autonomous Agents"]].map(([key,label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-rule px-3 py-2.5 text-xs font-semibold text-ink"><input type="checkbox" checked={Boolean(dashboard.settings[key as keyof WhatsAppAISettings])} onChange={(e) => setDashboard({ ...dashboard, settings: { ...dashboard.settings, [key]: e.target.checked } })} />{label}</label>)}</div>
          <button disabled={busy} onClick={() => void saveSettings()} className="mt-5 rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Spinner /> : "Save AI settings"}</button></div></div> : null}

        {tab === "knowledge" ? <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]"><section><h2 className="text-base font-semibold text-ink">Knowledge sources</h2><p className="mt-1 text-xs text-ink-faint">Manual business knowledge is chunked and searched in Postgres. No embedding bill required.</p><div className="mt-4 space-y-2">{dashboard.knowledge.length ? dashboard.knowledge.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-rule bg-paper p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{item.title}</p><p className="text-[0.65rem] text-ink-faint">{item.source_type} · {item.status}</p></div><button disabled={busy} onClick={() => void deleteKnowledge(item.id)} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button></div>) : <p className="rounded-xl border border-dashed border-rule p-5 text-sm text-ink-faint">No knowledge sources yet.</p>}</div></section><section className="rounded-2xl border border-rule bg-paper p-4"><h3 className="text-sm font-semibold text-ink">Add knowledge</h3><label className="mt-4 block"><FieldLabel>Title</FieldLabel><input value={knowledgeDraft.title} onChange={(e) => setKnowledgeDraft({ ...knowledgeDraft, title: e.target.value })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" placeholder="Services and pricing" /></label><label className="mt-3 block"><FieldLabel>Content</FieldLabel><textarea value={knowledgeDraft.content} onChange={(e) => setKnowledgeDraft({ ...knowledgeDraft, content: e.target.value })} rows={14} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm leading-6" placeholder="Paste approved FAQs, policies, services, prices or other business knowledge." /></label><button disabled={busy || !knowledgeDraft.title.trim() || !knowledgeDraft.content.trim()} onClick={() => void saveKnowledge()} className="mt-3 rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Save knowledge</button></section></div> : null}

        {tab === "agents" ? <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><section><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-ink">AI Agents</h2><button onClick={() => setAgentDraft({ ...emptyAgent })} className="rounded-lg border border-rule px-3 py-1.5 text-xs font-semibold">New</button></div><div className="mt-4 space-y-2">{dashboard.agents.length ? dashboard.agents.map((agent) => <button key={agent.id} onClick={() => setAgentDraft({ ...emptyAgent, ...agent, modelOverride: agent.modelOverride || "" })} className={`block w-full rounded-xl border p-3 text-left ${agentDraft.id === agent.id ? "border-ledger-bright bg-ledger-tint" : "border-rule bg-paper"}`}><div className="flex items-center gap-2"><span className="text-sm font-semibold text-ink">{agent.name}</span><Pill>{agent.status}</Pill></div><p className="mt-1 line-clamp-2 text-xs text-ink-faint">{agent.role}</p></button>) : <p className="rounded-xl border border-dashed border-rule p-5 text-sm text-ink-faint">No AI Agents yet.</p>}</div></section><section className="rounded-2xl border border-rule bg-paper p-4 sm:p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">{agentDraft.id ? "Edit AI Agent" : "Create AI Agent"}</h3>{agentDraft.id ? <button onClick={() => void deleteAgent(agentDraft.id)} className="text-xs font-semibold text-rose-700">Delete</button> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label><FieldLabel>Name</FieldLabel><input value={agentDraft.name} onChange={(e) => setAgentDraft({ ...agentDraft, name: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" placeholder="AI Receptionist" /></label><label><FieldLabel>Status</FieldLabel><select value={agentDraft.status} onChange={(e) => setAgentDraft({ ...agentDraft, status: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option>DRAFT</option><option>ACTIVE</option><option>PAUSED</option></select></label><label><FieldLabel>Role</FieldLabel><input value={agentDraft.role} onChange={(e) => setAgentDraft({ ...agentDraft, role: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label><label><FieldLabel>Tone</FieldLabel><input value={agentDraft.tone} onChange={(e) => setAgentDraft({ ...agentDraft, tone: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label><label><FieldLabel>Knowledge mode</FieldLabel><select value={agentDraft.knowledgeMode} onChange={(e) => setAgentDraft({ ...agentDraft, knowledgeMode: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm"><option value="KNOWLEDGE_ONLY">Knowledge only</option><option value="KNOWLEDGE_PLUS_GENERAL">Knowledge + general</option></select></label><label><FieldLabel>Max turns</FieldLabel><input type="number" min="1" max="50" value={agentDraft.maxTurns} onChange={(e) => setAgentDraft({ ...agentDraft, maxTurns: Number(e.target.value) })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label></div><label className="mt-3 block"><FieldLabel>Instructions</FieldLabel><textarea rows={7} value={agentDraft.instructions} onChange={(e) => setAgentDraft({ ...agentDraft, instructions: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm leading-6" /></label><label className="mt-3 block"><FieldLabel>Fallback / handoff message</FieldLabel><input value={agentDraft.fallbackMessage} onChange={(e) => setAgentDraft({ ...agentDraft, fallbackMessage: e.target.value })} className="w-full rounded-xl border border-rule px-3 py-2 text-sm" /></label><div className="mt-4"><FieldLabel>Knowledge</FieldLabel><div className="grid gap-2 sm:grid-cols-2">{dashboard.knowledge.map((source) => <label key={source.id} className="flex items-center gap-2 rounded-lg border border-rule px-2.5 py-2 text-xs"><input type="checkbox" checked={agentDraft.knowledgeSourceIds.includes(source.id)} onChange={(e) => setAgentDraft({ ...agentDraft, knowledgeSourceIds: e.target.checked ? [...agentDraft.knowledgeSourceIds, source.id] : agentDraft.knowledgeSourceIds.filter((id) => id !== source.id) })} />{source.title}</label>)}</div></div><div className="mt-4"><FieldLabel>Allowed actions</FieldLabel><div className="grid gap-2 sm:grid-cols-3">{ACTIONS.map((action) => <label key={action.value} className="flex items-center gap-2 rounded-lg border border-rule px-2.5 py-2 text-[0.68rem]"><input type="checkbox" checked={agentDraft.allowedActions.includes(action.value)} onChange={(e) => setAgentDraft({ ...agentDraft, allowedActions: e.target.checked ? [...agentDraft.allowedActions, action.value] : agentDraft.allowedActions.filter((item) => item !== action.value) })} />{action.label}</label>)}</div></div><div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => void saveAgent()} className="rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save agent</button></div>{agentDraft.id ? <div className="mt-6 border-t border-rule pt-5"><h4 className="text-sm font-semibold text-ink">Test sandbox</h4><p className="mt-1 text-xs text-ink-faint">Generates a response and proposed actions without touching a customer or CRM record.</p><textarea rows={3} value={sandboxPrompt} onChange={(e) => setSandboxPrompt(e.target.value)} className="mt-3 w-full rounded-xl border border-rule px-3 py-2 text-sm" /><button disabled={busy} onClick={() => void testAgent()} className="mt-2 rounded-xl border border-rule px-4 py-2 text-sm font-semibold">Run test</button>{sandboxResult ? <div className="mt-3 whitespace-pre-wrap rounded-xl bg-paper-sunk p-3 text-sm leading-6 text-ink-soft">{sandboxResult}</div> : null}</div> : null}</section></div> : null}

        {tab === "usage" ? <div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Requests",dashboard.usage.requests],["Succeeded",dashboard.usage.succeeded],["Failed",dashboard.usage.failed],["Human handoffs",dashboard.usage.handoffs],["Input tokens",dashboard.usage.inputTokens.toLocaleString()],["Output tokens",dashboard.usage.outputTokens.toLocaleString()],["Estimated cost",`$${dashboard.usage.estimatedCostUsd.toFixed(4)}`],["Window",`${dashboard.usage.days} days`]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-rule bg-paper p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-2 text-2xl font-semibold text-ink">{value}</p></div>)}</div><div className="mt-6 rounded-2xl border border-rule bg-paper p-4"><h3 className="text-sm font-semibold text-ink">Usage by feature</h3><div className="mt-3 space-y-2">{Object.entries(dashboard.usage.byFeature).length ? Object.entries(dashboard.usage.byFeature).map(([feature,count]) => <div key={feature} className="flex items-center justify-between rounded-lg bg-paper-sunk px-3 py-2 text-sm"><span>{feature}</span><strong>{count}</strong></div>) : <p className="text-sm text-ink-faint">No AI runs yet.</p>}</div></div></div> : null}

        {feedback ? <p className="mt-6 rounded-xl border border-rule bg-paper-sunk px-4 py-3 text-xs leading-5 text-ink-soft">{feedback}</p> : null}
      </div>}
    </div></div> : null}
  </>;
}
