"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_AUTOMATION_ACTION_OPTIONS,
  WHATSAPP_AUTOMATION_CONDITION_FIELDS,
  WHATSAPP_AUTOMATION_CONDITION_OPERATORS,
  WHATSAPP_AUTOMATION_TRIGGER_OPTIONS,
  getWhatsAppAutomationActionLabel,
  getWhatsAppAutomationTriggerLabel,
  validateWhatsAppAutomationInput,
  type WhatsAppAutomation,
  type WhatsAppAutomationAction,
  type WhatsAppAutomationActionType,
  type WhatsAppAutomationCondition,
  type WhatsAppAutomationConditionOperator,
  type WhatsAppAutomationInput,
  type WhatsAppAutomationStatus,
  type WhatsAppAutomationTriggerType,
} from "@/lib/whatsapp/automationModel";

type Notice = { tone: "ok" | "error"; text: string } | null;
type Filter = "ALL" | WhatsAppAutomationStatus;

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

function editable(value: WhatsAppAutomation): WhatsAppAutomationInput {
  return {
    name: value.name,
    description: value.description,
    status: value.status,
    triggerType: value.triggerType,
    triggerConfig: { ...value.triggerConfig },
    conditionJoin: value.conditionJoin,
    conditions: value.conditions.map((condition) => ({ ...condition })),
    actions: value.actions.map((action) => ({ ...action })),
  };
}

function duplicateDraft(value: WhatsAppAutomation): WhatsAppAutomationInput {
  return { ...editable(value), name: `${value.name} copy`, status: "DRAFT" };
}

function statusClass(status: WhatsAppAutomationStatus) {
  if (status === "ACTIVE") return "bg-ledger-tint text-ledger";
  if (status === "PAUSED") return "bg-brass-tint text-[#6f4f16]";
  return "bg-paper-sunk text-ink-faint";
}

function triggerConfigField(type: WhatsAppAutomationTriggerType) {
  if (type === "KEYWORD") return { key: "keyword", label: "Keyword or phrase", placeholder: "price" };
  if (type === "TAG_ADDED") return { key: "tag", label: "Trigger tag", placeholder: "Qualified" };
  if (type === "CRM_STAGE_CHANGED") return { key: "stage", label: "Destination CRM stage", placeholder: "QUALIFIED" };
  if (type === "CONVERSATION_ASSIGNED") return { key: "memberId", label: "Team member ID (optional)", placeholder: "Leave blank for any assignment" };
  if (type === "WEBHOOK") return { key: "key", label: "Webhook key", placeholder: "new-order" };
  return null;
}

function actionValueMeta(type: WhatsAppAutomationActionType) {
  if (type === "SEND_TEXT") return { label: "Message text", placeholder: "Thanks for contacting us...", multiline: true };
  if (type === "SEND_TEMPLATE") return { label: "Approved template name", placeholder: "order_update" };
  if (type === "SEND_SAVED_REPLY") return { label: "Saved Reply shortcut", placeholder: "/pricing" };
  if (type === "ASSIGN_CONVERSATION") return { label: "Team member ID", placeholder: "member UUID" };
  if (type === "ADD_TAG" || type === "REMOVE_TAG") return { label: "Tag", placeholder: "Qualified" };
  if (type === "UPDATE_CRM_STAGE") return { label: "CRM stage", placeholder: "FOLLOW_UP" };
  if (type === "ADD_INTERNAL_NOTE") return { label: "Internal note", placeholder: "Automation added this note...", multiline: true };
  if (type === "CALL_WEBHOOK") return { label: "Webhook URL", placeholder: "https://example.com/webhook" };
  return null;
}

function TriggerEditor({ value, onChange, disabled }: { value: WhatsAppAutomationInput; onChange(value: WhatsAppAutomationInput): void; disabled: boolean }) {
  const option = WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.find((item) => item.value === value.triggerType);
  const field = triggerConfigField(value.triggerType);
  const timed = value.triggerType === "NO_CUSTOMER_REPLY" || value.triggerType === "NO_AGENT_REPLY";
  const businessHours = value.triggerType === "BUSINESS_HOURS";
  return (
    <section className="rounded-xl border border-rule bg-paper p-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">When</p>
      <select
        value={value.triggerType}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, triggerType: event.target.value as WhatsAppAutomationTriggerType, triggerConfig: {} })}
        className="mt-2 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm"
      >
        {WHATSAPP_AUTOMATION_TRIGGER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <p className="mt-2 text-xs leading-5 text-ink-faint">{option?.description}</p>
      {field ? (
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink-soft">{field.label}</span>
          <input
            disabled={disabled}
            value={String(value.triggerConfig[field.key] || "")}
            onChange={(event) => onChange({ ...value, triggerConfig: { ...value.triggerConfig, [field.key]: event.target.value } })}
            placeholder={field.placeholder}
            className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ledger-bright"
          />
        </label>
      ) : null}
      {timed ? (
        <div className="mt-3 grid grid-cols-[1fr_10rem] gap-2">
          <label><span className="text-xs font-semibold text-ink-soft">Delay</span><input disabled={disabled} type="number" min={1} max={365} value={String(value.triggerConfig.amount || "")} onChange={(event) => onChange({ ...value, triggerConfig: { ...value.triggerConfig, amount: Number(event.target.value) } })} className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm" /></label>
          <label><span className="text-xs font-semibold text-ink-soft">Unit</span><select disabled={disabled} value={String(value.triggerConfig.unit || "HOURS")} onChange={(event) => onChange({ ...value, triggerConfig: { ...value.triggerConfig, unit: event.target.value } })} className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option></select></label>
        </div>
      ) : null}
      {businessHours ? (
        <label className="mt-3 block"><span className="text-xs font-semibold text-ink-soft">Transition</span><select disabled={disabled} value={String(value.triggerConfig.transition || "OPENED")} onChange={(event) => onChange({ ...value, triggerConfig: { ...value.triggerConfig, transition: event.target.value } })} className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="OPENED">Business hours opened</option><option value="CLOSED">Business hours closed</option></select></label>
      ) : null}
    </section>
  );
}

function ConditionsEditor({ value, onChange, disabled }: { value: WhatsAppAutomationInput; onChange(value: WhatsAppAutomationInput): void; disabled: boolean }) {
  function update(index: number, patch: Partial<WhatsAppAutomationCondition>) {
    onChange({ ...value, conditions: value.conditions.map((condition, at) => at === index ? { ...condition, ...patch } : condition) });
  }
  return (
    <section className="rounded-xl border border-rule bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">If</p><p className="mt-1 text-xs text-ink-faint">Optional conditions narrow when this workflow should continue.</p></div>
        <div className="flex items-center gap-2"><select disabled={disabled || value.conditions.length < 2} value={value.conditionJoin} onChange={(event) => onChange({ ...value, conditionJoin: event.target.value as "AND" | "OR" })} className="rounded-lg border border-rule bg-paper-raised px-2 py-1.5 text-xs"><option value="AND">Match ALL</option><option value="OR">Match ANY</option></select><button type="button" disabled={disabled || value.conditions.length >= 10} onClick={() => onChange({ ...value, conditions: [...value.conditions, { field: "message.text", operator: "CONTAINS", value: "" }] })} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ledger">+ Condition</button></div>
      </div>
      {value.conditions.length ? <div className="mt-3 grid gap-2">{value.conditions.map((condition, index) => {
        const noValue = condition.operator === "EXISTS" || condition.operator === "NOT_EXISTS";
        return <div key={index} className="grid gap-2 rounded-lg border border-rule bg-paper-raised p-2 md:grid-cols-[1fr_10rem_1fr_auto]">
          <select disabled={disabled} value={condition.field} onChange={(event) => update(index, { field: event.target.value })} className="rounded-lg border border-rule bg-paper px-2 py-2 text-xs">{WHATSAPP_AUTOMATION_CONDITION_FIELDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <select disabled={disabled} value={condition.operator} onChange={(event) => update(index, { operator: event.target.value as WhatsAppAutomationConditionOperator })} className="rounded-lg border border-rule bg-paper px-2 py-2 text-xs">{WHATSAPP_AUTOMATION_CONDITION_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator.replaceAll("_", " ")}</option>)}</select>
          {noValue ? <div className="rounded-lg bg-paper-sunk px-3 py-2 text-xs text-ink-faint">No comparison value</div> : <input disabled={disabled} value={condition.value} onChange={(event) => update(index, { value: event.target.value })} placeholder="Comparison value" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" />}
          <button type="button" disabled={disabled} onClick={() => onChange({ ...value, conditions: value.conditions.filter((_, at) => at !== index) })} className="rounded-lg border border-rule px-2 text-xs text-rose-700">Remove</button>
        </div>;
      })}</div> : <p className="mt-3 rounded-lg bg-paper-sunk px-3 py-3 text-xs text-ink-faint">No conditions. The workflow will continue whenever its trigger fires.</p>}
    </section>
  );
}

function ActionsEditor({ value, onChange, disabled }: { value: WhatsAppAutomationInput; onChange(value: WhatsAppAutomationInput): void; disabled: boolean }) {
  function update(index: number, patch: Partial<WhatsAppAutomationAction>) {
    onChange({ ...value, actions: value.actions.map((action, at) => at === index ? { ...action, ...patch } : action) });
  }
  return (
    <section className="rounded-xl border border-rule bg-paper p-4">
      <div className="flex items-center justify-between gap-2"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Then</p><p className="mt-1 text-xs text-ink-faint">Actions execute in this order once the engine is wired in 6B–6D.</p></div><button type="button" disabled={disabled || value.actions.length >= 12} onClick={() => onChange({ ...value, actions: [...value.actions, { type: "ADD_TAG", value: "" }] })} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ledger">+ Action</button></div>
      <div className="mt-3 grid gap-2">{value.actions.map((action, index) => {
        const meta = actionValueMeta(action.type);
        return <div key={index} className="rounded-lg border border-rule bg-paper-raised p-3">
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-ledger-tint text-[0.65rem] font-semibold text-ledger">{index + 1}</span><select disabled={disabled} value={action.type} onChange={(event) => update(index, { type: event.target.value as WhatsAppAutomationActionType, value: undefined, value2: undefined, amount: undefined, unit: undefined })} className="min-w-0 flex-1 rounded-lg border border-rule bg-paper px-2 py-2 text-xs">{WHATSAPP_AUTOMATION_ACTION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button type="button" disabled={disabled || value.actions.length <= 1} onClick={() => onChange({ ...value, actions: value.actions.filter((_, at) => at !== index) })} className="rounded-lg border border-rule px-2 py-2 text-xs text-rose-700">Remove</button></div>
          {action.type === "DELAY" ? <div className="mt-2 grid grid-cols-[1fr_10rem] gap-2"><input disabled={disabled} type="number" min={1} max={365} value={action.amount || ""} onChange={(event) => update(index, { amount: Number(event.target.value) })} placeholder="Delay amount" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /><select disabled={disabled} value={action.unit || "HOURS"} onChange={(event) => update(index, { unit: event.target.value as "MINUTES" | "HOURS" | "DAYS" })} className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm"><option value="MINUTES">Minutes</option><option value="HOURS">Hours</option><option value="DAYS">Days</option></select></div> : null}
          {action.type === "UPDATE_CONTACT_FIELD" ? <div className="mt-2 grid gap-2 sm:grid-cols-2"><input disabled={disabled} value={action.value || ""} onChange={(event) => update(index, { value: event.target.value })} placeholder="Field name, e.g. custom.budget" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /><input disabled={disabled} value={action.value2 || ""} onChange={(event) => update(index, { value2: event.target.value })} placeholder="New value" className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /></div> : null}
          {meta ? meta.multiline ? <textarea disabled={disabled} rows={3} value={action.value || ""} onChange={(event) => update(index, { value: event.target.value })} placeholder={meta.placeholder} className="mt-2 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /> : <input disabled={disabled} value={action.value || ""} onChange={(event) => update(index, { value: event.target.value })} placeholder={meta.placeholder} className="mt-2 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /> : null}
        </div>;
      })}</div>
    </section>
  );
}

function WorkflowPreview({ value }: { value: WhatsAppAutomationInput }) {
  return <div className="rounded-xl border border-rule bg-paper p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Workflow preview</p><div className="mt-3 grid gap-2"><div className="rounded-lg bg-ledger-tint px-3 py-2"><span className="text-[0.65rem] font-semibold uppercase text-ledger">When</span><p className="mt-0.5 text-sm font-semibold text-ink">{getWhatsAppAutomationTriggerLabel(value.triggerType)}</p></div>{value.conditions.length ? <div className="rounded-lg bg-paper-sunk px-3 py-2"><span className="text-[0.65rem] font-semibold uppercase text-ink-faint">If · {value.conditionJoin}</span><p className="mt-0.5 text-sm text-ink-soft">{value.conditions.length} condition{value.conditions.length === 1 ? "" : "s"}</p></div> : null}<div className="rounded-lg bg-paper-sunk px-3 py-2"><span className="text-[0.65rem] font-semibold uppercase text-ink-faint">Then</span><ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-ink-soft">{value.actions.map((action, index) => <li key={index}>{getWhatsAppAutomationActionLabel(action.type)}</li>)}</ol></div></div></div>;
}

export default function AutomationManager({ automations, storageReady, role }: { automations: WhatsAppAutomation[]; storageReady: boolean; role: "owner" | "manager" | "agent" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<WhatsAppAutomationInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => automations.filter((automation) => {
    if (filter !== "ALL" && automation.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || [automation.name, automation.description, automation.triggerType, automation.status].some((item) => item.toLowerCase().includes(q));
  }), [automations, filter, query]);

  async function jsonMutation(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/whatsapp/automations/", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok || !body.ok) throw new Error(body.error || "The automation change failed.");
    return body;
  }

  function reset() { setEditingId(null); setEditor(EMPTY); }

  function save(event: FormEvent) {
    event.preventDefault();
    const checked = validateWhatsAppAutomationInput(editor as unknown as Record<string, unknown>);
    if (!checked.ok) return setNotice({ tone: "error", text: checked.error });
    startTransition(async () => {
      try {
        await jsonMutation(editingId ? "PATCH" : "POST", editingId ? { id: editingId, ...checked.value } : checked.value);
        setNotice({ tone: "ok", text: editingId ? "Automation updated." : "Automation saved." });
        reset();
        router.refresh();
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not save automation." });
      }
    });
  }

  function changeStatus(automation: WhatsAppAutomation, status: WhatsAppAutomationStatus) {
    startTransition(async () => {
      try {
        await jsonMutation("PATCH", { id: automation.id, ...editable(automation), status });
        setNotice({ tone: "ok", text: status === "ACTIVE" ? "Automation marked Active. Trigger execution arrives in Stage 6B." : status === "PAUSED" ? "Automation paused." : "Automation returned to Draft." });
        router.refresh();
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not change automation status." });
      }
    });
  }

  function remove(automation: WhatsAppAutomation) {
    if (!window.confirm(`Delete “${automation.name}”?`)) return;
    startTransition(async () => {
      try {
        await jsonMutation("DELETE", { id: automation.id });
        setNotice({ tone: "ok", text: "Automation deleted." });
        if (editingId === automation.id) reset();
        router.refresh();
      } catch (error) {
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not delete automation." });
      }
    });
  }

  return <div className="pb-10">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-lg font-semibold text-ink">Automation Engine</h1><p className="mt-1 max-w-3xl text-sm text-ink-faint">Stage 6A stores real workflow definitions and durable execution records. Trigger execution is wired in the next Stage 6 slices.</p><p className="mt-1 text-xs text-ink-faint">Signed in as {role}. Current production testing uses Owner only.</p></div><button type="button" onClick={() => router.refresh()} className="rounded-full border border-rule bg-paper-raised px-4 py-2 text-xs font-semibold text-ledger">Refresh</button></div>
    <div className="mt-4 rounded-xl border border-brass/25 bg-brass-tint px-4 py-3 text-xs leading-5 text-[#6f4f16]"><strong>Stage 6A boundary:</strong> Active/Paused state is persisted now, but active workflows do not execute until the trigger engine is connected in Stage 6B. This avoids fake automation behavior.</div>
    {!storageReady ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">Automation storage is waiting for the Stage 6A additive Supabase migration. The builder is visible but saving is disabled.</div> : null}
    {notice ? <div className={`mt-4 rounded-xl px-4 py-3 text-xs ${notice.tone === "ok" ? "bg-ledger-tint text-ledger" : "bg-rose-50 text-rose-700"}`}>{notice.text}</div> : null}

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_34rem]">
      <section>
        <div className="flex flex-wrap items-center gap-2">{(["ALL", "DRAFT", "ACTIVE", "PAUSED"] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? "bg-ledger-bright text-white" : "border border-rule bg-paper-raised text-ink-soft"}`}>{item === "ALL" ? "All" : item[0] + item.slice(1).toLowerCase()}</button>)}</div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search automations" className="mt-3 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ledger-bright" />
        <div className="mt-3 grid gap-3">{visible.map((automation) => <article key={automation.id} className="rounded-xl border border-rule bg-paper-raised p-4"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-ink">{automation.name}</h2><span className={`rounded-full px-2 py-1 text-[0.62rem] font-semibold ${statusClass(automation.status)}`}>{automation.status}</span></div><p className="mt-1 text-xs text-ink-faint">{getWhatsAppAutomationTriggerLabel(automation.triggerType)} · {automation.conditions.length} condition{automation.conditions.length === 1 ? "" : "s"} · {automation.actions.length} action{automation.actions.length === 1 ? "" : "s"} · v{automation.version}</p>{automation.description ? <p className="mt-2 text-sm leading-6 text-ink-soft">{automation.description}</p> : null}</div></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingId(automation.id); setEditor(editable(automation)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft">Edit</button><button type="button" onClick={() => { setEditingId(null); setEditor(duplicateDraft(automation)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft">Duplicate</button>{automation.status !== "ACTIVE" ? <button type="button" disabled={pending} onClick={() => changeStatus(automation, "ACTIVE")} className="rounded-full bg-ledger-bright px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Mark Active</button> : <button type="button" disabled={pending} onClick={() => changeStatus(automation, "PAUSED")} className="rounded-full bg-brass-tint px-3 py-1.5 text-xs font-semibold text-[#6f4f16] disabled:opacity-50">Pause</button>}{automation.status !== "ACTIVE" ? <button type="button" disabled={pending} onClick={() => remove(automation)} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Delete</button> : null}</div></article>)}{visible.length === 0 ? <div className="rounded-xl border border-dashed border-rule-strong px-4 py-12 text-center text-sm text-ink-faint">No automations match this view.</div> : null}</div>
      </section>

      <aside className="xl:sticky xl:top-5 xl:self-start"><form onSubmit={save} className="rounded-xl border border-rule bg-paper-raised p-4"><div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-ink">{editingId ? "Edit automation" : "New automation"}</h2><p className="mt-1 text-xs text-ink-faint">Build Trigger → Conditions → Actions.</p></div>{editingId || editor.name ? <button type="button" onClick={reset} className="text-xs text-ink-faint underline">Clear</button> : null}</div>
        <div className="mt-4 grid gap-3"><label><span className="text-xs font-semibold text-ink-soft">Name</span><input disabled={pending || !storageReady} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="Pricing lead follow-up" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /></label><label><span className="text-xs font-semibold text-ink-soft">Description</span><textarea disabled={pending || !storageReady} rows={2} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} placeholder="What this workflow is meant to do" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm" /></label><label><span className="text-xs font-semibold text-ink-soft">State</span><select disabled={pending || !storageReady} value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as WhatsAppAutomationStatus })} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"><option value="DRAFT">Draft</option><option value="ACTIVE">Active (state only in 6A)</option><option value="PAUSED">Paused</option></select></label></div>
        <div className="mt-4 grid gap-3"><TriggerEditor value={editor} onChange={setEditor} disabled={pending || !storageReady} /><ConditionsEditor value={editor} onChange={setEditor} disabled={pending || !storageReady} /><ActionsEditor value={editor} onChange={setEditor} disabled={pending || !storageReady} /><WorkflowPreview value={editor} /></div>
        <button disabled={pending || !storageReady} className="mt-4 w-full rounded-full bg-ledger-bright px-4 py-2.5 text-sm font-semibold text-white disabled:bg-paper-sunk disabled:text-ink-faint">{pending ? "Saving…" : editingId ? "Update automation" : "Save automation"}</button>
      </form></aside>
    </div>
  </div>;
}
