"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_TEMPLATE_LANGUAGES,
  WHATSAPP_TEMPLATE_LIMITS,
  listWhatsAppTemplateDraftVariableFields,
  normalizeWhatsAppTemplateName,
  validateWhatsAppTemplateDraftInput,
  type WhatsAppTemplateDraft,
  type WhatsAppTemplateDraftButton,
  type WhatsAppTemplateDraftInput,
} from "@/lib/whatsapp/templateModel";
import {
  getWhatsAppTemplateComponent,
  listWhatsAppTemplateVariables,
  type WhatsAppTemplate,
  type WhatsAppTemplateStatus,
} from "@/lib/whatsapp/templates";

type Notice = { tone: "ok" | "error"; text: string } | null;
type Tab = "META" | "DRAFTS";

const EMPTY: WhatsAppTemplateDraftInput = { name: "", language: "en_US", category: "UTILITY", headerText: "", bodyText: "", footerText: "", buttons: [], variableExamples: {} };

function statusClass(status: WhatsAppTemplateStatus) {
  if (status === "APPROVED") return "bg-ledger-tint text-ledger";
  if (status === "PENDING") return "bg-brass-tint text-[#6f4f16]";
  if (status === "REJECTED" || status === "DISABLED") return "bg-rose-50 text-rose-700";
  return "bg-paper-sunk text-ink-faint";
}

function normalizeStatusValue(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function canDuplicateLiveTemplate(template: WhatsAppTemplate) {
  const header = getWhatsAppTemplateComponent(template, "HEADER");
  return (template.category === "UTILITY" || template.category === "MARKETING") && (!header?.format || header.format === "TEXT");
}

function liveToDraft(template: WhatsAppTemplate): WhatsAppTemplateDraftInput {
  const header = getWhatsAppTemplateComponent(template, "HEADER");
  const body = getWhatsAppTemplateComponent(template, "BODY");
  const footer = getWhatsAppTemplateComponent(template, "FOOTER");
  const buttons = getWhatsAppTemplateComponent(template, "BUTTONS")?.buttons || [];
  const headerText = header?.format === "TEXT" ? header.text || "" : "";
  const bodyText = body?.text || "";
  const fields = listWhatsAppTemplateDraftVariableFields({ headerText, bodyText });
  return {
    name: `${normalizeWhatsAppTemplateName(template.name)}_copy`,
    language: template.language || "en_US",
    category: template.category === "MARKETING" ? "MARKETING" : "UTILITY",
    headerText,
    bodyText,
    footerText: footer?.text || "",
    buttons: buttons.flatMap((button): WhatsAppTemplateDraftButton[] => {
      if (button.type === "QUICK_REPLY" && button.text) return [{ type: "QUICK_REPLY", text: button.text }];
      if (button.type === "URL" && button.text && button.url) return [{ type: "URL", text: button.text, value: button.url }];
      if (button.type === "PHONE_NUMBER" && button.text && button.phone_number) return [{ type: "PHONE_NUMBER", text: button.text, value: button.phone_number }];
      return [];
    }).slice(0, WHATSAPP_TEMPLATE_LIMITS.buttons),
    variableExamples: Object.fromEntries(fields.map((field) => [field.key, ""])),
  };
}

function draftCopy(draft: WhatsAppTemplateDraft): WhatsAppTemplateDraftInput {
  return { name: `${normalizeWhatsAppTemplateName(draft.name)}_copy`, language: draft.language, category: draft.category, headerText: draft.headerText, bodyText: draft.bodyText, footerText: draft.footerText, buttons: draft.buttons.map((button) => ({ ...button })), variableExamples: { ...draft.variableExamples } };
}

function editableDraft(draft: WhatsAppTemplateDraft): WhatsAppTemplateDraftInput {
  return { name: draft.name, language: draft.language, category: draft.category, headerText: draft.headerText, bodyText: draft.bodyText, footerText: draft.footerText, buttons: draft.buttons.map((button) => ({ ...button })), variableExamples: { ...draft.variableExamples } };
}

function Preview({ value }: { value: Pick<WhatsAppTemplateDraftInput, "headerText" | "bodyText" | "footerText" | "buttons" | "variableExamples"> }) {
  const resolve = (text: string, scope: "header" | "body") => text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match, token: string) => value.variableExamples[`${scope}:${token}`] || `{{${token}}}`);
  return <div className="rounded-2xl border border-rule bg-paper p-4"><p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Preview</p><div className="rounded-xl border border-rule bg-paper-raised p-3 shadow-sm">{value.headerText ? <p className="text-sm font-semibold leading-6 text-ink">{resolve(value.headerText, "header")}</p> : null}<p className={`whitespace-pre-wrap text-sm leading-6 text-ink-soft ${value.headerText ? "mt-1.5" : ""}`}>{resolve(value.bodyText, "body") || "Template body preview"}</p>{value.footerText ? <p className="mt-2 text-[0.7rem] text-ink-faint">{value.footerText}</p> : null}{value.buttons.length ? <div className="mt-3 space-y-1.5 border-t border-rule pt-2.5">{value.buttons.map((button, index) => <div key={`${button.type}-${index}`} className="rounded-lg border border-rule bg-paper px-2.5 py-1.5 text-center text-xs font-medium text-ledger">{button.text || button.type}</div>)}</div> : null}</div></div>;
}

function Editor({ value, onChange, disabled }: { value: WhatsAppTemplateDraftInput; onChange(value: WhatsAppTemplateDraftInput): void; disabled: boolean }) {
  const variables = listWhatsAppTemplateDraftVariableFields(value);
  function updateButton(index: number, patch: Partial<WhatsAppTemplateDraftButton>) { onChange({ ...value, buttons: value.buttons.map((button, at) => at === index ? { ...button, ...patch } : button) }); }
  function addButton() { if (value.buttons.length < WHATSAPP_TEMPLATE_LIMITS.buttons) onChange({ ...value, buttons: [...value.buttons, { type: "QUICK_REPLY", text: "" }] }); }
  return <div className="grid gap-4">
    <div className="grid gap-3 sm:grid-cols-3"><label className="sm:col-span-2"><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Template name</span><input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} disabled={disabled} placeholder="order_update" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-ledger-bright" /><span className="mt-1 block text-[0.65rem] text-ink-faint">Meta name: {normalizeWhatsAppTemplateName(value.name) || "template_name"}</span></label><label><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Category</span><select value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value as WhatsAppTemplateDraftInput["category"] })} disabled={disabled} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"><option value="UTILITY">Utility</option><option value="MARKETING">Marketing</option></select></label></div>
    <label><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Language</span><select value={value.language} onChange={(e) => onChange({ ...value, language: e.target.value })} disabled={disabled} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm sm:w-64">{WHATSAPP_TEMPLATE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label} · {item.code}</option>)}</select></label>
    <label><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Text header <span className="normal-case font-normal">optional</span></span><input value={value.headerText} onChange={(e) => onChange({ ...value, headerText: e.target.value })} disabled={disabled} maxLength={WHATSAPP_TEMPLATE_LIMITS.header} placeholder="Hello {{1}}" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ledger-bright" /></label>
    <label><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Body</span><textarea value={value.bodyText} onChange={(e) => onChange({ ...value, bodyText: e.target.value })} disabled={disabled} maxLength={WHATSAPP_TEMPLATE_LIMITS.body} rows={6} placeholder="Your order {{1}} is ready for collection." className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-6 outline-none focus:border-ledger-bright" /><span className="mt-1 block text-right text-[0.65rem] text-ink-faint">{value.bodyText.length}/{WHATSAPP_TEMPLATE_LIMITS.body}</span></label>
    <label><span className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Footer <span className="normal-case font-normal">optional</span></span><input value={value.footerText} onChange={(e) => onChange({ ...value, footerText: e.target.value })} disabled={disabled} maxLength={WHATSAPP_TEMPLATE_LIMITS.footer} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ledger-bright" /></label>
    {variables.length ? <div className="rounded-xl border border-rule bg-paper p-3"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Sample variable values</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{variables.map((field) => <label key={field.key} className="flex items-center gap-2"><span className="w-24 flex-none text-[0.68rem] text-ink-faint"><span className="font-semibold">{field.component}</span> <span className="font-mono text-ledger">{`{{${field.token}}}`}</span></span><input value={value.variableExamples[field.key] || ""} onChange={(e) => onChange({ ...value, variableExamples: { ...value.variableExamples, [field.key]: e.target.value } })} disabled={disabled} placeholder="Sample value required by Meta" maxLength={WHATSAPP_TEMPLATE_LIMITS.example} className="min-w-0 flex-1 rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ledger-bright" /></label>)}</div></div> : null}
    <div className="rounded-xl border border-rule bg-paper p-3"><div className="flex items-center justify-between"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">Buttons</p><button type="button" onClick={addButton} disabled={disabled || value.buttons.length >= WHATSAPP_TEMPLATE_LIMITS.buttons} className="rounded-full border border-rule px-3 py-1 text-xs font-semibold text-ledger disabled:opacity-40">+ Add button</button></div>{value.buttons.length ? <div className="mt-3 grid gap-2">{value.buttons.map((button, index) => <div key={index} className="grid gap-2 rounded-lg border border-rule bg-paper-raised p-2 sm:grid-cols-[9rem_1fr_1fr_auto]"><select value={button.type} onChange={(e) => updateButton(index, { type: e.target.value as WhatsAppTemplateDraftButton["type"], value: undefined })} disabled={disabled} className="rounded-lg border border-rule bg-paper px-2 py-2 text-xs"><option value="QUICK_REPLY">Quick reply</option><option value="URL">Website</option><option value="PHONE_NUMBER">Phone</option></select><input value={button.text} onChange={(e) => updateButton(index, { text: e.target.value })} disabled={disabled} placeholder="Button label" maxLength={WHATSAPP_TEMPLATE_LIMITS.buttonText} className="rounded-lg border border-rule bg-paper px-2 py-2 text-sm outline-none" />{button.type === "QUICK_REPLY" ? <div className="rounded-lg bg-paper-sunk px-2 py-2 text-xs text-ink-faint">No destination needed</div> : <input value={button.value || ""} onChange={(e) => updateButton(index, { value: e.target.value })} disabled={disabled} placeholder={button.type === "URL" ? "https://..." : "+234..."} className="rounded-lg border border-rule bg-paper px-2 py-2 text-sm outline-none" />}<button type="button" onClick={() => onChange({ ...value, buttons: value.buttons.filter((_, at) => at !== index) })} disabled={disabled} className="rounded-lg border border-rule px-2 text-xs text-rose-700">Remove</button></div>)}</div> : <p className="mt-2 text-xs text-ink-faint">No buttons. You can add Quick Reply buttons or Website/Phone calls to action.</p>}</div>
  </div>;
}

export default function TemplateManager({ liveTemplates, drafts, draftsReady, canManage, role, liveError }: { liveTemplates: WhatsAppTemplate[]; drafts: WhatsAppTemplateDraft[]; draftsReady: boolean; canManage: boolean; role: "owner" | "manager" | "agent"; liveError?: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("META");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editor, setEditor] = useState<WhatsAppTemplateDraftInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [testTemplate, setTestTemplate] = useState<WhatsAppTemplate | null>(null);
  const [recipient, setRecipient] = useState("");
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const visibleLive = useMemo(() => {
    const wantedStatus = normalizeStatusValue(status) || "ALL";
    const q = query.trim().toLowerCase();
    return liveTemplates.filter((template) => {
      if (wantedStatus !== "ALL" && normalizeStatusValue(template.status) !== wantedStatus) return false;
      return !q || [template.name, template.status, template.category, template.language, template.rejectedReason].some((v) => v?.toLowerCase().includes(q));
    });
  }, [liveTemplates, query, status]);
  const visibleDrafts = useMemo(() => drafts.filter((draft) => { const q = query.trim().toLowerCase(); return !q || [draft.name, draft.category, draft.language, draft.bodyText].some((v) => v.toLowerCase().includes(q)); }), [drafts, query]);

  async function jsonMutation(url: string, payload: Record<string, unknown>, method = "POST") { const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; warning?: string }; if (!response.ok || !body.ok) throw new Error(body.error || "The template action failed."); return body; }
  function resetEditor() { setEditor(EMPTY); setEditingId(null); }
  function saveDraft(event: FormEvent) { event.preventDefault(); const checked = validateWhatsAppTemplateDraftInput(editor as unknown as Record<string, unknown>); if (!checked.ok) return setNotice({ tone: "error", text: checked.error }); startTransition(async () => { try { await jsonMutation("/api/admin/whatsapp/templates/drafts/", editingId ? { id: editingId, ...checked.value } : checked.value, editingId ? "PATCH" : "POST"); setNotice({ tone: "ok", text: editingId ? "Draft updated." : "Draft saved." }); resetEditor(); setTab("DRAFTS"); router.refresh(); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not save draft." }); } }); }
  function submitDraft(id: string) { if (!window.confirm("Submit this template to Meta for review? The submitted draft will be locked.")) return; startTransition(async () => { try { const result = await jsonMutation("/api/admin/whatsapp/templates/submit/", { id }); setNotice({ tone: "ok", text: result.warning || "Template submitted to Meta for review." }); router.refresh(); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not submit template." }); } }); }
  function deleteDraft(id: string) { if (!window.confirm("Delete this unsent draft?")) return; startTransition(async () => { try { await jsonMutation("/api/admin/whatsapp/templates/drafts/", { id }, "DELETE"); setNotice({ tone: "ok", text: "Draft deleted." }); router.refresh(); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not delete draft." }); } }); }
  function openTest(template: WhatsAppTemplate) { setTestTemplate(template); setRecipient(""); setTestValues({}); setNotice(null); }
  function sendTest(event: FormEvent) {
    event.preventDefault(); if (!testTemplate) return;
    const headerVars = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(testTemplate, "HEADER")?.text);
    const bodyVars = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(testTemplate, "BODY")?.text);
    const fields = [...headerVars.map((token) => ({ key: `header:${token}`, token, component: "header" })), ...bodyVars.map((token) => ({ key: `body:${token}`, token, component: "body" }))];
    const missing = fields.find((field) => !testValues[field.key]?.trim());
    if (missing) return setNotice({ tone: "error", text: `Enter a test value for ${missing.component} {{${missing.token}}}.` });
    startTransition(async () => { try { await jsonMutation("/api/admin/whatsapp/templates/test-send/", { templateId: testTemplate.id, recipient, headerParameters: headerVars.map((token) => testValues[`header:${token}`].trim()), bodyParameters: bodyVars.map((token) => testValues[`body:${token}`].trim()) }); setNotice({ tone: "ok", text: "Approved template test sent through WhatsApp." }); setTestTemplate(null); } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not send test." }); } });
  }

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-lg font-semibold text-ink">WhatsApp Template Manager</h1><p className="mt-1 text-sm text-ink-faint">Live status comes from Meta. Local drafts stay in Web Growth until you submit them.</p><p className="mt-1 text-xs text-ink-faint">Signed in as {role}. {canManage ? "You can manage and submit templates." : "Agents have read-only access to template status."}</p></div><button type="button" onClick={() => router.refresh()} disabled={pending} className="rounded-full border border-rule bg-paper-raised px-4 py-2 text-xs font-semibold text-ledger">Refresh Meta</button></div>
    {liveError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{liveError}</p> : null}
    {!draftsReady && canManage ? <p className="mt-4 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2 text-xs text-[#6f4f16]">Persistent drafts are waiting for the Stage 5 Supabase migration. Live Meta templates remain readable.</p> : null}
    {notice ? <p className={`mt-4 rounded-xl px-3 py-2 text-xs ${notice.tone === "ok" ? "bg-ledger-tint text-ledger" : "bg-rose-50 text-rose-700"}`}>{notice.text}</p> : null}
    <div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setTab("META")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === "META" ? "bg-ledger-bright text-white" : "border border-rule bg-paper-raised text-ink-soft"}`}>Meta Templates · {liveTemplates.length}</button>{canManage ? <button type="button" onClick={() => setTab("DRAFTS")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === "DRAFTS" ? "bg-ledger-bright text-white" : "border border-rule bg-paper-raised text-ink-soft"}`}>Drafts · {drafts.length}</button> : null}</div>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_13rem]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ledger-bright" />{tab === "META" ? <select value={status} onChange={(e) => { setStatus(e.target.value); setQuery(""); }} className="rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="APPROVED">Approved</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option><option value="PAUSED">Paused</option><option value="DISABLED">Disabled</option></select> : <div />}</div>

    {tab === "META" ? <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{visibleLive.map((template) => { const header = getWhatsAppTemplateComponent(template, "HEADER"); const body = getWhatsAppTemplateComponent(template, "BODY"); const footer = getWhatsAppTemplateComponent(template, "FOOTER"); const buttons = getWhatsAppTemplateComponent(template, "BUTTONS")?.buttons || []; const duplicable = canDuplicateLiveTemplate(template); return <article key={template.id || `${template.name}-${template.language}`} className="rounded-xl border border-rule bg-paper-raised p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-semibold text-ink">{template.name}</p><p className="mt-1 text-[0.68rem] text-ink-faint">{template.category || "—"} · {template.language || "—"}{template.qualityScore ? ` · quality ${template.qualityScore}` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass(template.status)}`}>{template.status}</span></div><div className="mt-3 rounded-xl border border-rule bg-paper p-3">{header?.text ? <p className="text-sm font-semibold text-ink">{header.text}</p> : header?.format && header.format !== "TEXT" ? <p className="text-xs uppercase text-ink-faint">{header.format} header</p> : null}<p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{body?.text || "No body text returned."}</p>{footer?.text ? <p className="mt-2 text-[0.7rem] text-ink-faint">{footer.text}</p> : null}{buttons.length ? <div className="mt-3 border-t border-rule pt-2">{buttons.map((button, index) => <p key={index} className="mt-1 rounded-lg border border-rule bg-paper-raised px-2 py-1.5 text-center text-xs text-ledger">{button.text || button.type}</p>)}</div> : null}</div>{template.status === "REJECTED" && template.rejectedReason ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700"><strong>Rejection reason:</strong> {template.rejectedReason}</p> : null}{canManage ? <div className="mt-3 flex flex-wrap gap-2">{duplicable ? <button type="button" onClick={() => { setEditor(liveToDraft(template)); setEditingId(null); setTab("DRAFTS"); }} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft">Duplicate</button> : <span className="text-[0.65rem] text-ink-faint">Specialized Auth/media-header templates are view-only here.</span>}{template.status === "APPROVED" ? <button type="button" onClick={() => openTest(template)} className="rounded-full bg-ledger-bright px-3 py-1.5 text-xs font-semibold text-white">Send test</button> : null}</div> : null}</article>; })}{visibleLive.length === 0 ? <p className="col-span-full rounded-xl border border-dashed border-rule-strong px-4 py-12 text-center text-sm text-ink-faint">No Meta templates match this view.</p> : null}</div> : null}

    {tab === "DRAFTS" && canManage ? <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_30rem]"><section className="rounded-xl border border-rule bg-paper-raised"><div className="border-b border-rule px-4 py-3"><h2 className="text-sm font-semibold text-ink">Saved drafts</h2></div>{visibleDrafts.length ? <ul className="divide-y divide-rule">{visibleDrafts.map((draft) => <li key={draft.id} className="p-4"><div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><p className="font-mono text-sm font-semibold text-ink">{draft.name}</p><p className="mt-1 text-xs text-ink-faint">{draft.category} · {draft.language} · {draft.metaTemplateId ? "Submitted to Meta" : "Draft"}</p><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{draft.bodyText}</p></div>{draft.metaTemplateId ? <span className="rounded-full bg-brass-tint px-2 py-1 text-[0.65rem] font-semibold text-[#6f4f16]">SUBMITTED</span> : null}</div><div className="mt-3 flex flex-wrap gap-2">{!draft.metaTemplateId ? <><button type="button" onClick={() => { setEditingId(draft.id); setEditor(editableDraft(draft)); }} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft">Edit</button><button type="button" onClick={() => submitDraft(draft.id)} disabled={pending || !draftsReady} className="rounded-full bg-ledger-bright px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Submit to Meta</button><button type="button" onClick={() => deleteDraft(draft.id)} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button></> : null}<button type="button" onClick={() => { setEditor(draftCopy(draft)); setEditingId(null); }} className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft">Duplicate</button></div></li>)}</ul> : <p className="px-4 py-12 text-center text-sm text-ink-faint">No saved drafts yet.</p>}</section><aside className="xl:sticky xl:top-5 xl:self-start"><form onSubmit={saveDraft} className="rounded-xl border border-rule bg-paper-raised p-4"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-ink">{editingId ? "Edit draft" : "New template draft"}</h2>{(editingId || editor.name || editor.bodyText) ? <button type="button" onClick={resetEditor} className="text-xs text-ink-faint underline">Clear</button> : null}</div><div className="mt-4"><Editor value={editor} onChange={setEditor} disabled={pending || !draftsReady} /></div><div className="mt-4"><Preview value={editor} /></div><button disabled={pending || !draftsReady} className="mt-4 w-full rounded-full bg-ledger-bright px-4 py-2 text-sm font-semibold text-white disabled:bg-paper-sunk disabled:text-ink-faint">{pending ? "Saving…" : editingId ? "Update draft" : "Save draft"}</button></form></aside></div> : null}

    {testTemplate ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setTestTemplate(null); }}><form onSubmit={sendTest} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-rule bg-paper-raised p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-ink">Send approved template test</h2><p className="mt-1 font-mono text-xs text-ink-faint">{testTemplate.name} · {testTemplate.language}</p></div><button type="button" onClick={() => setTestTemplate(null)} className="rounded-full border border-rule px-3 py-1 text-xs text-ink-soft">Close</button></div><label className="mt-4 block"><span className="text-xs font-semibold text-ink-soft">Recipient</span><input value={recipient} onChange={(e) => setRecipient(e.target.value)} required placeholder="08066706336 or international format" className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ledger-bright" /></label>{(() => { const headerVars = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(testTemplate, "HEADER")?.text); const bodyVars = listWhatsAppTemplateVariables(getWhatsAppTemplateComponent(testTemplate, "BODY")?.text); const fields = [...headerVars.map((token) => ({ key: `header:${token}`, label: `HEADER {{${token}}}` })), ...bodyVars.map((token) => ({ key: `body:${token}`, label: `BODY {{${token}}}` }))]; return fields.length ? <div className="mt-4 grid gap-2"><p className="text-xs font-semibold text-ink-soft">Test variable values</p>{fields.map((field) => <label key={field.key} className="flex items-center gap-2"><span className="w-28 flex-none font-mono text-xs text-ledger">{field.label}</span><input value={testValues[field.key] || ""} onChange={(e) => setTestValues({ ...testValues, [field.key]: e.target.value })} required className="min-w-0 flex-1 rounded-lg border border-rule bg-paper px-3 py-2 text-sm outline-none" /></label>)}</div> : null; })()}<button disabled={pending} className="mt-5 w-full rounded-full bg-ledger-bright px-4 py-2 text-sm font-semibold text-white">{pending ? "Sending…" : "Send test through WhatsApp"}</button></form></div> : null}
  </div>;
}
