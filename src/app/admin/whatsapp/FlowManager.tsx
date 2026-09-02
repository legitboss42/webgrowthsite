"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_FLOW_CATEGORIES,
  WHATSAPP_FLOW_COMPONENT_TYPES,
  WHATSAPP_FLOW_STARTERS,
  buildWhatsAppFlowJson,
  createWhatsAppFlowComponent,
  createWhatsAppFlowScreen,
  validateWhatsAppFlowBuilder,
  type WhatsAppFlow,
  type WhatsAppFlowBuilderDefinition,
  type WhatsAppFlowCategory,
  type WhatsAppFlowComponent,
  type WhatsAppFlowComponentType,
  type WhatsAppFlowCrmMapping,
  type WhatsAppFlowSubmission,
} from "@/lib/whatsapp/flowModel";

type Props = { flows: WhatsAppFlow[]; submissions: WhatsAppFlowSubmission[]; storageReady: boolean; role: string; encryptionConfigured: boolean };
type Draft = { name: string; categories: WhatsAppFlowCategory[]; builder: WhatsAppFlowBuilderDefinition; crmMapping: WhatsAppFlowCrmMapping };
type Notice = { tone: "ok" | "error" | "warn"; text: string } | null;
const BLANK: Draft = { name: "", categories: ["OTHER"], builder: { screens: [createWhatsAppFlowScreen(0)], dynamic: false, completionButtonLabel: "Submit" }, crmMapping: {} };

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function when(value?: string) { if (!value) return "—"; const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleString() : "—"; }
function statusClass(status: string) {
  if (status === "PUBLISHED" || status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "DRAFT" || status === "STARTED") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "BLOCKED" || status === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-rule bg-paper-sunk text-ink-faint";
}
function inputComponents(builder: WhatsAppFlowBuilderDefinition) {
  const inputs = new Set<string>();
  for (const screen of builder.screens) for (const component of screen.components) {
    if (["TextInput", "TextArea", "Dropdown", "RadioButtonsGroup", "CheckboxGroup", "DatePicker", "OptIn"].includes(component.type) && component.name?.trim()) inputs.add(component.name.trim());
  }
  return [...inputs];
}
function componentTitle(component: WhatsAppFlowComponent) { return component.label || component.text || component.name || component.type; }

export default function FlowManager({ flows, submissions, storageReady, role, encryptionConfigured }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [source, setSource] = useState<WhatsAppFlow | null>(null);
  const [draft, setDraft] = useState<Draft>(clone(BLANK));
  const [screenIndex, setScreenIndex] = useState(0);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [testRecipient, setTestRecipient] = useState("");

  const visible = useMemo(() => flows.filter((flow) => {
    if (status !== "ALL" && flow.status !== status) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${flow.name} ${flow.categories.join(" ")} ${flow.metaFlowId || ""}`.toLowerCase().includes(needle);
  }), [flows, query, status]);
  const analytics = useMemo(() => {
    const byFlow = new Map<string, { started: number; completed: number; failed: number }>();
    for (const item of submissions) {
      if (!item.flowId) continue; const row = byFlow.get(item.flowId) || { started: 0, completed: 0, failed: 0 };
      row.started += 1; if (item.status === "COMPLETED") row.completed += 1; if (item.status === "FAILED") row.failed += 1; byFlow.set(item.flowId, row);
    }
    return byFlow;
  }, [submissions]);
  const currentScreen = draft.builder.screens[screenIndex] || draft.builder.screens[0];
  const currentComponent = currentScreen?.components.find((item) => item.id === componentId) || null;
  const locked = Boolean(source && source.status !== "DRAFT");
  const validation = validateWhatsAppFlowBuilder(draft.builder);
  const generated = useMemo(() => { try { return buildWhatsAppFlowJson(draft.builder); } catch { return null; } }, [draft.builder]);

  function begin(value?: WhatsAppFlow) {
    if (value) { setSource(value); setDraft({ name: value.name, categories: value.categories, builder: clone(value.builder), crmMapping: clone(value.crmMapping) }); }
    else { setSource(null); setDraft(clone(BLANK)); }
    setScreenIndex(0); setComponentId(null); setNotice(null); setBuilderOpen(true);
  }
  function beginStarter(key: string) {
    const starter = WHATSAPP_FLOW_STARTERS.find((item) => item.key === key); if (!starter) return begin();
    setSource(null); setDraft({ name: starter.label, categories: [starter.category], builder: clone(starter.builder), crmMapping: clone(starter.crmMapping) });
    setScreenIndex(0); setComponentId(null); setNotice(null); setBuilderOpen(true);
  }
  async function api(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/whatsapp/flows/", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({})) as { error?: string; warning?: string; validationErrors?: Array<Record<string, unknown>>; [key: string]: unknown };
    if (!response.ok) throw Object.assign(new Error(data.error || "Flow request failed."), { payload: data });
    return data;
  }
  function save() {
    if (pending || locked || validation || draft.name.trim().length < 2) { if (validation) setNotice({ tone: "error", text: validation }); return; }
    startTransition(async () => {
      try {
        const result = await api(source ? "PATCH" : "POST", { ...(source ? { id: source.id } : { action: "CREATE" }), ...draft });
        const errors = Array.isArray(result.validationErrors) ? result.validationErrors.length : 0;
        setNotice({ tone: errors ? "warn" : "ok", text: errors ? `Saved, but Meta returned ${errors} validation error${errors === 1 ? "" : "s"}.` : source ? "Flow saved and uploaded to Meta." : "Flow created in Web Growth and Meta." });
        setBuilderOpen(false); router.refresh();
      } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Flow save failed." }); }
    });
  }
  function action(action: string, flow: WhatsAppFlow) {
    startTransition(async () => {
      try { await api("POST", { action, id: flow.id }); setNotice({ tone: "ok", text: action === "PUBLISH" ? "Flow published." : action === "DEPRECATE" ? "Flow deprecated." : action === "SYNC" ? "Flow refreshed from Meta." : "Flow action completed." }); setBuilderOpen(false); router.refresh(); }
      catch (error) { const payload = (error as Error & { payload?: { validationErrors?: unknown[] } }).payload; const count = payload?.validationErrors?.length || 0; setNotice({ tone: "error", text: count ? `Meta rejected publishing with ${count} validation error${count === 1 ? "" : "s"}. Open the Draft to review them.` : error instanceof Error ? error.message : "Flow action failed." }); }
    });
  }
  function duplicate(flow: WhatsAppFlow) {
    startTransition(async () => { try { await api("POST", { action: "DUPLICATE", id: flow.id, name: `${flow.name} copy` }); setNotice({ tone: "ok", text: "Editable Draft copy created." }); router.refresh(); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Duplicate failed." }); } });
  }
  function remove(flow: WhatsAppFlow) {
    if (flow.status !== "DRAFT" || !confirm(`Delete Draft “${flow.name}” from Web Growth and Meta?`)) return;
    startTransition(async () => { try { await api("DELETE", { id: flow.id }); setNotice({ tone: "ok", text: "Draft deleted." }); setBuilderOpen(false); router.refresh(); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Delete failed." }); } });
  }
  function registerEncryptionKey() {
    startTransition(async () => {
      try { const response = await fetch("/api/admin/whatsapp/flows/encryption/", { method: "POST" }); const data = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(data.error || "Key registration failed."); setNotice({ tone: "ok", text: "Flow public key registered with Meta." }); router.refresh(); }
      catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Key registration failed." }); }
    });
  }
  function testSend(flow: WhatsAppFlow) {
    if (!testRecipient.trim()) { setNotice({ tone: "warn", text: "Enter a WhatsApp number for the Flow test send." }); return; }
    startTransition(async () => {
      try { const response = await fetch("/api/admin/whatsapp/flows/test-send/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: flow.id, waId: testRecipient.trim() }) }); const data = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(data.error || "Test send failed."); setNotice({ tone: "ok", text: "Published Flow test sent." }); }
      catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Test send failed." }); }
    });
  }

  function updateScreen(patch: Partial<(typeof draft.builder.screens)[number]>) {
    if (locked) return; setDraft((value) => ({ ...value, builder: { ...value.builder, screens: value.builder.screens.map((screen, index) => index === screenIndex ? { ...screen, ...patch } : screen) } }));
  }
  function updateComponent(patch: Partial<WhatsAppFlowComponent>) {
    if (locked || !currentComponent) return; updateScreen({ components: currentScreen.components.map((component) => component.id === currentComponent.id ? { ...component, ...patch } : component) });
  }
  function addComponent(type: WhatsAppFlowComponentType) {
    if (locked || !currentScreen) return; const component = createWhatsAppFlowComponent(type, currentScreen.components.length); updateScreen({ components: [...currentScreen.components, component] }); setComponentId(component.id);
  }
  function removeComponent() {
    if (locked || !currentComponent) return; updateScreen({ components: currentScreen.components.filter((component) => component.id !== currentComponent.id) }); setComponentId(null);
  }
  function addScreen() {
    if (locked || draft.builder.screens.length >= 20) return; const next = createWhatsAppFlowScreen(draft.builder.screens.length); setDraft((value) => ({ ...value, builder: { ...value.builder, screens: [...value.builder.screens, next] } })); setScreenIndex(draft.builder.screens.length); setComponentId(null);
  }
  function removeScreen(index: number) {
    if (locked || draft.builder.screens.length <= 1) return; setDraft((value) => ({ ...value, builder: { ...value.builder, screens: value.builder.screens.filter((_, i) => i !== index) } })); setScreenIndex(0); setComponentId(null);
  }

  if (builderOpen) return <div className="-mx-3 -my-4 min-h-[calc(100vh-5rem)] bg-[#f6f7f4] sm:-mx-5 sm:-my-5">
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-rule bg-paper/95 px-3 py-3 backdrop-blur sm:px-5">
      <button onClick={() => setBuilderOpen(false)} className="rounded-lg border border-rule px-3 py-2 text-sm">← Flows</button>
      <div className="min-w-[180px] flex-1"><input disabled={locked} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="w-full bg-transparent text-lg font-semibold outline-none" placeholder="Flow name" /><p className="text-[0.68rem] text-ink-faint">{source ? `${source.status} · v${source.version}${source.metaFlowId ? ` · Meta ${source.metaFlowId}` : ""}` : "New Flow"}</p></div>
      {source?.previewUrl ? <a href={source.previewUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-rule px-3 py-2 text-sm font-semibold text-ledger">Meta preview</a> : null}
      {source ? <button disabled={pending} onClick={() => action("SYNC", source)} className="rounded-lg border border-rule px-3 py-2 text-sm">Sync Meta</button> : null}
      {source?.status === "DRAFT" ? <button disabled={pending || Boolean(validation)} onClick={() => action("PUBLISH", source)} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Publish</button> : null}
      {!locked ? <button disabled={pending || Boolean(validation) || draft.name.trim().length < 2} onClick={save} className="rounded-lg bg-ledger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{pending ? "Working…" : "Save"}</button> : <button onClick={() => source && duplicate(source)} className="rounded-lg bg-ledger px-4 py-2 text-sm font-semibold text-white">Duplicate to edit</button>}
    </header>
    {notice ? <div className={`mx-4 mt-3 rounded-xl px-4 py-3 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : notice.tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>{notice.text}</div> : null}
    {draft.builder.dynamic && !encryptionConfigured ? <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Dynamic data exchange is built, but this deployment still needs <code>WHATSAPP_FLOW_PRIVATE_KEY</code> configured before Meta can call it successfully.</div> : null}
    {source?.validationErrors.length ? <div className="mx-4 mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"><p className="font-semibold">Meta validation errors</p><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(source.validationErrors, null, 2)}</pre></div> : null}

    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[240px_minmax(360px,1fr)_340px]">
      <aside className="border-r border-rule bg-paper p-3">
        <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-ink-faint">Screens</h2>{!locked ? <button onClick={addScreen} className="rounded-lg border border-rule px-2 py-1 text-xs">+ Screen</button> : null}</div>
        <div className="mt-3 space-y-2">{draft.builder.screens.map((screen, index) => <button key={`${screen.id}-${index}`} onClick={() => { setScreenIndex(index); setComponentId(null); }} className={`w-full rounded-xl border p-3 text-left ${index === screenIndex ? "border-ledger bg-ledger-tint" : "border-rule bg-paper-raised"}`}><span className="block text-[0.62rem] uppercase text-ink-faint">Screen {index + 1}</span><span className="mt-1 block truncate text-sm font-semibold">{screen.title || screen.id}</span></button>)}</div>
        {!locked && draft.builder.screens.length > 1 ? <button onClick={() => removeScreen(screenIndex)} className="mt-3 w-full rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-700">Remove selected screen</button> : null}
        <div className="mt-6"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-ink-faint">Components</h2><div className="mt-2 grid grid-cols-2 gap-2">{WHATSAPP_FLOW_COMPONENT_TYPES.map((type) => <button key={type} disabled={locked} onClick={() => addComponent(type)} className="rounded-lg border border-rule bg-paper-raised px-2 py-2 text-left text-[0.7rem] font-semibold disabled:opacity-40">+ {type}</button>)}</div></div>
      </aside>

      <main className="overflow-auto p-4 sm:p-8" style={{ backgroundImage: "radial-gradient(circle, rgba(12,51,39,.12) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="mx-auto w-full max-w-[360px] rounded-[2.4rem] border-[8px] border-[#18221e] bg-white shadow-2xl"><div className="mx-auto mt-2 h-5 w-28 rounded-full bg-[#18221e]" /><div className="border-b border-rule px-5 pb-3 pt-5"><p className="text-[0.65rem] font-semibold uppercase tracking-[.1em] text-[#1f8b61]">WhatsApp Flow preview</p><h2 className="mt-1 text-lg font-semibold">{currentScreen?.title || "Untitled screen"}</h2></div><div className="min-h-[520px] space-y-3 px-5 py-5">{currentScreen?.components.map((component) => <PreviewComponent key={component.id} component={component} selected={component.id === componentId} onClick={() => setComponentId(component.id)} />)}<button type="button" className="mt-5 w-full rounded-xl bg-[#1f8b61] px-4 py-3 text-sm font-semibold text-white">{screenIndex === draft.builder.screens.length - 1 ? draft.builder.completionButtonLabel || "Submit" : "Continue"}</button></div></div>
        <div className="mx-auto mt-5 max-w-[700px] rounded-xl border border-rule bg-paper/90 p-3 text-xs text-ink-faint"><div className="flex items-center justify-between gap-3"><span>Generated Meta Flow JSON · {generated ? "valid locally" : "invalid"}</span><span>{draft.builder.screens.length} screen{draft.builder.screens.length === 1 ? "" : "s"}</span></div></div>
      </main>

      <aside className="border-l border-rule bg-paper p-4">
        <h2 className="text-xs font-bold uppercase tracking-[.12em] text-ink-faint">Properties</h2>
        <label className="mt-3 block text-xs font-semibold text-ink-soft">Meta category<select disabled={locked} value={draft.categories[0] || "OTHER"} onChange={(e) => setDraft({ ...draft, categories: [e.target.value as WhatsAppFlowCategory] })} className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm">{WHATSAPP_FLOW_CATEGORIES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <label className="mt-3 flex items-start gap-2 rounded-xl border border-rule p-3 text-xs"><input type="checkbox" disabled={locked} checked={draft.builder.dynamic} onChange={(e) => setDraft({ ...draft, builder: { ...draft.builder, dynamic: e.target.checked } })} /><span><strong>Dynamic data exchange</strong><span className="mt-1 block text-ink-faint">Use the encrypted Web Growth endpoint between screens for live business logic.</span></span></label>
        <label className="mt-3 block text-xs font-semibold text-ink-soft">Completion button<input disabled={locked} value={draft.builder.completionButtonLabel} onChange={(e) => setDraft({ ...draft, builder: { ...draft.builder, completionButtonLabel: e.target.value } })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label>
        {currentScreen ? <div className="mt-5 border-t border-rule pt-4"><h3 className="text-sm font-semibold">Screen</h3><label className="mt-2 block text-xs font-semibold">ID<input disabled={locked} value={currentScreen.id} onChange={(e) => updateScreen({ id: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label><label className="mt-2 block text-xs font-semibold">Title<input disabled={locked} value={currentScreen.title} onChange={(e) => updateScreen({ title: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label></div> : null}
        {currentComponent ? <ComponentEditor component={currentComponent} locked={locked} onChange={updateComponent} onRemove={removeComponent} /> : <p className="mt-5 rounded-xl bg-paper-sunk p-3 text-xs leading-5 text-ink-faint">Tap a component in the phone preview to edit it here.</p>}
        <div className="mt-5 border-t border-rule pt-4"><h3 className="text-sm font-semibold">CRM mapping</h3><p className="mt-1 text-xs leading-5 text-ink-faint">Map Flow answers into built-in fields or <code>custom.&lt;field&gt;</code>.</p>{inputComponents(draft.builder).map((field) => <label key={field} className="mt-2 block text-[0.68rem] font-semibold text-ink-soft">{field}<input disabled={locked} value={draft.crmMapping[field] || ""} onChange={(e) => setDraft({ ...draft, crmMapping: { ...draft.crmMapping, [field]: e.target.value } })} placeholder="custom.field or email" className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-xs" /></label>)}</div>
        {validation ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{validation}</div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">Flow definition is valid locally.</div>}
      </aside>
    </div>
  </div>;

  const published = flows.filter((flow) => flow.status === "PUBLISHED").length;
  const completed = submissions.filter((item) => item.status === "COMPLETED").length;
  return <div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ledger">WhatsApp Flows</p><h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Interactive experiences</h1><p className="mt-1 max-w-3xl text-sm text-ink-faint">Build lead forms, bookings, support flows and surveys that open inside WhatsApp, then map responses into CRM and Stage 6 automations.</p></div><div className="flex gap-2"><select onChange={(e) => { if (e.target.value) beginStarter(e.target.value); e.currentTarget.value = ""; }} defaultValue="" disabled={!storageReady} className="rounded-xl border border-rule bg-paper px-3 py-2.5 text-sm"><option value="">Start from template…</option>{WHATSAPP_FLOW_STARTERS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><button onClick={() => begin()} disabled={!storageReady} className="rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">+ New Flow</button></div></div>
    {!storageReady ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Stage 8 storage is not ready on this environment.</div> : null}
    {notice ? <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : notice.tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}>{notice.text}</div> : null}

    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Flows" value={flows.length} /><Metric label="Published" value={published} /><Metric label="Tracked launches" value={submissions.length} /><Metric label="Completions" value={completed} /></div>
    <div className={`mt-4 rounded-2xl border p-4 ${encryptionConfigured ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${encryptionConfigured ? "text-emerald-800" : "text-amber-900"}`}>Dynamic Flow encryption · {encryptionConfigured ? "private key configured" : "private key not configured"}</p><p className={`mt-1 text-xs ${encryptionConfigured ? "text-emerald-700" : "text-amber-800"}`}>Static Flows work without the data channel. Dynamic Flows require the environment private key and Meta public-key registration.</p></div>{role === "owner" ? <button disabled={!encryptionConfigured || pending} onClick={registerEncryptionKey} className="rounded-lg border border-current px-3 py-2 text-xs font-semibold disabled:opacity-40">Register public key with Meta</button> : null}</div></div>

    <div className="mt-5 flex flex-wrap gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Flows" className="min-w-[220px] flex-1 rounded-xl border border-rule bg-paper px-3 py-2 text-sm" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-rule bg-paper px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="DEPRECATED">Deprecated</option><option value="BLOCKED">Blocked</option><option value="THROTTLED">Throttled</option></select></div>
    <div className="mt-4 grid gap-3 lg:grid-cols-2">{visible.map((flow) => { const stats = analytics.get(flow.id) || { started: 0, completed: 0, failed: 0 }; const rate = stats.started ? Math.round(stats.completed / stats.started * 100) : 0; return <article key={flow.id} className="rounded-2xl border border-rule bg-paper p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">{flow.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${statusClass(flow.status)}`}>{flow.status}</span>{flow.builder.dynamic ? <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[0.65rem] text-violet-700">Dynamic</span> : null}</div><p className="mt-1 text-xs text-ink-faint">{flow.categories.join(" · ")} · {flow.builder.screens.length} screen{flow.builder.screens.length === 1 ? "" : "s"}</p><p className="mt-1 text-[0.68rem] text-ink-faint">Meta ID: {flow.metaFlowId || "Not linked"} · Updated {when(flow.updatedAt)}</p></div><span className="text-xs text-ink-faint">v{flow.version}</span></div><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-paper-sunk p-3 text-center"><Mini label="Launches" value={stats.started} /><Mini label="Completed" value={stats.completed} /><Mini label="Rate" value={`${rate}%`} /></div>{flow.validationErrors.length ? <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{flow.validationErrors.length} Meta validation error{flow.validationErrors.length === 1 ? "" : "s"}</div> : null}<div className="mt-4 flex flex-wrap gap-2"><button onClick={() => begin(flow)} className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold">{flow.status === "DRAFT" ? "Edit" : "View"}</button><button disabled={pending} onClick={() => action("SYNC", flow)} className="rounded-lg border border-rule px-3 py-2 text-xs">Sync</button><button disabled={pending} onClick={() => duplicate(flow)} className="rounded-lg border border-rule px-3 py-2 text-xs">Duplicate</button>{flow.status === "DRAFT" ? <><button disabled={pending || flow.validationErrors.length > 0} onClick={() => action("PUBLISH", flow)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Publish</button><button disabled={pending} onClick={() => remove(flow)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs text-rose-700">Delete</button></> : null}{flow.status === "PUBLISHED" ? <button disabled={pending} onClick={() => action("DEPRECATE", flow)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Deprecate</button> : null}</div>{flow.status === "PUBLISHED" ? <div className="mt-3 flex gap-2"><input value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="Test WhatsApp number" className="min-w-0 flex-1 rounded-lg border border-rule px-3 py-2 text-xs" /><button disabled={pending} onClick={() => testSend(flow)} className="rounded-lg bg-ledger px-3 py-2 text-xs font-semibold text-white">Test send</button></div> : null}</article>; })}</div>
    {!visible.length ? <div className="mt-6 rounded-2xl border border-dashed border-rule bg-paper p-10 text-center text-sm text-ink-faint">No Flows match this view.</div> : null}

    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ledger">Submission history</p><h2 className="mt-1 text-xl font-semibold">Recent customer Flow activity</h2></div><span className="text-xs text-ink-faint">Latest {Math.min(100, submissions.length)}</span></div><div className="mt-3 overflow-x-auto rounded-2xl border border-rule bg-paper"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-paper-sunk text-ink-faint"><tr><th className="px-4 py-3">Flow</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Mapped fields</th><th className="px-4 py-3">When</th></tr></thead><tbody>{submissions.slice(0,100).map((item) => <tr key={item.id} className="border-t border-rule"><td className="px-4 py-3 font-medium">{flows.find((flow) => flow.id === item.flowId)?.name || item.metaFlowId || "Flow"}</td><td className="px-4 py-3"><span className={`rounded-full border px-2 py-0.5 ${statusClass(item.status)}`}>{item.status}</span></td><td className="px-4 py-3 text-ink-faint">{item.contactId || "—"}</td><td className="px-4 py-3 text-ink-faint">{Object.keys(item.mappedFields).join(", ") || "—"}</td><td className="px-4 py-3 text-ink-faint">{when(item.completedAt || item.startedAt || item.createdAt)}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl border border-rule bg-paper p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.1em] text-ink-faint">{label}</p><p className="mt-1 text-2xl font-semibold text-ink">{value}</p></div>; }
function Mini({ label, value }: { label: string; value: number | string }) { return <div><p className="text-sm font-semibold">{value}</p><p className="text-[0.62rem] text-ink-faint">{label}</p></div>; }
function PreviewComponent({ component, selected, onClick }: { component: WhatsAppFlowComponent; selected: boolean; onClick(): void }) {
  const ring = selected ? "ring-2 ring-[#1f8b61] ring-offset-2" : "";
  if (component.type === "TextHeading") return <button onClick={onClick} className={`block w-full rounded-lg text-left text-lg font-semibold ${ring}`}>{component.text || "Heading"}</button>;
  if (component.type === "TextBody") return <button onClick={onClick} className={`block w-full rounded-lg text-left text-sm leading-6 text-ink-soft ${ring}`}>{component.text || "Body text"}</button>;
  if (component.type === "TextCaption") return <button onClick={onClick} className={`block w-full rounded-lg text-left text-xs text-ink-faint ${ring}`}>{component.text || "Caption"}</button>;
  if (component.type === "Image") return <button onClick={onClick} className={`block h-36 w-full overflow-hidden rounded-xl border border-rule bg-paper-sunk ${ring}`}>{component.src ? <img src={component.src} alt="Flow preview" className="h-full w-full object-contain" /> : <span className="grid h-full place-items-center text-xs text-ink-faint">Image URL</span>}</button>;
  if (component.type === "OptIn") return <button onClick={onClick} className={`flex w-full items-start gap-2 rounded-lg border border-rule p-3 text-left text-xs ${ring}`}><span className="mt-0.5 h-4 w-4 rounded border border-rule-strong" /><span>{component.label || "Consent"}</span></button>;
  if (component.type === "RadioButtonsGroup" || component.type === "CheckboxGroup") return <button onClick={onClick} className={`block w-full rounded-xl border border-rule p-3 text-left ${ring}`}><span className="text-xs font-semibold">{component.label || "Choose"}</span><span className="mt-2 block space-y-1">{(component.options || []).slice(0,4).map((option) => <span key={option.id} className="block rounded-lg bg-paper-sunk px-2 py-2 text-xs">○ {option.title}</span>)}</span></button>;
  if (component.type === "Dropdown") return <button onClick={onClick} className={`block w-full rounded-xl text-left ${ring}`}><span className="mb-1 block text-xs font-semibold">{component.label || "Choose"}</span><span className="block rounded-lg border border-rule px-3 py-2 text-sm text-ink-faint">Select… ▾</span></button>;
  if (component.type === "DatePicker") return <button onClick={onClick} className={`block w-full rounded-xl text-left ${ring}`}><span className="mb-1 block text-xs font-semibold">{component.label || "Date"}</span><span className="block rounded-lg border border-rule px-3 py-2 text-sm text-ink-faint">YYYY-MM-DD</span></button>;
  return <button onClick={onClick} className={`block w-full rounded-xl text-left ${ring}`}><span className="mb-1 block text-xs font-semibold">{component.label || "Field"}</span><span className="block min-h-10 rounded-lg border border-rule px-3 py-2 text-sm text-ink-faint">{component.type === "TextArea" ? "Long answer…" : "Answer…"}</span></button>;
}
function ComponentEditor({ component, locked, onChange, onRemove }: { component: WhatsAppFlowComponent; locked: boolean; onChange(patch: Partial<WhatsAppFlowComponent>): void; onRemove(): void }) {
  const optionText = (component.options || []).map((item) => `${item.id}|${item.title}${item.description ? `|${item.description}` : ""}`).join("\n");
  const choices = ["Dropdown", "RadioButtonsGroup", "CheckboxGroup"].includes(component.type);
  const textual = ["TextHeading", "TextBody", "TextCaption"].includes(component.type);
  return <div className="mt-5 border-t border-rule pt-4"><div className="flex items-center justify-between"><div><p className="text-[0.62rem] uppercase text-ink-faint">Component</p><h3 className="text-sm font-semibold">{component.type}</h3></div>{!locked ? <button onClick={onRemove} className="text-xs text-rose-700">Remove</button> : null}</div>
    {textual ? <label className="mt-3 block text-xs font-semibold">Text<textarea disabled={locked} rows={5} value={component.text || ""} onChange={(e) => onChange({ text: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label> : null}
    {!textual && component.type !== "Image" ? <><label className="mt-3 block text-xs font-semibold">Field name<input disabled={locked} value={component.name || ""} onChange={(e) => onChange({ name: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label><label className="mt-2 block text-xs font-semibold">Label<input disabled={locked} value={component.label || ""} onChange={(e) => onChange({ label: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm" /></label><label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" disabled={locked} checked={component.required !== false} onChange={(e) => onChange({ required: e.target.checked })} /> Required</label></> : null}
    {component.type === "TextInput" ? <label className="mt-2 block text-xs font-semibold">Input type<select disabled={locked} value={component.inputType || "text"} onChange={(e) => onChange({ inputType: e.target.value as NonNullable<WhatsAppFlowComponent["inputType"]> })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-sm"><option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="number">Number</option><option value="password">Password</option></select></label> : null}
    {choices ? <label className="mt-3 block text-xs font-semibold">Options <span className="font-normal text-ink-faint">(id|title|description)</span><textarea disabled={locked} rows={6} value={optionText} onChange={(e) => onChange({ options: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => { const [id, title, description] = line.split("|"); return { id: (id || `option_${index + 1}`).trim(), title: (title || id || `Option ${index + 1}`).trim(), ...(description?.trim() ? { description: description.trim() } : {}) }; }) })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 font-mono text-xs" /></label> : null}
    {component.type === "Image" ? <label className="mt-3 block text-xs font-semibold">HTTPS image URL<input disabled={locked} value={component.src || ""} onChange={(e) => onChange({ src: e.target.value })} className="mt-1 w-full rounded-lg border border-rule px-3 py-2 text-xs" /></label> : null}
  </div>;
}
