"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AutomationFlowSelect from "./AutomationFlowSelect";
import {
  WHATSAPP_AUTOMATION_ACTION_OPTIONS,
  WHATSAPP_AUTOMATION_CONDITION_FIELDS,
  WHATSAPP_AUTOMATION_CONDITION_OPERATORS,
  WHATSAPP_AUTOMATION_MAX_STEPS,
  WHATSAPP_AUTOMATION_TRIGGER_OPTIONS,
  countWhatsAppAutomationSteps,
  getWhatsAppAutomationActionLabel,
  getWhatsAppAutomationTriggerLabel,
  validateWhatsAppAutomationInput,
  type WhatsAppAutomation,
  type WhatsAppAutomationAction,
  type WhatsAppAutomationActionType,
  type WhatsAppAutomationCondition,
  type WhatsAppAutomationConditionOperator,
  type WhatsAppAutomationInput,
  type WhatsAppAutomationJob,
  type WhatsAppAutomationQuestionMode,
  type WhatsAppAutomationQuestionOption,
  type WhatsAppAutomationRun,
  type WhatsAppAutomationStatus,
  type WhatsAppAutomationTriggerType,
} from "@/lib/whatsapp/automationModel";

type Props = {
  automations: WhatsAppAutomation[];
  storageReady: boolean;
  role: string;
  runs: WhatsAppAutomationRun[];
  jobs: WhatsAppAutomationJob[];
  teamMembers: Array<{ id: string; name: string; availability: string }>;
  templates: Array<{ name: string; language: string }>;
  savedReplies: Array<{ shortcut: string; title: string; category: string }>;
};
type Notice = { tone: "ok" | "error"; text: string } | null;
type Filter = "ALL" | WhatsAppAutomationStatus;
type ActionPath = Array<number | "then" | "else">;
type Selection = { type: "trigger" | "conditions" } | { type: "action"; path: ActionPath };

const EMPTY: WhatsAppAutomationInput = {
  name: "",
  description: "",
  status: "DRAFT",
  triggerType: "NEW_MESSAGE",
  triggerConfig: {},
  conditionJoin: "AND",
  conditions: [],
  actions: [{ type: "SEND_TEXT", value: "" }],
};

function cloneInput(value: WhatsAppAutomation | WhatsAppAutomationInput): WhatsAppAutomationInput {
  return JSON.parse(JSON.stringify({
    name: value.name,
    description: value.description,
    status: value.status,
    triggerType: value.triggerType,
    triggerConfig: value.triggerConfig,
    conditionJoin: value.conditionJoin,
    conditions: value.conditions,
    actions: value.actions,
  })) as WhatsAppAutomationInput;
}

function newAction(type: WhatsAppAutomationActionType): WhatsAppAutomationAction {
  if (type === "ASK_QUESTION") return {
    type,
    value: "",
    questionMode: "BUTTONS",
    choices: [
      { id: "option_1", title: "Option 1" },
      { id: "option_2", title: "Option 2" },
    ],
    listButtonText: "Choose",
  };
  if (type === "BRANCH") return {
    type,
    condition: { field: "answer", operator: "EQUALS", value: "" },
    thenActions: [],
    elseActions: [],
  };
  if (type === "DELAY") return { type, amount: 1, unit: "MINUTES" };
  if (type === "STOP") return { type };
  return { type, value: "" };
}

function statusClass(status: string) {
  if (status === "ACTIVE" || status === "SUCCEEDED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "FAILED") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "WAITING" || status === "PAUSED") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "CANCELLED" || status === "SKIPPED") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-paper-sunk text-ink-faint border-rule";
}
function formatWhen(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "—";
}

function actionAt(actions: WhatsAppAutomationAction[], path: ActionPath): WhatsAppAutomationAction | null {
  let list = actions;
  let current: WhatsAppAutomationAction | undefined;
  for (let index = 0; index < path.length; index += 1) {
    const part = path[index];
    if (typeof part !== "number") return null;
    current = list[part];
    if (!current) return null;
    const branch = path[index + 1];
    if (branch === "then" || branch === "else") {
      list = branch === "then" ? current.thenActions || [] : current.elseActions || [];
      index += 1;
    }
  }
  return current || null;
}

function updateAction(actions: WhatsAppAutomationAction[], path: ActionPath, updater: (action: WhatsAppAutomationAction) => WhatsAppAutomationAction): WhatsAppAutomationAction[] {
  const [head, branch, ...rest] = path;
  if (typeof head !== "number") return actions;
  return actions.map((action, index) => {
    if (index !== head) return action;
    if (!branch) return updater(action);
    if (branch !== "then" && branch !== "else") return action;
    const child = branch === "then" ? action.thenActions || [] : action.elseActions || [];
    const next = updateAction(child, rest, updater);
    return branch === "then" ? { ...action, thenActions: next } : { ...action, elseActions: next };
  });
}

function removeAction(actions: WhatsAppAutomationAction[], path: ActionPath): WhatsAppAutomationAction[] {
  const [head, branch, ...rest] = path;
  if (typeof head !== "number") return actions;
  if (!branch) return actions.filter((_, index) => index !== head);
  return actions.map((action, index) => {
    if (index !== head || (branch !== "then" && branch !== "else")) return action;
    const child = branch === "then" ? action.thenActions || [] : action.elseActions || [];
    const next = removeAction(child, rest);
    return branch === "then" ? { ...action, thenActions: next } : { ...action, elseActions: next };
  });
}

function appendBranchAction(actions: WhatsAppAutomationAction[], path: ActionPath, branch: "then" | "else") {
  return updateAction(actions, path, (action) => ({
    ...action,
    [branch === "then" ? "thenActions" : "elseActions"]: [
      ...(branch === "then" ? action.thenActions || [] : action.elseActions || []),
      newAction("SEND_TEXT"),
    ],
  }));
}

function summarizeAction(action: WhatsAppAutomationAction) {
  if (action.type === "ASK_QUESTION") return `${action.value || "Write a question"} · ${(action.choices || []).length} choices`;
  if (action.type === "DELAY") return `${action.amount || "?"} ${(action.unit || "minutes").toLowerCase()}`;
  if (action.type === "BRANCH") return action.condition ? `${action.condition.field} ${action.condition.operator.toLowerCase().replaceAll("_", " ")} ${action.condition.value}` : "Choose a condition";
  if (action.type === "UPDATE_CONTACT_FIELD") return `${action.value || "field"} → ${action.value2 || "value"}`;
  if (action.type === "SEND_WHATSAPP_FLOW") return action.value ? `Flow ${action.value.slice(0, 8)}… · ${action.value2 || "Open form"}` : "Choose a published Flow";
  return action.value || getWhatsAppAutomationActionLabel(action.type);
}

function Node({ title, subtitle, tone = "plain", selected, onClick }: {
  title: string;
  subtitle?: string;
  tone?: "plain" | "trigger" | "condition" | "action" | "question";
  selected?: boolean;
  onClick?(): void;
}) {
  const toneClass = tone === "trigger"
    ? "border-emerald-300 bg-emerald-50"
    : tone === "condition"
      ? "border-amber-300 bg-amber-50"
      : tone === "question"
        ? "border-violet-300 bg-violet-50"
        : tone === "action"
          ? "border-sky-300 bg-sky-50"
          : "border-rule bg-paper";
  return <button type="button" onClick={onClick} className={`w-[270px] rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass} ${selected ? "ring-2 ring-ledger ring-offset-2" : ""}`}>
    <div className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{tone === "trigger" ? "Trigger" : tone === "condition" ? "Condition" : tone === "question" ? "Question" : tone === "action" ? "Action" : "Step"}</div>
    <div className="mt-1 text-sm font-semibold text-ink">{title}</div>
    {subtitle ? <div className="mt-1 line-clamp-2 text-xs leading-5 text-ink-faint">{subtitle}</div> : null}
  </button>;
}
function Connector() { return <div className="mx-auto h-8 w-px bg-rule" />; }

function ActionTree({ actions, parent = [], selection, setSelection }: {
  actions: WhatsAppAutomationAction[];
  parent?: ActionPath;
  selection: Selection;
  setSelection(value: Selection): void;
}) {
  return <>{actions.map((action, index) => {
    const path = [...parent, index];
    const selected = selection.type === "action" && JSON.stringify(selection.path) === JSON.stringify(path);
    if (action.type === "BRANCH") {
      return <div key={path.join("-")} className="flex w-full flex-col items-center">
        <Node tone="condition" title="Branch" subtitle={summarizeAction(action)} selected={selected} onClick={() => setSelection({ type: "action", path })} />
        <div className="h-6 w-px bg-rule" />
        <div className="grid w-full max-w-[760px] grid-cols-2 gap-8">
          {(["then", "else"] as const).map((branch) => {
            const child = branch === "then" ? action.thenActions || [] : action.elseActions || [];
            return <div key={branch} className="flex min-w-0 flex-col items-center">
              <span className={`mb-2 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${branch === "then" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{branch === "then" ? "Yes" : "No"}</span>
              {child.length
                ? <ActionTree actions={child} parent={[...path, branch]} selection={selection} setSelection={setSelection} />
                : <button type="button" onClick={() => setSelection({ type: "action", path })} className="rounded-xl border border-dashed border-rule bg-paper/70 px-4 py-6 text-center text-xs text-ink-faint">Empty path · valid while building</button>}
            </div>;
          })}
        </div>
        {index < actions.length - 1 ? <Connector /> : null}
      </div>;
    }
    return <div key={path.join("-")} className="flex flex-col items-center">
      <Node tone={action.type === "ASK_QUESTION" ? "question" : "action"} title={getWhatsAppAutomationActionLabel(action.type)} subtitle={summarizeAction(action)} selected={selected} onClick={() => setSelection({ type: "action", path })} />
      {index < actions.length - 1 ? <Connector /> : null}
    </div>;
  })}</>;
}

export default function AutomationManager({ automations, storageReady, runs, jobs, teamMembers, templates, savedReplies }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"WORKFLOWS" | "HISTORY">("WORKFLOWS");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [builder, setBuilder] = useState(false);
  const [source, setSource] = useState<WhatsAppAutomation | null>(null);
  const [draft, setDraft] = useState<WhatsAppAutomationInput>(EMPTY);
  const [selection, setSelection] = useState<Selection>({ type: "trigger" });
  const [notice, setNotice] = useState<Notice>(null);
  const [runDetail, setRunDetail] = useState<Record<string, unknown> | null>(null);
  const [pending, startTransition] = useTransition();
  const [zoom, setZoom] = useState(100);

  const visible = useMemo(() => automations.filter((automation) => {
    if (filter !== "ALL" && automation.status !== filter) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${automation.name} ${automation.description} ${automation.triggerType}`.toLowerCase().includes(needle);
  }), [automations, filter, query]);
  const waitingByRun = useMemo(() => new Map(jobs.map((job) => [job.runId, job])), [jobs]);
  const runCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const run of runs) map.set(run.automationId, (map.get(run.automationId) || 0) + 1);
    return map;
  }, [runs]);
  const locked = source?.status === "ACTIVE";
  const checked = validateWhatsAppAutomationInput(draft as unknown as Record<string, unknown>);
  const steps = countWhatsAppAutomationSteps(draft.actions);

  function openNew() { setSource(null); setDraft(cloneInput(EMPTY)); setSelection({ type: "trigger" }); setNotice(null); setBuilder(true); }
  function openEdit(value: WhatsAppAutomation) { setSource(value); setDraft(cloneInput(value)); setSelection({ type: "trigger" }); setNotice(null); setBuilder(true); }
  function openDuplicate(value: WhatsAppAutomation) { setSource(null); setDraft({ ...cloneInput(value), name: `${value.name} copy`, status: "DRAFT" }); setSelection({ type: "trigger" }); setNotice(null); setBuilder(true); }

  async function api(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    const response = await fetch("/api/admin/whatsapp/automations/", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "The automation could not be saved.");
  }
  function save() {
    if (!checked.ok || pending || locked) { if (!checked.ok) setNotice({ tone: "error", text: checked.error }); return; }
    startTransition(async () => {
      try {
        await api(source ? "PATCH" : "POST", { ...(source ? { id: source.id } : {}), ...draft });
        setNotice({ tone: "ok", text: source ? "Workflow updated." : "Workflow created." });
        setBuilder(false);
        router.refresh();
      } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Save failed." }); }
    });
  }
  function setWorkflowStatus(value: WhatsAppAutomation, status: WhatsAppAutomationStatus) {
    startTransition(async () => {
      try {
        await api("PATCH", { id: value.id, ...cloneInput(value), status });
        if (builder && source?.id === value.id) setBuilder(false);
        router.refresh();
      } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Status change failed." }); }
    });
  }
  function removeWorkflow(value: WhatsAppAutomation) {
    if (value.status === "ACTIVE") return;
    if (!confirm(`Delete “${value.name}”?`)) return;
    startTransition(async () => {
      try { await api("DELETE", { id: value.id }); router.refresh(); }
      catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Delete failed." }); }
    });
  }
  async function inspectRun(id: string) {
    const response = await fetch(`/api/admin/whatsapp/automations/runs/?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    setRunDetail(response.ok ? payload : { error: payload.error || "Run could not be loaded." });
  }
  function cancelRun(id: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/whatsapp/automations/runs/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) setNotice({ tone: "error", text: payload.error || "Run could not be cancelled." });
      else { setNotice({ tone: "ok", text: "Waiting run cancelled." }); router.refresh(); }
    });
  }

  function updateSelectedAction(patch: Partial<WhatsAppAutomationAction>) {
    if (selection.type !== "action" || locked) return;
    setDraft((value) => ({ ...value, actions: updateAction(value.actions, selection.path, (action) => ({ ...action, ...patch })) }));
  }
  const selectedAction = selection.type === "action" ? actionAt(draft.actions, selection.path) : null;

  if (builder) {
    return <div className="-mx-3 -my-4 min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f7f8f5] sm:-mx-5 sm:-my-5">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur">
        <button type="button" onClick={() => setBuilder(false)} className="rounded-lg border border-rule px-3 py-2 text-sm">← Back</button>
        <div className="min-w-0 flex-1">
          <input disabled={locked} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Workflow name" className="w-full max-w-xl bg-transparent text-lg font-semibold outline-none" />
          <p className="text-xs text-ink-faint">{source ? `Version ${source.version}` : "New workflow"} · {steps}/{WHATSAPP_AUTOMATION_MAX_STEPS} steps</p>
        </div>
        {source?.status === "ACTIVE" ? <button type="button" disabled={pending} onClick={() => setWorkflowStatus(source, "PAUSED")} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">Pause to edit</button> : null}
        {!locked ? <>
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as WhatsAppAutomationStatus })} className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm"><option value="DRAFT">Draft</option><option value="ACTIVE">Publish / Active</option><option value="PAUSED">Paused</option></select>
          <button type="button" disabled={pending || !checked.ok} onClick={save} className="rounded-lg bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : "Save workflow"}</button>
        </> : null}
      </header>
      {notice ? <div className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{notice.text}</div> : null}
      {locked ? <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This published workflow is read-only. Pause it before changing or deleting it.</div> : null}
      <div className="grid min-h-[calc(100vh-8rem)] min-w-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="relative min-h-[680px] min-w-0 overflow-auto border-r border-rule" style={{ backgroundImage: "radial-gradient(circle, rgba(12,51,39,.16) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div className="sticky left-4 top-4 z-10 flex w-fit items-center gap-1 rounded-xl border border-rule bg-paper p-1 shadow-sm"><button onClick={() => setZoom((v) => Math.max(60, v - 10))} className="h-8 w-8 rounded-lg hover:bg-paper-sunk">−</button><span className="w-12 text-center text-xs">{zoom}%</span><button onClick={() => setZoom((v) => Math.min(140, v + 10))} className="h-8 w-8 rounded-lg hover:bg-paper-sunk">+</button></div>
          <div className="mx-auto flex min-w-[760px] max-w-[1100px] flex-col items-center px-10 py-12 transition-transform" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
            <Node tone="trigger" title={getWhatsAppAutomationTriggerLabel(draft.triggerType)} subtitle={draft.description || "Click to configure the workflow trigger."} selected={selection.type === "trigger"} onClick={() => setSelection({ type: "trigger" })} />
            <Connector />
            {draft.conditions.length ? <><Node tone="condition" title={`Entry conditions · ${draft.conditionJoin}`} subtitle={`${draft.conditions.length} condition${draft.conditions.length === 1 ? "" : "s"}`} selected={selection.type === "conditions"} onClick={() => setSelection({ type: "conditions" })} /><Connector /></> : !locked ? <button type="button" onClick={() => { setDraft({ ...draft, conditions: [{ field: "message.text", operator: "CONTAINS", value: "" }] }); setSelection({ type: "conditions" }); }} className="mb-2 rounded-full border border-dashed border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ledger">+ Entry condition</button> : null}
            <ActionTree actions={draft.actions} selection={selection} setSelection={setSelection} />
            {!locked && steps < WHATSAPP_AUTOMATION_MAX_STEPS ? <><Connector /><button type="button" onClick={() => { const next = [...draft.actions, newAction("SEND_TEXT")]; setDraft({ ...draft, actions: next }); setSelection({ type: "action", path: [next.length - 1] }); }} className="rounded-full border border-rule bg-paper px-4 py-2 text-sm font-semibold text-ledger shadow-sm">+ Add step</button></> : null}
          </div>
        </main>
        <aside className="min-w-0 bg-paper p-4 lg:sticky lg:top-[69px] lg:h-[calc(100vh-69px)] lg:overflow-auto">
          <div className="mb-4"><div className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Properties</div><textarea disabled={locked} rows={2} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What does this workflow do?" className="mt-2 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm" /></div>
          {selection.type === "trigger" ? <TriggerInspector value={draft} disabled={locked} onChange={setDraft} /> : null}
          {selection.type === "conditions" ? <ConditionsInspector value={draft} disabled={locked} onChange={setDraft} /> : null}
          {selection.type === "action" && selectedAction ? <ActionInspector action={selectedAction} disabled={locked} teamMembers={teamMembers} templates={templates} savedReplies={savedReplies} onChange={updateSelectedAction} onRemove={() => { setDraft((value) => ({ ...value, actions: removeAction(value.actions, selection.path) })); setSelection({ type: "trigger" }); }} onAppendBranch={(branch) => setDraft((value) => ({ ...value, actions: appendBranchAction(value.actions, selection.path, branch) }))} /> : null}
          {!checked.ok ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{checked.error}</div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">Workflow definition is valid.</div>}
        </aside>
      </div>
    </div>;
  }

  return <div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ledger">Automation Engine</p><h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Workflows</h1><p className="mt-1 max-w-2xl text-sm text-ink-faint">Build visual WhatsApp workflows with triggers, interactive questions, branches, CRM actions, durable waits and execution history.</p></div><button type="button" onClick={openNew} disabled={!storageReady} className="rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">+ New workflow</button></div>
    {!storageReady ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Stage 6 storage is not ready. Apply the full Stage 6 Supabase migration before using Automations.</div> : null}
    {notice ? <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{notice.text}</div> : null}
    <div className="mt-6 flex gap-1 border-b border-rule"><button onClick={() => setTab("WORKFLOWS")} className={`border-b-2 px-4 py-2 text-sm font-semibold ${tab === "WORKFLOWS" ? "border-ledger text-ledger" : "border-transparent text-ink-faint"}`}>Workflows</button><button onClick={() => setTab("HISTORY")} className={`border-b-2 px-4 py-2 text-sm font-semibold ${tab === "HISTORY" ? "border-ledger text-ledger" : "border-transparent text-ink-faint"}`}>Run history <span className="ml-1 rounded-full bg-paper-sunk px-2 py-0.5 text-[0.65rem]">{runs.length}</span></button></div>
    {tab === "WORKFLOWS" ? <>
      <div className="mt-4 flex flex-wrap gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflows" className="min-w-[220px] flex-1 rounded-xl border border-rule bg-paper px-3 py-2 text-sm" /><select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-xl border border-rule bg-paper px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="PAUSED">Paused</option></select></div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">{visible.map((automation) => <article key={automation.id} className="rounded-2xl border border-rule bg-paper p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold text-ink">{automation.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${statusClass(automation.status)}`}>{automation.status}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-faint">{automation.description || "No description"}</p></div><div className="text-right text-xs text-ink-faint">v{automation.version}<br />{runCounts.get(automation.id) || 0} runs</div></div><div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs"><span className="font-semibold text-ink-faint">Trigger</span><span>{getWhatsAppAutomationTriggerLabel(automation.triggerType)}</span><span className="font-semibold text-ink-faint">Steps</span><span>{countWhatsAppAutomationSteps(automation.actions)}</span><span className="font-semibold text-ink-faint">Updated</span><span>{formatWhen(automation.updatedAt)}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => openEdit(automation)} className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-ledger">{automation.status === "ACTIVE" ? "View canvas" : "Edit canvas"}</button><button onClick={() => openDuplicate(automation)} className="rounded-lg border border-rule px-3 py-2 text-xs">Duplicate</button>{automation.status === "ACTIVE" ? <button onClick={() => setWorkflowStatus(automation, "PAUSED")} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Pause</button> : <><button onClick={() => setWorkflowStatus(automation, "ACTIVE")} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Activate</button><button onClick={() => removeWorkflow(automation)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-700">Delete</button></>}</div></article>)}{!visible.length ? <div className="col-span-full rounded-2xl border border-dashed border-rule bg-paper p-10 text-center text-sm text-ink-faint">No workflows match this view.</div> : null}</div>
    </> : <History runs={runs} automations={automations} waitingByRun={waitingByRun} inspectRun={inspectRun} cancelRun={cancelRun} />}
    {runDetail ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setRunDetail(null)}><div onClick={(event) => event.stopPropagation()} className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-2xl bg-paper p-5 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Run details</h3><button onClick={() => setRunDetail(null)} className="rounded-lg border border-rule px-3 py-1.5 text-sm">Close</button></div><pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-paper-sunk p-4 text-xs leading-5">{JSON.stringify(runDetail, null, 2)}</pre></div></div> : null}
  </div>;
}

function TriggerInspector({ value, disabled, onChange }: { value: WhatsAppAutomationInput; disabled: boolean; onChange(value: WhatsAppAutomationInput): void }) {
  const timed = value.triggerType === "NO_CUSTOMER_REPLY" || value.triggerType === "NO_AGENT_REPLY";
  const flowTrigger = value.triggerType === "WHATSAPP_FLOW_STARTED" || value.triggerType === "WHATSAPP_FLOW_COMPLETED";
  const setConfig = (key: string, next: string | number) => onChange({ ...value, triggerConfig: { ...value.triggerConfig, [key]: next } });
  return <div><h3 className="text-sm font-semibold">Trigger</h3><select disabled={disabled} value={value.triggerType} onChange={(event) => onChange({ ...value, triggerType: event.target.value as WhatsAppAutomationTriggerType, triggerConfig: {} })} className="mt-2 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm">{WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p className="mt-2 text-xs leading-5 text-ink-faint">{WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.find((item) => item.value === value.triggerType)?.description}</p>
    {value.triggerType === "KEYWORD" ? <Field label="Keyword" disabled={disabled} value={String(value.triggerConfig.keyword || "")} onChange={(v) => setConfig("keyword", v)} /> : null}
    {value.triggerType === "TAG_ADDED" ? <Field label="Tag" disabled={disabled} value={String(value.triggerConfig.tag || "")} onChange={(v) => setConfig("tag", v)} /> : null}
    {value.triggerType === "CRM_STAGE_CHANGED" ? <Field label="Stage" disabled={disabled} value={String(value.triggerConfig.stage || "")} onChange={(v) => setConfig("stage", v)} placeholder="QUALIFIED" /> : null}
    {value.triggerType === "CONVERSATION_ASSIGNED" ? <Field label="Member ID (blank = anyone)" disabled={disabled} value={String(value.triggerConfig.memberId || "")} onChange={(v) => setConfig("memberId", v)} /> : null}
    {value.triggerType === "WEBHOOK" ? <><Field label="Webhook key" disabled={disabled} value={String(value.triggerConfig.key || "")} onChange={(v) => setConfig("key", v)} placeholder="new-order-2026" /><p className="mt-2 text-[0.68rem] text-ink-faint">Endpoint: /api/whatsapp/automation-webhook/&lt;key&gt;/</p></> : null}
    {flowTrigger ? <AutomationFlowSelect allowAny label="Flow filter" disabled={disabled} value={String(value.triggerConfig.flowId || "")} onChange={(v) => setConfig("flowId", v)} /> : null}
    {flowTrigger ? <p className="mt-2 text-[0.68rem] leading-5 text-ink-faint">Leave this on “Any published Flow” to trigger for every tracked Flow, or select one Flow to scope the automation.</p> : null}
    {timed ? <div className="mt-3 grid grid-cols-[1fr_8rem] gap-2"><Field label="Delay" disabled={disabled} type="number" value={String(value.triggerConfig.amount || "")} onChange={(v) => setConfig("amount", Number(v))} /><label className="text-xs font-semibold text-ink-soft">Unit<select disabled={disabled} value={String(value.triggerConfig.unit || "HOURS")} onChange={(e) => setConfig("unit", e.target.value)} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-2 py-2 text-sm"><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option></select></label></div> : null}
    {value.triggerType === "BUSINESS_HOURS" ? <label className="mt-3 block text-xs font-semibold text-ink-soft">Transition<select disabled={disabled} value={String(value.triggerConfig.transition || "OPENED")} onChange={(e) => setConfig("transition", e.target.value)} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="OPENED">Opened</option><option value="CLOSED">Closed</option></select></label> : null}
  </div>;
}

function ConditionEditor({ condition, disabled, onChange, onRemove }: { condition: WhatsAppAutomationCondition; disabled: boolean; onChange(patch: Partial<WhatsAppAutomationCondition>): void; onRemove?(): void }) {
  return <div className="rounded-xl border border-rule p-3">
    <label className="text-xs font-semibold text-ink-soft">Field<input disabled={disabled} list="automation-condition-fields" value={condition.field} onChange={(e) => onChange({ field: e.target.value })} placeholder="answer or contact.custom.service" className="mt-1 w-full rounded-lg border border-rule px-2 py-2 text-xs" /></label>
    <datalist id="automation-condition-fields">{WHATSAPP_AUTOMATION_CONDITION_FIELDS.map((field) => <option key={field.value} value={field.value}>{field.label}</option>)}<option value="contact.custom.service_interest">Custom CRM field</option><option value="trigger.payload.source">Webhook payload field</option><option value="trigger.payload.flow.fields.custom_field">Any Flow answer path</option></datalist>
    <select disabled={disabled} value={condition.operator} onChange={(e) => onChange({ operator: e.target.value as WhatsAppAutomationConditionOperator })} className="mt-2 w-full rounded-lg border border-rule px-2 py-2 text-xs">{WHATSAPP_AUTOMATION_CONDITION_OPERATORS.map((operator) => <option key={operator}>{operator}</option>)}</select>
    {!new Set(["EXISTS", "NOT_EXISTS"]).has(condition.operator) ? <input disabled={disabled} value={condition.value} onChange={(e) => onChange({ value: e.target.value })} placeholder="Value" className="mt-2 w-full rounded-lg border border-rule px-3 py-2 text-sm" /> : null}
    {onRemove ? <button disabled={disabled} onClick={onRemove} className="mt-2 text-xs text-rose-700">Remove</button> : null}
  </div>;
}

function ConditionsInspector({ value, disabled, onChange }: { value: WhatsAppAutomationInput; disabled: boolean; onChange(value: WhatsAppAutomationInput): void }) {
  const update = (index: number, patch: Partial<WhatsAppAutomationCondition>) => onChange({ ...value, conditions: value.conditions.map((condition, at) => at === index ? { ...condition, ...patch } : condition) });
  return <div><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Entry conditions</h3><button disabled={disabled || value.conditions.length >= 20} onClick={() => onChange({ ...value, conditions: [...value.conditions, { field: "message.text", operator: "CONTAINS", value: "" }] })} className="text-xs font-semibold text-ledger">+ Add</button></div><select disabled={disabled || value.conditions.length < 2} value={value.conditionJoin} onChange={(e) => onChange({ ...value, conditionJoin: e.target.value as "AND" | "OR" })} className="mt-2 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="AND">Match ALL</option><option value="OR">Match ANY</option></select><div className="mt-3 grid gap-3">{value.conditions.map((condition, index) => <ConditionEditor key={index} condition={condition} disabled={disabled} onChange={(patch) => update(index, patch)} onRemove={() => onChange({ ...value, conditions: value.conditions.filter((_, at) => at !== index) })} />)}</div></div>;
}

function QuestionEditor({ action, disabled, onChange }: { action: WhatsAppAutomationAction; disabled: boolean; onChange(patch: Partial<WhatsAppAutomationAction>): void }) {
  const mode = action.questionMode || "BUTTONS";
  const choices = action.choices || [];
  const max = mode === "BUTTONS" ? 3 : 10;
  const updateChoice = (index: number, patch: Partial<WhatsAppAutomationQuestionOption>) => onChange({ choices: choices.map((choice, at) => at === index ? { ...choice, ...patch } : choice) });
  const addChoice = () => {
    if (choices.length >= max) return;
    const number = choices.length + 1;
    onChange({ choices: [...choices, { id: `option_${number}`, title: `Option ${number}` }] });
  };
  return <div className="mt-3 grid gap-3">
    <label className="text-xs font-semibold text-ink-soft">Question<textarea disabled={disabled} rows={4} value={action.value || ""} onChange={(e) => onChange({ value: e.target.value })} placeholder="What service are you interested in?" className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm" /></label>
    <label className="text-xs font-semibold text-ink-soft">Choice style<select disabled={disabled} value={mode} onChange={(e) => { const next = e.target.value as WhatsAppAutomationQuestionMode; onChange({ questionMode: next, choices: next === "BUTTONS" ? choices.slice(0, 3) : choices }); }} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="BUTTONS">Reply buttons · 2–3 choices</option><option value="LIST">Choice list · 2–10 choices</option></select></label>
    {mode === "LIST" ? <Field label="List button text" disabled={disabled} value={action.listButtonText || "Choose"} onChange={(value) => onChange({ listButtonText: value })} placeholder="Choose" /> : null}
    <Field label="Save answer to (optional)" disabled={disabled} value={action.value2 || ""} onChange={(value) => onChange({ value2: value })} placeholder="custom.service_interest" />
    <div className="rounded-xl border border-rule p-3"><div className="flex items-center justify-between"><div className="text-xs font-semibold text-ink-soft">Choices</div><button type="button" disabled={disabled || choices.length >= max} onClick={addChoice} className="text-xs font-semibold text-ledger disabled:opacity-40">+ Choice</button></div><div className="mt-2 grid gap-2">{choices.map((choice, index) => <div key={`${choice.id}-${index}`} className="rounded-lg bg-paper-sunk p-2"><input disabled={disabled} value={choice.title} onChange={(e) => updateChoice(index, { title: e.target.value })} placeholder="Choice title" className="w-full rounded-lg border border-rule bg-paper px-2 py-2 text-sm" /><input disabled={disabled} value={choice.id} onChange={(e) => updateChoice(index, { id: e.target.value.replace(/\s+/g, "_").toLowerCase() })} placeholder="choice_id" className="mt-1 w-full rounded-lg border border-rule bg-paper px-2 py-2 font-mono text-xs" />{mode === "LIST" ? <input disabled={disabled} value={choice.description || ""} onChange={(e) => updateChoice(index, { description: e.target.value })} placeholder="Optional description" className="mt-1 w-full rounded-lg border border-rule bg-paper px-2 py-2 text-xs" /> : null}<button type="button" disabled={disabled || choices.length <= 2} onClick={() => onChange({ choices: choices.filter((_, at) => at !== index) })} className="mt-1 text-xs text-rose-700 disabled:opacity-30">Remove</button></div>)}</div></div>
    <div className="rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-800">The workflow pauses after sending this question. The selected title becomes <code>{"{{answer}}"}</code>; the option ID becomes <code>{"{{answer_id}}"}</code>. Add a Branch after this step and compare the <strong>answer</strong> field to route the contact.</div>
  </div>;
}

function ActionInspector({ action, disabled, teamMembers, templates, savedReplies, onChange, onRemove, onAppendBranch }: { action: WhatsAppAutomationAction; disabled: boolean; teamMembers: Props["teamMembers"]; templates: Props["templates"]; savedReplies: Props["savedReplies"]; onChange(patch: Partial<WhatsAppAutomationAction>): void; onRemove(): void; onAppendBranch(branch: "then" | "else"): void }) {
  const type = action.type;
  const changeType = (next: WhatsAppAutomationActionType) => onChange(newAction(next));
  return <div><h3 className="text-sm font-semibold">Action</h3><select disabled={disabled} value={type} onChange={(e) => changeType(e.target.value as WhatsAppAutomationActionType)} className="mt-2 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm">{WHATSAPP_AUTOMATION_ACTION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><p className="mt-2 text-xs leading-5 text-ink-faint">{WHATSAPP_AUTOMATION_ACTION_OPTIONS.find((item) => item.value === type)?.description}</p>
    {type === "ASK_QUESTION" ? <QuestionEditor action={action} disabled={disabled} onChange={onChange} /> : null}
    {type === "SEND_TEXT" || type === "ADD_INTERNAL_NOTE" ? <label className="mt-3 block text-xs font-semibold text-ink-soft">Content<textarea disabled={disabled} rows={5} value={action.value || ""} onChange={(e) => onChange({ value: e.target.value })} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm" placeholder="Hi {{first_name}}..." /></label> : null}
    {type === "SEND_TEMPLATE" ? <><label className="mt-3 block text-xs font-semibold text-ink-soft">Approved template<select disabled={disabled} value={action.value || ""} onChange={(e) => { const selected = templates.find((item) => item.name === e.target.value); onChange({ value: e.target.value, value2: selected?.language || "en_US" }); }} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="">Choose template</option>{templates.map((item) => <option key={`${item.name}:${item.language}`} value={item.name}>{item.name}</option>)}</select></label><Field label="Language" disabled={disabled} value={action.value2 || "en_US"} onChange={(v) => onChange({ value2: v })} /></> : null}
    {type === "SEND_SAVED_REPLY" ? <label className="mt-3 block text-xs font-semibold text-ink-soft">Team Saved Reply<select disabled={disabled} value={(action.value || "").replace(/^\/+/, "")} onChange={(e) => onChange({ value: e.target.value })} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="">Choose reply</option>{savedReplies.map((reply) => <option key={reply.shortcut} value={reply.shortcut}>/{reply.shortcut} · {reply.title}</option>)}</select></label> : null}
    {type === "SEND_WHATSAPP_FLOW" ? <><AutomationFlowSelect disabled={disabled} value={action.value || ""} onChange={(v) => onChange({ value: v })} /><Field label="Flow button text" disabled={disabled} value={action.value2 || "Open form"} onChange={(v) => onChange({ value2: v.slice(0, 30) })} placeholder="Open form" /><p className="mt-2 text-[0.68rem] leading-5 text-ink-faint">This action creates a tracked Flow submission, records the outbound item, and emits the WhatsApp Flow Started trigger.</p></> : null}
    {type === "ASSIGN_CONVERSATION" ? <label className="mt-3 block text-xs font-semibold text-ink-soft">Assign to<select disabled={disabled} value={action.value || ""} onChange={(e) => onChange({ value: e.target.value })} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="">Choose member</option>{teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.availability}</option>)}</select></label> : null}
    {new Set(["ADD_TAG", "REMOVE_TAG", "UPDATE_CRM_STAGE", "CALL_WEBHOOK"]).has(type) ? <Field label={type === "CALL_WEBHOOK" ? "HTTPS URL" : type === "UPDATE_CRM_STAGE" ? "CRM stage" : "Tag"} disabled={disabled} value={action.value || ""} onChange={(v) => onChange({ value: v })} /> : null}
    {type === "UPDATE_CONTACT_FIELD" ? <><Field label="Field" disabled={disabled} value={action.value || ""} onChange={(v) => onChange({ value: v })} placeholder="custom.budget" /><Field label="New value" disabled={disabled} value={action.value2 || ""} onChange={(v) => onChange({ value2: v })} placeholder="{{answer}}" /></> : null}
    {type === "DELAY" ? <div className="mt-3 grid grid-cols-[1fr_8rem] gap-2"><Field label="Amount" disabled={disabled} type="number" value={String(action.amount || "")} onChange={(v) => onChange({ amount: Number(v) })} /><label className="text-xs font-semibold text-ink-soft">Unit<select disabled={disabled} value={action.unit || "MINUTES"} onChange={(e) => onChange({ unit: e.target.value as "MINUTES" | "HOURS" | "DAYS" })} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-2 py-2 text-sm"><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option></select></label></div> : null}
    {type === "BRANCH" ? <div className="mt-3"><ConditionEditor condition={action.condition || { field: "answer", operator: "EQUALS", value: "" }} disabled={disabled} onChange={(patch) => onChange({ condition: { ...(action.condition || { field: "answer", operator: "EQUALS", value: "" }), ...patch } })} /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={disabled} onClick={() => onAppendBranch("then")} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">+ Yes action</button><button type="button" disabled={disabled} onClick={() => onAppendBranch("else")} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">+ No action</button></div><p className="mt-2 text-xs text-ink-faint">Yes/No paths may be empty while you build. Saving is still allowed.</p></div> : null}
    <button type="button" disabled={disabled} onClick={onRemove} className="mt-5 w-full rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-30">Remove step</button>
  </div>;
}

function Field({ label, value, onChange, disabled, placeholder, type = "text" }: { label: string; value: string; onChange(value: string): void; disabled?: boolean; placeholder?: string; type?: string }) {
  return <label className="mt-3 block text-xs font-semibold text-ink-soft">{label}<input type={type} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-rule bg-paper-raised px-3 py-2 text-sm" /></label>;
}

function History({ runs, automations, waitingByRun, inspectRun, cancelRun }: { runs: WhatsAppAutomationRun[]; automations: WhatsAppAutomation[]; waitingByRun: Map<string, WhatsAppAutomationJob>; inspectRun(id: string): void; cancelRun(id: string): void }) {
  const names = new Map(automations.map((automation) => [automation.id, automation.name]));
  return <div className="mt-4 overflow-hidden rounded-2xl border border-rule bg-paper"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-paper-sunk text-[0.65rem] uppercase tracking-[.08em] text-ink-faint"><tr><th className="px-3 py-3">Workflow</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Trigger</th><th className="px-3 py-3">Started</th><th className="px-3 py-3">Waiting</th><th className="px-3 py-3">Error</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{runs.map((run) => { const job = waitingByRun.get(run.id); return <tr key={run.id} className="border-t border-rule"><td className="px-3 py-3 font-semibold text-ink">{names.get(run.automationId) || run.automationId.slice(0, 8)}</td><td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 ${statusClass(run.status)}`}>{run.status}</span></td><td className="px-3 py-3">{run.triggerType}</td><td className="px-3 py-3">{formatWhen(run.startedAt || run.createdAt)}</td><td className="px-3 py-3">{job?.status === "WAITING_INPUT" ? "Waiting for customer choice" : job ? formatWhen(job.dueAt) : "—"}</td><td className="max-w-[260px] px-3 py-3 text-rose-700">{run.errorMessage || job?.lastError || "—"}</td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => inspectRun(run.id)} className="rounded-lg border border-rule px-2 py-1.5 font-semibold text-ledger">Inspect</button>{run.status === "WAITING" ? <button onClick={() => cancelRun(run.id)} className="rounded-lg border border-rose-200 px-2 py-1.5 text-rose-700">Cancel</button> : null}</div></td></tr>; })}{!runs.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-faint">No automation runs yet.</td></tr> : null}</tbody></table></div></div>;
}
