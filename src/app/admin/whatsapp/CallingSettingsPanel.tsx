"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { WhatsAppCallingSettings } from "@/lib/whatsapp/callingSettings";
import type { WhatsAppBusinessHours } from "@/lib/whatsapp/settings";

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="relative inline-flex flex-none cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="h-6 w-11 rounded-full bg-paper-sunk ring-1 ring-rule transition peer-checked:bg-ledger-bright peer-disabled:opacity-50" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
    </label>
  );
}

function humanTime(value: string) {
  const compact = value.replace(":", "").padStart(4, "0");
  return `${compact.slice(0, 2)}:${compact.slice(2, 4)}`;
}

function toMetaHours(hours: WhatsAppBusinessHours) {
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return {
    status: "ENABLED",
    timezone_id: hours.timezone || "Africa/Lagos",
    weekly_operating_hours: hours.days.map((day) => ({
      day_of_week: dayNames[day] || "MONDAY",
      open_time: hours.start.replace(":", ""),
      close_time: hours.end.replace(":", ""),
    })),
  } as const;
}

export default function CallingSettingsPanel({ businessHours }: { businessHours: WhatsAppBusinessHours }) {
  const [calling, setCalling] = useState<WhatsAppCallingSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetch("/api/admin/whatsapp/calling-settings/", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; calling?: WhatsAppCallingSettings; error?: string };
        if (!active) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Could not load Calling settings.");
        setCalling(payload.calling || {});
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Could not load Calling settings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const hoursSummary = useMemo(() => {
    const rows = calling?.call_hours?.weekly_operating_hours || [];
    if (!rows.length) return "No calling schedule set at Meta";
    const first = rows[0];
    return `${rows.length} day${rows.length === 1 ? "" : "s"} · ${humanTime(first.open_time)}–${humanTime(first.close_time)} · ${calling?.call_hours?.timezone_id || "timezone not returned"}`;
  }, [calling]);

  function update(fields: Record<string, unknown>, successLabel: string, optimistic: (current: WhatsAppCallingSettings) => WhatsAppCallingSettings) {
    if (!calling) return;
    const previous = calling;
    setCalling(optimistic(calling));
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/whatsapp/calling-settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; calling?: WhatsAppCallingSettings; error?: string };
      if (!response.ok || !payload.ok) {
        setCalling(previous);
        setError(payload.error || "Meta rejected the Calling setting.");
        return;
      }
      setCalling(payload.calling || optimistic(previous));
      setSaved(successLabel);
    });
  }

  return (
    <section className="relative z-10 mx-4 mt-5 rounded-xl border border-rule bg-paper-raised p-5 shadow-sm sm:mx-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[.14em] text-ledger">Meta Calling API</p>
          <h2 className="mt-1 text-sm font-semibold text-ink">Voice call settings</h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-ink-faint">These controls read and write the Calls settings on your WhatsApp business phone number directly at Meta.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${calling?.status === "ENABLED" ? "bg-ledger-tint text-ledger" : "bg-paper-sunk text-ink-faint"}`}>
          {loading ? "Loading…" : calling?.status === "ENABLED" ? "Calling enabled" : "Calling disabled"}
        </span>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

      {calling ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
            <div><p className="text-sm font-medium text-ink">Allow voice calls</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Master switch for WhatsApp Calling on this number.</p></div>
            <Switch checked={calling.status === "ENABLED"} disabled={pending} onChange={(checked) => update({ status: checked ? "ENABLED" : "DISABLED" }, checked ? "Voice calls enabled" : "Voice calls disabled", (current) => ({ ...current, status: checked ? "ENABLED" : "DISABLED" }))} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
            <div><p className="text-sm font-medium text-ink">Display call buttons</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Show the call icon in customer chats and your business profile.</p></div>
            <Switch checked={calling.call_icon_visibility !== "DISABLE_ALL"} disabled={pending || calling.status !== "ENABLED"} onChange={(checked) => update({ call_icon_visibility: checked ? "DEFAULT" : "DISABLE_ALL" }, checked ? "Call buttons displayed" : "Call buttons hidden", (current) => ({ ...current, call_icon_visibility: checked ? "DEFAULT" : "DISABLE_ALL" }))} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
            <div><p className="text-sm font-medium text-ink">Callback permission prompt</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Let callers grant permission for your business to call them back where Meta permits it.</p></div>
            <Switch checked={calling.callback_permission_status === "ENABLED"} disabled={pending || calling.status !== "ENABLED"} onChange={(checked) => update({ callback_permission_status: checked ? "ENABLED" : "DISABLED" }, checked ? "Callback permissions enabled" : "Callback permissions disabled", (current) => ({ ...current, callback_permission_status: checked ? "ENABLED" : "DISABLED" }))} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
            <div className="min-w-0"><p className="text-sm font-medium text-ink">Call hours</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">{hoursSummary}</p><p className="mt-1 text-[0.68rem] leading-4 text-ink-faint">When enabled, this uses the working days and times configured in Messaging & response.</p></div>
            <Switch checked={calling.call_hours?.status === "ENABLED"} disabled={pending || calling.status !== "ENABLED"} onChange={(checked) => {
              const nextHours = checked ? toMetaHours(businessHours) : { status: "DISABLED", ...(calling.call_hours?.holiday_schedule ? { holiday_schedule: calling.call_hours.holiday_schedule } : {}) };
              update({ call_hours: nextHours }, checked ? "Call hours enabled" : "Call hours disabled", (current) => ({ ...current, call_hours: { ...current.call_hours, ...nextHours } }));
            }} />
          </div>
        </div>
      ) : loading ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-paper-sunk" /> : null}

      {saved ? <p className="mt-3 text-xs font-medium text-ledger" aria-live="polite">{saved}</p> : null}
      <p className="mt-3 text-[0.68rem] leading-4 text-ink-faint">Meta may take time to refresh call-button visibility on some customer devices. Server-side calling rules apply as soon as Meta accepts the update.</p>
    </section>
  );
}
