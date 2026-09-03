"use client";

import type { WhatsAppAISettings } from "@/lib/whatsapp/aiModel";

export type WhatsAppAIProviderView = {
  ready: boolean;
  paidUsageLocked: boolean;
  billingMode: WhatsAppAISettings["billingMode"];
  selectedModel: string | null;
  modelCount: number;
  error?: string;
  credits: null | { ok: true; balanceUsd: number; totalUsedUsd: number } | { ok: false; error: string };
};

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>{children}{note ? <span className="mt-1 block text-[0.68rem] leading-5 text-ink-faint">{note}</span> : null}</label>;
}

function Badge({ children, good = false }: { children: React.ReactNode; good?: boolean }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rule bg-paper-sunk text-ink-soft"}`}>{children}</span>;
}

export default function AISettingsControls({ settings, provider, busy, onChange, onSave }: {
  settings: WhatsAppAISettings;
  provider: WhatsAppAIProviderView | null;
  busy?: boolean;
  onChange(settings: WhatsAppAISettings): void;
  onSave(): void;
}) {
  const credits = provider?.credits?.ok ? provider.credits : null;
  return <div className="space-y-5">
    <div className="rounded-2xl border border-rule bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">AI runtime</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-ink-faint">Web Growth chooses the underlying model automatically. Business controls stay focused on safety, instructions and usage instead of provider plumbing.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Badge good={provider?.ready === true}>{provider?.ready ? "AI routing ready" : "AI routing unavailable"}</Badge><Badge good={provider?.paidUsageLocked !== false}>{provider?.paidUsageLocked !== false ? "Paid usage locked" : "Budget capped"}</Badge></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-paper-sunk p-3"><p className="text-[0.65rem] uppercase tracking-wide text-ink-faint">Routing</p><p className="mt-1 text-sm font-semibold text-ink">Automatic</p></div>
        <div className="rounded-xl bg-paper-sunk p-3"><p className="text-[0.65rem] uppercase tracking-wide text-ink-faint">Available routes</p><p className="mt-1 text-sm font-semibold text-ink">{provider?.modelCount ?? "—"}</p></div>
        <div className="rounded-xl bg-paper-sunk p-3"><p className="text-[0.65rem] uppercase tracking-wide text-ink-faint">Gateway credits</p><p className="mt-1 text-sm font-semibold text-ink">{credits ? `$${credits.balanceUsd.toFixed(2)}` : provider?.credits && !provider.credits.ok ? "Unavailable" : "—"}</p></div>
      </div>
      {provider?.error ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{provider.error}</p> : null}
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Usage mode" note="Free Only fails closed when remaining verified credits are too low. Budget Capped is for paid client plans later.">
        <select value={settings.billingMode} onChange={(event) => onChange({ ...settings, billingMode: event.target.value as WhatsAppAISettings["billingMode"] })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm">
          <option value="DISABLED">Disabled</option>
          <option value="FREE_ONLY">Free credits only</option>
          <option value="BUDGET_CAPPED">Budget capped</option>
        </select>
      </Field>
      {settings.billingMode === "BUDGET_CAPPED" ? <Field label="Monthly AI budget (USD)"><input type="number" min="0" step="0.01" value={settings.monthlyBudgetUsd} onChange={(event) => onChange({ ...settings, monthlyBudgetUsd: Number(event.target.value) })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></Field> : <Field label="Free-credit safety reserve" note="AI stops before the verified balance falls below this reserve."><input type="number" min="0" step="0.01" value={settings.freeCreditFloorUsd} onChange={(event) => onChange({ ...settings, freeCreditFloorUsd: Number(event.target.value) })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></Field>}
      <Field label="Daily request limit"><input type="number" min="1" max="10000" value={settings.dailyRequestLimit} onChange={(event) => onChange({ ...settings, dailyRequestLimit: Number(event.target.value) })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></Field>
      <Field label="Max output tokens"><input type="number" min="50" max="4000" value={settings.maxOutputTokens} onChange={(event) => onChange({ ...settings, maxOutputTokens: Number(event.target.value) })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></Field>
      <Field label="Max autonomous turns"><input type="number" min="1" max="50" value={settings.maxAgentTurns} onChange={(event) => onChange({ ...settings, maxAgentTurns: Number(event.target.value) })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm" /></Field>
      <Field label="Default knowledge behaviour"><select value={settings.defaultKnowledgeMode} onChange={(event) => onChange({ ...settings, defaultKnowledgeMode: event.target.value as WhatsAppAISettings["defaultKnowledgeMode"] })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm"><option value="KNOWLEDGE_ONLY">Approved knowledge only</option><option value="KNOWLEDGE_PLUS_GENERAL">Knowledge + safe general knowledge</option></select></Field>
    </div>

    <Field label="Business AI instructions" note="These workspace-wide rules apply before each individual Agent's instructions.">
      <textarea rows={7} value={settings.businessInstructions} onChange={(event) => onChange({ ...settings, businessInstructions: event.target.value })} className="w-full rounded-xl border border-rule bg-paper-raised px-3 py-2.5 text-sm leading-6" placeholder="Example: Never invent prices. Keep replies concise. Escalate payment disputes to a human." />
    </Field>

    <div className="grid gap-2 sm:grid-cols-3">
      {([[
        "enabled", "Enable AI"
      ], ["assistEnabled", "AI Assist"], ["agentsEnabled", "Autonomous Agents"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-rule bg-paper px-3 py-2.5 text-xs font-semibold text-ink"><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => onChange({ ...settings, [key]: event.target.checked })} />{label}</label>)}
    </div>

    <button type="button" disabled={busy} onClick={onSave} className="rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save AI settings"}</button>
  </div>;
}
