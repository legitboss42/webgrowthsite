"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import TopbarActionPortal from "@/components/whatsapp/TopbarActionPortal";
import type { WhatsAppTeamRole } from "@/lib/whatsapp/teamModel";
import type { WhatsAppAIAgent, WhatsAppAISettings } from "@/lib/whatsapp/aiModel";

type ConversationAI = { id?: string; ai_handling_mode?: string; ai_agent_id?: string; ai_turn_count?: number; human_review_required?: boolean };
type StatusPayload = { settings?: WhatsAppAISettings; providerReady?: boolean; provider?: { ready?: boolean; paidUsageLocked?: boolean }; supervisor?: boolean };

function injectComposerDraft(value: string) {
  const editor = document.querySelector<HTMLTextAreaElement>("#whatsapp-composer-editor");
  if (!editor) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(editor, value); else editor.value = value;
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.focus(); editor.setSelectionRange(value.length, value.length);
  return true;
}

async function postAI(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/whatsapp/ai/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "AI request failed.");
  return body;
}

function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-rule bg-paper-sunk px-2 py-1 text-[0.65rem] font-semibold text-ink-soft">{children}</span>; }

export default function AIWorkspaceLayer({ role }: { role: WhatsAppTeamRole }) {
  const pathname = usePathname(); const searchParams = useSearchParams();
  const supervisor = role === "owner" || role === "manager";
  const conversationId = pathname?.startsWith("/admin/whatsapp/conversations") ? searchParams.get("lead") : null;
  const [status, setStatus] = useState<StatusPayload>({});
  const [conversation, setConversation] = useState<ConversationAI | null>(null);
  const [agents, setAgents] = useState<WhatsAppAIAgent[]>([]);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState(""); const [result, setResult] = useState("");

  const refresh = useCallback(async () => {
    const requests: Promise<Response>[] = [fetch("/api/admin/whatsapp/ai/?view=status", { cache: "no-store" })];
    if (conversationId) requests.push(fetch(`/api/admin/whatsapp/ai/?view=conversation&conversationId=${encodeURIComponent(conversationId)}`, { cache: "no-store" }));
    if (supervisor) requests.push(fetch("/api/admin/whatsapp/ai/?view=dashboard&days=30", { cache: "no-store" }));
    const responses = await Promise.all(requests);
    if (responses[0]?.ok) setStatus(await responses[0].json());
    let index = 1;
    if (conversationId) { const response = responses[index++]; if (response?.ok) { const body = await response.json() as { conversation?: ConversationAI }; setConversation(body.conversation || null); } }
    if (supervisor) { const response = responses[index]; if (response?.ok) { const body = await response.json() as { agents?: WhatsAppAIAgent[] }; setAgents((body.agents || []).filter((agent) => agent.status === "ACTIVE")); } }
  }, [conversationId, supervisor]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function generate(mode: string, summary = false, save = false) {
    if (!conversationId) return;
    setBusy(true); setFeedback("");
    try {
      const body = await postAI({ action: "GENERATE", feature: summary ? "SUMMARY" : "ASSIST", conversationId, mode, saveSummary: save });
      const next = String(summary ? body.summary || body.text || "" : body.reply || body.text || ""); setResult(next);
      if (!summary && next) {
        const inserted = injectComposerDraft(next);
        if (!inserted) await navigator.clipboard?.writeText(next).catch(() => undefined);
        setFeedback(inserted ? "Draft added to the composer. Review it before sending." : "Draft generated and copied where supported.");
      } else setFeedback(save ? "Conversation summary saved as an internal note." : "Summary generated.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "AI request failed."); }
    finally { setBusy(false); }
  }

  async function takeOver() { if (!conversationId) return; setBusy(true); try { await postAI({ action: "TAKEOVER", conversationId }); setFeedback("Human control restored."); await refresh(); } catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to take over."); } finally { setBusy(false); } }
  async function assignAI(agentId: string) { if (!conversationId || !agentId) return; setBusy(true); try { await postAI({ action: "ASSIGN_AI", conversationId, agentId }); setFeedback("AI Agent assigned."); await refresh(); } catch (error) { setFeedback(error instanceof Error ? error.message : "Unable to assign AI Agent."); } finally { setBusy(false); } }

  if (!conversationId) return null;
  const enabled = status.settings?.enabled === true;
  const modes = [["DRAFT_REPLY","Draft reply"],["SHORTER","Shorter"],["FRIENDLIER","Friendlier"],["PROFESSIONAL","Professional"],["SIMPLIFY","Simplify"],["GRAMMAR","Fix grammar"],["PERSUASIVE","More persuasive"],["EMPATHETIC","More empathetic"],["TRANSLATE","Translate"]] as const;
  return <>
    <TopbarActionPortal>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex h-8 flex-none items-center gap-1.5 rounded-lg border border-emerald-300/35 bg-[#123d30] px-2.5 text-[0.68rem] font-semibold text-white shadow-sm hover:bg-[#0d3026]">
        <span aria-hidden="true">✦</span><span className="hidden sm:inline">AI Assist</span><span className="sm:hidden">AI</span>
      </button>
    </TopbarActionPortal>
    {open ? <div className="fixed bottom-[5.25rem] right-3 z-[70] w-[min(94vw,27rem)] overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-2xl sm:bottom-5 sm:right-5">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3"><div><p className="text-sm font-semibold text-ink">AI Assist</p><p className="text-[0.68rem] text-ink-faint">Human-controlled. Drafts never send automatically.</p></div><button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-ink-faint hover:bg-paper-sunk">×</button></div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2"><Pill>{enabled ? "AI enabled" : "AI disabled"}</Pill><Pill>{status.provider?.ready ? "AI ready" : "AI unavailable"}</Pill><Pill>{conversation?.ai_handling_mode === "AI" ? "AI handling" : conversation?.human_review_required ? "Human attention required" : "Human handling"}</Pill></div>
        <div className="grid grid-cols-3 gap-2">{modes.map(([mode,label]) => <button key={mode} disabled={busy || !enabled} onClick={() => void generate(mode)} className="rounded-xl border border-rule bg-paper px-2 py-2 text-[0.68rem] font-semibold text-ink hover:bg-paper-sunk disabled:opacity-40">{label}</button>)}</div>
        <div className="grid grid-cols-2 gap-2"><button disabled={busy || !enabled} onClick={() => void generate("SUMMARY", true)} className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold">Summarize</button><button disabled={busy || !enabled} onClick={() => void generate("SUMMARY", true, true)} className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold">Save summary note</button></div>
        {result ? <div className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-xl bg-paper-sunk p-3 text-xs leading-5 text-ink-soft">{result}</div> : null}
        {supervisor ? <div className="border-t border-rule pt-3">{conversation?.ai_handling_mode === "AI" ? <button disabled={busy} onClick={() => void takeOver()} className="w-full rounded-xl bg-ledger px-3 py-2 text-xs font-semibold text-white">Take over from AI</button> : <select defaultValue="" disabled={!enabled || !status.settings?.agentsEnabled || busy} onChange={(event) => { if (event.target.value) void assignAI(event.target.value); event.currentTarget.value = ""; }} className="w-full rounded-xl border border-rule bg-paper px-3 py-2 text-xs"><option value="">Assign an Active AI Agent…</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>}<Link href="/admin/whatsapp/automations/?section=ai" className="mt-2 block text-center text-[0.68rem] font-semibold text-ledger hover:underline">Manage AI Agents, knowledge and approvals</Link></div> : null}
        {feedback ? <p className="rounded-lg bg-paper-sunk px-3 py-2 text-[0.68rem] leading-5 text-ink-soft">{feedback}</p> : null}
      </div>
    </div> : null}
  </>;
}
