"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WhatsAppAISettings } from "@/lib/whatsapp/aiModel";
import AISettingsControls, { type WhatsAppAIProviderView } from "./AISettingsControls";

type Payload = { settings: WhatsAppAISettings; provider: WhatsAppAIProviderView };

export default function AISettingsPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/whatsapp/ai/?view=status", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json() as Payload;
    setPayload(body);
  }

  useEffect(() => { void refresh(); }, []);

  async function save() {
    if (!payload || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/whatsapp/ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SAVE_SETTINGS", ...payload.settings }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; settings?: WhatsAppAISettings; provider?: WhatsAppAIProviderView };
      if (!response.ok) throw new Error(body.error || "AI settings could not be saved.");
      if (body.settings && body.provider) setPayload({ settings: body.settings, provider: body.provider });
      setMessage("AI settings saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "AI settings could not be saved."); }
    finally { setBusy(false); }
  }

  if (!payload) return <div className="rounded-2xl border border-rule bg-paper-raised p-5 text-sm text-ink-faint">Loading AI settings…</div>;

  return <section className="rounded-2xl border border-rule bg-paper-raised p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold text-ink">AI & automation</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-faint">Workspace-wide AI safety, usage and instructions. Agent design, knowledge and approvals live under Automations.</p></div>
      <Link href="/admin/whatsapp/automations/?section=ai" className="rounded-xl border border-rule px-3 py-2 text-xs font-semibold text-ledger hover:bg-paper-sunk">Manage AI Agents →</Link>
    </div>
    <AISettingsControls settings={payload.settings} provider={payload.provider} busy={busy} onChange={(settings) => setPayload({ ...payload, settings })} onSave={() => void save()} />
    {message ? <p className="mt-4 rounded-lg bg-paper-sunk px-3 py-2 text-xs text-ink-soft">{message}</p> : null}
  </section>;
}
