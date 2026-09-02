"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type WhatsAppCampaign,
  type WhatsAppSegment,
  type WhatsAppSegmentCondition,
  type WhatsAppSegmentJoin,
  type WhatsAppSegmentOperator,
} from "@/lib/whatsapp/campaignModel";
import { listWhatsAppTemplateVariables } from "@/lib/whatsapp/templateModel";
import type { WhatsAppTemplate } from "@/lib/whatsapp/templates";

const fieldOptions = [
  ["tags", "Tags"],
  ["lead_stage", "CRM stage"],
  ["lead_temperature", "Lead temperature"],
  ["source", "Source"],
  ["opt_in_status", "Opt-in status"],
  ["lifecycle", "Chat lifecycle"],
  ["assigned_member_id", "Assigned member ID"],
  ["last_message_at", "Last interaction"],
  ["email", "Email"],
  ["company", "Company"],
  ["name", "Name"],
] as const;

const operators: Array<{ value: WhatsAppSegmentOperator; label: string }> = [
  { value: "EQUALS", label: "equals" },
  { value: "NOT_EQUALS", label: "does not equal" },
  { value: "CONTAINS", label: "contains" },
  { value: "NOT_CONTAINS", label: "does not contain" },
  { value: "EXISTS", label: "exists" },
  { value: "NOT_EXISTS", label: "does not exist" },
  { value: "BEFORE", label: "before" },
  { value: "AFTER", label: "after" },
];

const statusClass: Record<string, string> = {
  DRAFT: "bg-paper-sunk text-ink-soft",
  SCHEDULED: "bg-brass-tint text-[#6f4f16]",
  RUNNING: "bg-sky-50 text-sky-700",
  PAUSED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  FAILED: "bg-rose-50 text-rose-700",
};

type AudiencePreview = {
  matched: number;
  eligible: number;
  optedOut: number;
  consentUnknown: number;
  invalid: number;
  recipients: Array<{ id: string; waId: string; displayName: string }>;
};

type RecipientRow = {
  id: string;
  display_name?: string;
  wa_id?: string;
  status?: string;
  skip_reason?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
  error_message?: string;
};

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function templateVariableFields(template: WhatsAppTemplate | undefined) {
  if (!template) return [] as Array<{ key: string; label: string }>;
  const header = template.components.find((component) => component.type === "HEADER")?.text || "";
  const body = template.components.find((component) => component.type === "BODY")?.text || "";
  return [
    ...listWhatsAppTemplateVariables(header).map((token) => ({ key: `header:${token}`, label: `Header {{${token}}}` })),
    ...listWhatsAppTemplateVariables(body).map((token) => ({ key: `body:${token}`, label: `Body {{${token}}}` })),
  ];
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function rate(part: number, whole: number) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

function ConditionRows({
  conditions,
  setConditions,
}: {
  conditions: WhatsAppSegmentCondition[];
  setConditions: (value: WhatsAppSegmentCondition[]) => void;
}) {
  const update = (index: number, patch: Partial<WhatsAppSegmentCondition>) => {
    setConditions(conditions.map((condition, itemIndex) => itemIndex === index ? { ...condition, ...patch } : condition));
  };
  return (
    <div className="space-y-2">
      <datalist id="campaign-audience-fields">
        {fieldOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        <option value="custom.service_interest">Custom: service interest</option>
        <option value="custom.website_budget">Custom: website budget</option>
      </datalist>
      {conditions.map((condition, index) => {
        const noValue = condition.operator === "EXISTS" || condition.operator === "NOT_EXISTS";
        return (
          <div key={`${condition.field}-${index}`} className="grid gap-2 rounded-lg border border-rule bg-paper p-2 sm:grid-cols-[1.2fr_1fr_1.2fr_auto]">
            <input list="campaign-audience-fields" value={condition.field} onChange={(event) => update(index, { field: event.target.value })} className="rounded-md border border-rule bg-paper-raised px-2.5 py-2 text-xs text-ink" placeholder="tags or custom.field" />
            <select value={condition.operator} onChange={(event) => update(index, { operator: event.target.value as WhatsAppSegmentOperator })} className="rounded-md border border-rule bg-paper-raised px-2.5 py-2 text-xs text-ink">
              {operators.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input disabled={noValue} value={condition.value || ""} onChange={(event) => update(index, { value: event.target.value })} className="rounded-md border border-rule bg-paper-raised px-2.5 py-2 text-xs text-ink disabled:opacity-50" placeholder={condition.field === "opt_in_status" ? "OPTED_IN" : "Value"} />
            <button type="button" onClick={() => setConditions(conditions.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md border border-rule px-2 py-2 text-xs text-rose-700">Remove</button>
          </div>
        );
      })}
      <button type="button" onClick={() => setConditions([...conditions, { field: "tags", operator: "CONTAINS", value: "" }])} className="rounded-lg border border-rule bg-paper px-3 py-2 text-xs font-semibold text-ink-soft">+ Add condition</button>
    </div>
  );
}

export default function CampaignManager({
  initialCampaigns,
  initialSegments,
  approvedTemplates,
  storageReady,
  templateError,
}: {
  initialCampaigns: WhatsAppCampaign[];
  initialSegments: WhatsAppSegment[];
  approvedTemplates: WhatsAppTemplate[];
  storageReady: boolean;
  templateError?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"campaigns" | "audiences" | "performance">("campaigns");
  const [showComposer, setShowComposer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<{ campaign: WhatsAppCampaign; rows: RecipientRow[] } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentId, setSegmentId] = useState("ALL");
  const [templateId, setTemplateId] = useState(approvedTemplates[0]?.id || "");
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [testRecipient, setTestRecipient] = useState("08066706336");

  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [segmentJoin, setSegmentJoin] = useState<WhatsAppSegmentJoin>("AND");
  const [segmentConditions, setSegmentConditions] = useState<WhatsAppSegmentCondition[]>([
    { field: "opt_in_status", operator: "EQUALS", value: "OPTED_IN" },
  ]);

  const selectedTemplate = approvedTemplates.find((template) => template.id === templateId);
  const variableFields = useMemo(() => templateVariableFields(selectedTemplate), [selectedTemplate]);
  const totals = useMemo(() => initialCampaigns.reduce((acc, campaign) => ({
    sent: acc.sent + campaign.sentCount,
    delivered: acc.delivered + campaign.deliveredCount,
    read: acc.read + campaign.readCount,
    replied: acc.replied + campaign.repliedCount,
    failed: acc.failed + campaign.failedCount,
  }), { sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }), [initialCampaigns]);

  const audiencePayload = segmentId === "ALL"
    ? { conditionJoin: "AND", conditions: [] }
    : { segmentId };

  const clearMessages = () => { setNotice(null); setError(null); };

  const previewAudience = async () => {
    clearMessages(); setBusy(true);
    try {
      const result = await jsonRequest<AudiencePreview>("/api/admin/whatsapp/campaigns/", {
        method: "POST",
        body: JSON.stringify({ action: "PREVIEW", ...audiencePayload }),
      });
      setPreview(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Audience preview failed."); }
    finally { setBusy(false); }
  };

  const createCampaign = async (mode: "DRAFT" | "SEND_NOW" | "SCHEDULE") => {
    clearMessages(); setBusy(true);
    try {
      const result = await jsonRequest<{ ok: true }>("/api/admin/whatsapp/campaigns/", {
        method: "POST",
        body: JSON.stringify({
          action: "CREATE",
          name,
          description,
          ...audiencePayload,
          templateId,
          variableMappings,
          mode,
          ...(mode === "SCHEDULE" ? { scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : "" } : {}),
        }),
      });
      if (result.ok) {
        setNotice(mode === "DRAFT" ? "Campaign saved as Draft." : mode === "SCHEDULE" ? "Campaign scheduled." : "Campaign queued for sending.");
        setShowComposer(false);
        setName(""); setDescription(""); setPreview(null); setVariableMappings({}); setScheduledAt("");
        router.refresh();
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Campaign could not be saved."); }
    finally { setBusy(false); }
  };

  const testSend = async () => {
    clearMessages(); setBusy(true);
    try {
      const result = await jsonRequest<{ ok: true; messageId: string }>("/api/admin/whatsapp/campaigns/test-send/", {
        method: "POST",
        body: JSON.stringify({
          recipient: testRecipient,
          templateId,
          variableMappings,
          sampleContactId: preview?.recipients[0]?.id,
        }),
      });
      setNotice(`Test template accepted by Meta (${result.messageId}).`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Test send failed."); }
    finally { setBusy(false); }
  };

  const campaignAction = async (campaign: WhatsAppCampaign, action: "PAUSE" | "RESUME" | "CANCEL" | "LAUNCH") => {
    clearMessages(); setBusy(true);
    try {
      await jsonRequest<{ ok: true }>("/api/admin/whatsapp/campaigns/", {
        method: "PATCH",
        body: JSON.stringify({ id: campaign.id, action }),
      });
      setNotice(`${campaign.name}: ${action.toLowerCase()} applied.`);
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Campaign action failed."); }
    finally { setBusy(false); }
  };

  const loadRecipients = async (campaign: WhatsAppCampaign) => {
    clearMessages(); setBusy(true);
    try {
      const result = await jsonRequest<{ recipients: RecipientRow[] }>(`/api/admin/whatsapp/campaigns/?campaignId=${encodeURIComponent(campaign.id)}`);
      setRecipients({ campaign, rows: result.recipients });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Recipients could not be loaded."); }
    finally { setBusy(false); }
  };

  const saveSegment = async () => {
    clearMessages(); setBusy(true);
    try {
      await jsonRequest<{ ok: true }>("/api/admin/whatsapp/campaigns/segments/", {
        method: "POST",
        body: JSON.stringify({ name: segmentName, description: segmentDescription, conditionJoin: segmentJoin, conditions: segmentConditions }),
      });
      setSegmentName(""); setSegmentDescription("");
      setSegmentConditions([{ field: "opt_in_status", operator: "EQUALS", value: "OPTED_IN" }]);
      setNotice("Reusable audience saved.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Audience could not be saved."); }
    finally { setBusy(false); }
  };

  const deleteSegment = async (id: string) => {
    clearMessages(); setBusy(true);
    try {
      await jsonRequest<{ ok: true }>("/api/admin/whatsapp/campaigns/segments/", { method: "DELETE", body: JSON.stringify({ id }) });
      setNotice("Audience deleted."); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Audience could not be deleted."); }
    finally { setBusy(false); }
  };

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Stage 7 · Campaigns</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">Campaigns</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-faint">Send approved Meta templates to consented CRM audiences, with scheduling, durable delivery tracking and campaign-level performance.</p>
        </div>
        <button type="button" disabled={!storageReady || !approvedTemplates.length} onClick={() => { setShowComposer(true); setTab("campaigns"); clearMessages(); }} className="rounded-lg bg-ledger-bright px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">+ Create campaign</button>
      </div>

      {!storageReady ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Stage 7 campaign storage is not ready in Supabase.</div> : null}
      {templateError ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{templateError}</div> : null}
      {notice ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-5 flex gap-1 rounded-xl border border-rule bg-paper-sunk p-1">
        {(["campaigns", "audiences", "performance"] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize ${tab === item ? "bg-paper-raised text-ink shadow-sm" : "text-ink-faint"}`}>{item}</button>)}
      </div>

      {tab === "campaigns" ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Campaigns", initialCampaigns.length], ["Sent", totals.sent], ["Delivered", totals.delivered], ["Read", totals.read], ["Replies", totals.replied],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p></div>)}
          </div>

          {showComposer ? (
            <section className="mt-5 rounded-2xl border border-rule bg-paper-raised p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">Create campaign</h2><p className="mt-1 text-xs text-ink-faint">Audience → approved template → personalisation → test → schedule or launch.</p></div><button type="button" onClick={() => setShowComposer(false)} className="rounded-lg border border-rule px-3 py-2 text-xs text-ink-soft">Close</button></div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="text-xs font-semibold text-ink">Campaign name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm font-normal" placeholder="September Website Offer" /></label>
                <label className="text-xs font-semibold text-ink">Audience<select value={segmentId} onChange={(event) => { setSegmentId(event.target.value); setPreview(null); }} className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm font-normal"><option value="ALL">All eligible contacts</option>{initialSegments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}</select></label>
                <label className="text-xs font-semibold text-ink lg:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 min-h-20 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm font-normal" placeholder="Internal campaign notes" /></label>
              </div>

              <div className="mt-4 rounded-xl border border-rule bg-paper p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-ink">Audience preview</p><p className="mt-0.5 text-[0.7rem] text-ink-faint">Only OPTED_IN contacts with valid WhatsApp numbers can be sent.</p></div><button type="button" disabled={busy} onClick={previewAudience} className="rounded-lg border border-ledger px-3 py-2 text-xs font-semibold text-ledger">Preview audience</button></div>
                {preview ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{[["Matched", preview.matched], ["Eligible", preview.eligible], ["Opted out", preview.optedOut], ["Consent unknown", preview.consentUnknown], ["Invalid", preview.invalid]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-paper-sunk px-3 py-2"><p className="text-[0.62rem] uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-semibold tabular-nums text-ink">{value}</p></div>)}</div> : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="text-xs font-semibold text-ink">Approved Meta template<select value={templateId} onChange={(event) => { setTemplateId(event.target.value); setVariableMappings({}); }} className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm font-normal"><option value="">Choose template</option>{approvedTemplates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.language || "en_US"} · {template.category || "Template"}</option>)}</select></label>
                <div className="rounded-lg border border-rule bg-paper px-3 py-2.5"><p className="text-xs font-semibold text-ink">Template safety</p><p className="mt-1 text-[0.7rem] leading-5 text-ink-faint">Only templates currently reported APPROVED by Meta are selectable. Status is rechecked again before every campaign send.</p></div>
              </div>

              {selectedTemplate ? <div className="mt-4 rounded-xl border border-rule bg-paper p-3"><p className="text-xs font-semibold text-ink">Message preview</p><div className="mt-2 rounded-xl bg-[#e8f5ef] p-3 text-sm leading-6 text-ink">{selectedTemplate.components.find((component) => component.type === "HEADER")?.text ? <p className="font-semibold">{selectedTemplate.components.find((component) => component.type === "HEADER")?.text}</p> : null}<p className="whitespace-pre-wrap">{selectedTemplate.components.find((component) => component.type === "BODY")?.text || selectedTemplate.name}</p>{selectedTemplate.components.find((component) => component.type === "FOOTER")?.text ? <p className="mt-1 text-xs text-ink-faint">{selectedTemplate.components.find((component) => component.type === "FOOTER")?.text}</p> : null}</div></div> : null}

              {variableFields.length ? <div className="mt-4 rounded-xl border border-rule bg-paper p-3"><p className="text-xs font-semibold text-ink">Personalisation mapping</p><p className="mt-1 text-[0.7rem] text-ink-faint">Sources: contact.first_name, contact.name, contact.company, contact.email, contact.phone, contact.stage, contact.temperature, custom.field, or static:Your text.</p><div className="mt-3 grid gap-2 lg:grid-cols-2">{variableFields.map((field) => <label key={field.key} className="text-[0.7rem] font-semibold text-ink-soft">{field.label}<input value={variableMappings[field.key] || ""} onChange={(event) => setVariableMappings({ ...variableMappings, [field.key]: event.target.value })} className="mt-1 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-xs font-normal text-ink" placeholder="contact.first_name" /></label>)}</div></div> : null}

              <div className="mt-4 grid gap-3 rounded-xl border border-rule bg-paper p-3 sm:grid-cols-[1fr_auto]"><label className="text-xs font-semibold text-ink">Test recipient<input value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} className="mt-1.5 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm font-normal" /></label><button type="button" disabled={busy || !templateId} onClick={testSend} className="self-end rounded-lg border border-ledger px-4 py-2.5 text-xs font-semibold text-ledger disabled:opacity-50">Send test</button></div>

              <div className="mt-4 grid gap-3 rounded-xl border border-rule bg-paper p-3 sm:grid-cols-[1fr_auto_auto_auto]"><label className="text-xs font-semibold text-ink">Schedule date/time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm font-normal" /></label><button type="button" disabled={busy} onClick={() => createCampaign("DRAFT")} className="self-end rounded-lg border border-rule px-4 py-2.5 text-xs font-semibold text-ink-soft">Save draft</button><button type="button" disabled={busy || !scheduledAt} onClick={() => createCampaign("SCHEDULE")} className="self-end rounded-lg border border-brass px-4 py-2.5 text-xs font-semibold text-[#6f4f16] disabled:opacity-50">Schedule</button><button type="button" disabled={busy || !preview?.eligible} onClick={() => createCampaign("SEND_NOW")} className="self-end rounded-lg bg-ledger-bright px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Send now</button></div>
            </section>
          ) : null}

          <section className="mt-5 overflow-hidden rounded-xl border border-rule bg-paper-raised">
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-paper-sunk text-[0.65rem] uppercase tracking-[.1em] text-ink-faint"><tr><th className="px-4 py-3">Campaign</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Audience</th><th className="px-3 py-3">Template</th><th className="px-3 py-3">Sent</th><th className="px-3 py-3">Delivered</th><th className="px-3 py-3">Read</th><th className="px-3 py-3">Replies</th><th className="px-3 py-3">Actions</th></tr></thead><tbody className="divide-y divide-rule">{initialCampaigns.map((campaign) => <tr key={campaign.id}><td className="px-4 py-3"><p className="font-semibold text-ink">{campaign.name}</p><p className="mt-0.5 text-[0.68rem] text-ink-faint">{campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "Not scheduled"}</p></td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass[campaign.status] || "bg-paper-sunk"}`}>{campaign.status}</span></td><td className="px-3 py-3 tabular-nums text-ink">{campaign.eligibleCount}/{campaign.audienceCount}</td><td className="px-3 py-3 font-mono text-[0.68rem] text-ink-soft">{campaign.templateName}</td><td className="px-3 py-3 tabular-nums">{campaign.sentCount}</td><td className="px-3 py-3 tabular-nums">{campaign.deliveredCount}</td><td className="px-3 py-3 tabular-nums">{campaign.readCount}</td><td className="px-3 py-3 tabular-nums">{campaign.repliedCount}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><button type="button" onClick={() => loadRecipients(campaign)} className="rounded-md border border-rule px-2 py-1 text-[0.65rem] font-semibold">Recipients</button>{campaign.status === "DRAFT" ? <button type="button" disabled={busy} onClick={() => campaignAction(campaign, "LAUNCH")} className="rounded-md border border-ledger px-2 py-1 text-[0.65rem] font-semibold text-ledger">Launch</button> : null}{new Set(["SCHEDULED", "RUNNING"]).has(campaign.status) ? <button type="button" disabled={busy} onClick={() => campaignAction(campaign, "PAUSE")} className="rounded-md border border-amber-300 px-2 py-1 text-[0.65rem] font-semibold text-amber-700">Pause</button> : null}{campaign.status === "PAUSED" ? <button type="button" disabled={busy} onClick={() => campaignAction(campaign, "RESUME")} className="rounded-md border border-ledger px-2 py-1 text-[0.65rem] font-semibold text-ledger">Resume</button> : null}{!new Set(["COMPLETED", "CANCELLED"]).has(campaign.status) ? <button type="button" disabled={busy} onClick={() => campaignAction(campaign, "CANCEL")} className="rounded-md border border-rose-200 px-2 py-1 text-[0.65rem] font-semibold text-rose-700">Cancel</button> : null}</div></td></tr>)}{!initialCampaigns.length ? <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-ink-faint">No campaigns yet. Create the first opted-in template campaign.</td></tr> : null}</tbody></table></div>
          </section>
        </>
      ) : null}

      {tab === "audiences" ? <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-xl border border-rule bg-paper-raised p-4"><h2 className="text-sm font-semibold text-ink">Reusable audiences</h2><p className="mt-1 text-xs text-ink-faint">Build CRM segments with AND/OR logic. Consent is still enforced again at send time.</p><div className="mt-4 space-y-3">{initialSegments.map((segment) => <article key={segment.id} className="rounded-lg border border-rule bg-paper p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-ink">{segment.name}</p><p className="mt-1 text-xs text-ink-faint">{segment.description || `${segment.conditionJoin} · ${segment.conditions.length} condition${segment.conditions.length === 1 ? "" : "s"}`}</p></div><button type="button" onClick={() => deleteSegment(segment.id)} className="rounded-md border border-rule px-2 py-1 text-[0.65rem] text-rose-700">Delete</button></div><div className="mt-2 flex flex-wrap gap-1">{segment.conditions.map((condition, index) => <span key={index} className="rounded-full bg-paper-sunk px-2 py-1 text-[0.62rem] text-ink-soft">{condition.field} {condition.operator.toLowerCase().replaceAll("_", " ")} {condition.value || ""}</span>)}</div></article>)}{!initialSegments.length ? <p className="rounded-lg border border-dashed border-rule px-4 py-8 text-center text-xs text-ink-faint">No saved audiences yet.</p> : null}</div></section><section className="rounded-xl border border-rule bg-paper-raised p-4"><h2 className="text-sm font-semibold text-ink">Create audience</h2><div className="mt-3 grid gap-3"><label className="text-xs font-semibold text-ink">Name<input value={segmentName} onChange={(event) => setSegmentName(event.target.value)} className="mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-semibold text-ink">Description<textarea value={segmentDescription} onChange={(event) => setSegmentDescription(event.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm font-normal" /></label><label className="text-xs font-semibold text-ink">Match<select value={segmentJoin} onChange={(event) => setSegmentJoin(event.target.value as WhatsAppSegmentJoin)} className="ml-2 rounded-md border border-rule bg-paper px-2 py-1 text-xs font-normal"><option value="AND">ALL conditions (AND)</option><option value="OR">ANY condition (OR)</option></select></label><ConditionRows conditions={segmentConditions} setConditions={setSegmentConditions} /><button type="button" disabled={busy} onClick={saveSegment} className="rounded-lg bg-ledger-bright px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save audience</button></div></section></div> : null}

      {tab === "performance" ? <div className="mt-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Delivery rate", rate(totals.delivered, totals.sent)], ["Read rate", rate(totals.read, totals.sent)], ["Reply rate", rate(totals.replied, totals.sent)], ["Failures", totals.failed]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-rule bg-paper-raised p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p></div>)}</div><section className="mt-5 rounded-xl border border-rule bg-paper-raised p-4"><h2 className="text-sm font-semibold text-ink">Campaign performance</h2><div className="mt-3 space-y-2">{initialCampaigns.filter((campaign) => campaign.sentCount > 0).map((campaign) => <div key={campaign.id} className="grid gap-2 rounded-lg border border-rule bg-paper px-3 py-3 sm:grid-cols-[1fr_repeat(3,auto)] sm:items-center"><div><p className="text-xs font-semibold text-ink">{campaign.name}</p><p className="mt-0.5 text-[0.66rem] text-ink-faint">{campaign.sentCount} sent · {campaign.failedCount} failed</p></div><span className="text-xs text-ink-soft">Delivered <strong>{rate(campaign.deliveredCount, campaign.sentCount)}</strong></span><span className="text-xs text-ink-soft">Read <strong>{rate(campaign.readCount, campaign.sentCount)}</strong></span><span className="text-xs text-ink-soft">Replies <strong>{rate(campaign.repliedCount, campaign.sentCount)}</strong></span></div>)}</div></section></div> : null}

      {recipients ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"><section className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-t-2xl bg-paper-raised shadow-2xl sm:rounded-2xl"><div className="flex items-center justify-between border-b border-rule px-4 py-3"><div><h2 className="text-sm font-semibold text-ink">{recipients.campaign.name} · Recipients</h2><p className="mt-0.5 text-xs text-ink-faint">{recipients.rows.length} captured recipient rows</p></div><button type="button" onClick={() => setRecipients(null)} className="rounded-lg border border-rule px-3 py-2 text-xs">Close</button></div><div className="max-h-[75vh] overflow-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 bg-paper-sunk text-[0.64rem] uppercase tracking-wide text-ink-faint"><tr><th className="px-4 py-2.5">Contact</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Sent</th><th className="px-3 py-2.5">Delivered</th><th className="px-3 py-2.5">Read</th><th className="px-3 py-2.5">Replied</th><th className="px-3 py-2.5">Detail</th></tr></thead><tbody className="divide-y divide-rule">{recipients.rows.map((row) => <tr key={row.id}><td className="px-4 py-3"><p className="font-semibold text-ink">{row.display_name || row.wa_id || "Contact"}</p><p className="font-mono text-[0.65rem] text-ink-faint">{row.wa_id}</p></td><td className="px-3 py-3 font-semibold">{row.status || "—"}</td><td className="px-3 py-3">{formatDate(row.sent_at)}</td><td className="px-3 py-3">{formatDate(row.delivered_at)}</td><td className="px-3 py-3">{formatDate(row.read_at)}</td><td className="px-3 py-3">{formatDate(row.replied_at)}</td><td className="max-w-60 px-3 py-3 text-ink-faint">{row.skip_reason || row.error_message || "—"}</td></tr>)}</tbody></table></div></section></div> : null}
    </div>
  );
}
