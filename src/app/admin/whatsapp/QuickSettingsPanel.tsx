"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WhatsAppSettings } from "@/lib/whatsapp/settings";
import type { WhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="relative inline-flex flex-none cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="h-6 w-11 rounded-full bg-paper-sunk ring-1 ring-rule transition peer-checked:bg-ledger-bright peer-focus-visible:ring-2 peer-focus-visible:ring-ledger-bright/30 peer-disabled:opacity-50" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
    </label>
  );
}

export default function QuickSettingsPanel({ settings, quickSettings }: { settings: WhatsAppSettings; quickSettings: WhatsAppQuickSettings }) {
  const router = useRouter();
  const [businessHours, setBusinessHours] = useState(settings.businessHours.enabled);
  const [typingIndicator, setTypingIndicator] = useState(quickSettings.typingIndicatorEnabled);
  const [newMessageAlerts, setNewMessageAlerts] = useState(quickSettings.newMessageAlertsEnabled);
  const [serviceWindowWarning, setServiceWindowWarning] = useState(quickSettings.serviceWindowWarningEnabled);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveQuick(update: Partial<WhatsAppQuickSettings>, rollback?: () => void) {
    startTransition(async () => {
      setFeedback(null);
      const response = await fetch("/api/admin/whatsapp/quick-settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        rollback?.();
        setFeedback(payload.error || "Could not save quick setting.");
      } else {
        setFeedback("Saved");
        router.refresh();
      }
    });
  }

  function toggleBusinessHours(enabled: boolean) {
    setBusinessHours(enabled);
    startTransition(async () => {
      setFeedback(null);
      const response = await fetch("/api/admin/whatsapp/settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          businessHours: { ...settings.businessHours, enabled },
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        setBusinessHours(!enabled);
        setFeedback(payload.error || "Could not change business hours tracking.");
      } else {
        setFeedback("Saved");
        router.refresh();
      }
    });
  }

  const rows = [
    {
      key: "typing",
      title: "Customer typing indicator",
      description: "Show a typing indicator to the customer while an agent writes a reply.",
      checked: typingIndicator,
      onChange: (checked: boolean) => {
        const previous = typingIndicator;
        setTypingIndicator(checked);
        saveQuick({ typingIndicatorEnabled: checked }, () => setTypingIndicator(previous));
      },
    },
    {
      key: "alerts",
      title: "New message notifications",
      description: "Show browser and in-page alerts when a new WhatsApp message arrives.",
      checked: newMessageAlerts,
      onChange: (checked: boolean) => {
        const previous = newMessageAlerts;
        setNewMessageAlerts(checked);
        saveQuick({ newMessageAlertsEnabled: checked }, () => setNewMessageAlerts(previous));
      },
    },
    {
      key: "hours",
      title: "Business hours",
      description: "Track whether the team is currently inside the configured working hours.",
      checked: businessHours,
      onChange: toggleBusinessHours,
    },
    {
      key: "service-window",
      title: "24-hour messaging warning",
      description: "Warn agents when a conversation is close to, or outside, Meta's 24-hour reply window.",
      checked: serviceWindowWarning,
      onChange: (checked: boolean) => {
        const previous = serviceWindowWarning;
        setServiceWindowWarning(checked);
        saveQuick({ serviceWindowWarningEnabled: checked }, () => setServiceWindowWarning(previous));
      },
    },
  ];

  return (
    <section className="relative z-10 mx-4 mt-5 rounded-xl border border-rule bg-paper-raised p-5 shadow-sm sm:mx-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Quick settings</h2>
          <p className="mt-0.5 text-xs text-ink-faint">Everyday WhatsApp controls. Changes save immediately.</p>
        </div>
        <Link href="/admin/whatsapp/settings/" className="text-xs font-semibold text-ledger hover:underline">Manage all settings →</Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{row.title}</p>
              <p className="mt-0.5 text-xs leading-4 text-ink-faint">{row.description}</p>
            </div>
            <Switch checked={row.checked} disabled={pending} onChange={row.onChange} />
          </div>
        ))}
      </div>
      {feedback ? <p className="mt-3 text-xs text-ink-faint" aria-live="polite">{feedback}</p> : null}
    </section>
  );
}
