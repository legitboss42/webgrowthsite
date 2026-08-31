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

const DAYS = [
  { label: "Monday", meta: "MONDAY", number: 1 },
  { label: "Tuesday", meta: "TUESDAY", number: 2 },
  { label: "Wednesday", meta: "WEDNESDAY", number: 3 },
  { label: "Thursday", meta: "THURSDAY", number: 4 },
  { label: "Friday", meta: "FRIDAY", number: 5 },
  { label: "Saturday", meta: "SATURDAY", number: 6 },
  { label: "Sunday", meta: "SUNDAY", number: 0 },
] as const;

const FALLBACK_TIMEZONES = [
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Accra",
  "Africa/Nairobi",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

type ScheduleRow = {
  label: string;
  meta: string;
  enabled: boolean;
  start: string;
  end: string;
};

type ScheduleDraft = {
  timezone: string;
  rows: ScheduleRow[];
};

type CallingApiPayload = {
  ok?: boolean;
  calling?: WhatsAppCallingSettings;
  error?: string;
  detail?: string;
};

function humanTime(value: string) {
  const compact = value.replace(":", "").padStart(4, "0");
  return `${compact.slice(0, 2)}:${compact.slice(2, 4)}`;
}

function inputTime(value: string | undefined, fallback: string) {
  const raw = (value || "").trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) return `${raw.slice(0, 2)}:${raw.slice(2)}`;
  return fallback;
}

function metaTime(value: string) {
  return value.replace(":", "");
}

function timezoneLabel(timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset",
      hour: "2-digit",
    });
    const offset = formatter.formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value;
    return offset ? `(${offset}) ${timezone}` : timezone;
  } catch {
    return timezone;
  }
}

function getSupportedTimezones() {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try {
    const supported = intl.supportedValuesOf?.("timeZone") || [];
    return supported.length ? supported : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
}

function buildScheduleDraft(calling: WhatsAppCallingSettings | null, businessHours: WhatsAppBusinessHours): ScheduleDraft {
  const liveRows = calling?.call_hours?.weekly_operating_hours || [];
  const fallbackStart = inputTime(businessHours.start, "08:00");
  const fallbackEnd = inputTime(businessHours.end, "17:00");

  return {
    timezone: calling?.call_hours?.timezone_id || businessHours.timezone || "Africa/Lagos",
    rows: DAYS.map((day) => {
      const live = liveRows.find((row) => row.day_of_week === day.meta);
      return {
        label: day.label,
        meta: day.meta,
        enabled: live ? true : businessHours.days.includes(day.number),
        start: inputTime(live?.open_time, fallbackStart),
        end: inputTime(live?.close_time, fallbackEnd),
      };
    }),
  };
}

export default function CallingSettingsPanel({ businessHours }: { businessHours: WhatsAppBusinessHours }) {
  const [calling, setCalling] = useState<WhatsAppCallingSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(() => buildScheduleDraft(null, businessHours));
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const timezoneOptions = useMemo(() => {
    const current = scheduleDraft.timezone.trim();
    const business = businessHours.timezone?.trim();
    const all = [current, business, ...getSupportedTimezones(), ...FALLBACK_TIMEZONES].filter((value): value is string => Boolean(value));
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, [businessHours.timezone, scheduleDraft.timezone]);

  async function loadCallingSettings() {
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const response = await fetch("/api/admin/whatsapp/calling-settings/", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as CallingApiPayload;
      if (!response.ok || !payload.ok || !payload.calling) {
        setCalling(null);
        setError(payload.error || "Could not load Calling settings.");
        setDetail(payload.detail || null);
        return;
      }
      setCalling(payload.calling);
      setScheduleDraft(buildScheduleDraft(payload.calling, businessHours));
    } catch (reason) {
      setCalling(null);
      setError(reason instanceof Error ? reason.message : "Could not load Calling settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCallingSettings();
    // This panel owns the live Meta read. Retry handles transient provider failures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoursSummary = useMemo(() => {
    const rows = calling?.call_hours?.weekly_operating_hours || [];
    if (!rows.length) return "No regular calling schedule confirmed at Meta";
    const first = rows[0];
    return `${rows.length} day${rows.length === 1 ? "" : "s"} · ${humanTime(first.open_time)}–${humanTime(first.close_time)} · ${calling?.call_hours?.timezone_id || "timezone not returned"}`;
  }, [calling]);

  function update(fields: Record<string, unknown>, successLabel: string, optimistic: (current: WhatsAppCallingSettings) => WhatsAppCallingSettings) {
    if (!calling) return;
    const previous = calling;
    setCalling(optimistic(calling));
    setError(null);
    setDetail(null);
    setSaved(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/whatsapp/calling-settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const payload = (await response.json().catch(() => ({}))) as CallingApiPayload;
      if (!response.ok || !payload.ok || !payload.calling) {
        setCalling(previous);
        setError(payload.error || "Meta rejected the Calling setting.");
        setDetail(payload.detail || null);
        return;
      }
      setCalling(payload.calling);
      setScheduleDraft(buildScheduleDraft(payload.calling, businessHours));
      setSaved(successLabel);
    });
  }

  function openScheduleEditor() {
    setScheduleDraft(buildScheduleDraft(calling, businessHours));
    setScheduleError(null);
    setScheduleOpen(true);
  }

  function updateScheduleRow(index: number, patch: Partial<ScheduleRow>) {
    setScheduleDraft((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  }

  async function saveSchedule() {
    const enabledRows = scheduleDraft.rows.filter((row) => row.enabled);
    const invalid = enabledRows.find((row) => !row.start || !row.end || row.start >= row.end);
    if (invalid) {
      setScheduleError(`${invalid.label}: choose an end time later than the start time.`);
      return;
    }
    if (!scheduleDraft.timezone.trim()) {
      setScheduleError("Choose a time zone before saving.");
      return;
    }

    setScheduleSaving(true);
    setScheduleError(null);
    setError(null);
    setDetail(null);
    setSaved(null);

    const callHours = {
      status: enabledRows.length ? "ENABLED" : "DISABLED",
      timezone_id: scheduleDraft.timezone.trim(),
      weekly_operating_hours: enabledRows.map((row) => ({
        day_of_week: row.meta,
        open_time: metaTime(row.start),
        close_time: metaTime(row.end),
      })),
      holiday_schedule: [],
    };

    try {
      const response = await fetch("/api/admin/whatsapp/calling-settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_hours: callHours }),
      });
      const payload = (await response.json().catch(() => ({}))) as CallingApiPayload;
      if (!response.ok || !payload.ok || !payload.calling) {
        setScheduleError(payload.detail || payload.error || "Meta rejected the regular-hours schedule.");
        return;
      }
      setCalling(payload.calling);
      setScheduleDraft(buildScheduleDraft(payload.calling, businessHours));
      setScheduleOpen(false);
      setSaved(enabledRows.length ? "Regular call hours saved at Meta" : "Regular call hours disabled at Meta");
    } catch (reason) {
      setScheduleError(reason instanceof Error ? reason.message : "Could not save regular call hours.");
    } finally {
      setScheduleSaving(false);
    }
  }

  const badge = loading
    ? "Loading…"
    : !calling
      ? "Live state unavailable"
      : calling.status === "ENABLED"
        ? "Calling enabled"
        : "Calling disabled";

  return (
    <section className="relative z-10 mx-4 mt-5 rounded-xl border border-rule bg-paper-raised p-5 shadow-sm sm:mx-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[.14em] text-ledger">Meta Calling API</p>
          <h2 className="mt-1 text-sm font-semibold text-ink">Voice call settings</h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-ink-faint">These controls read and write the Calls settings on your WhatsApp business phone number directly at Meta.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${calling?.status === "ENABLED" ? "bg-ledger-tint text-ledger" : "bg-paper-sunk text-ink-faint"}`}>
          {badge}
        </span>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{error}</p>
              {detail ? <p className="mt-1 break-words leading-5 text-rose-700/85">{detail}</p> : null}
            </div>
            <button type="button" onClick={() => void loadCallingSettings()} disabled={loading} className="flex-none rounded-md border border-rose-300 px-2.5 py-1 font-medium transition hover:bg-rose-100 disabled:opacity-50">
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
          <div><p className="text-sm font-medium text-ink">Allow voice calls</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Master switch for WhatsApp Calling on this number.</p></div>
          <Switch checked={calling?.status === "ENABLED"} disabled={pending || !calling} onChange={(checked) => update({ status: checked ? "ENABLED" : "DISABLED" }, checked ? "Voice calls enabled" : "Voice calls disabled", (current) => ({ ...current, status: checked ? "ENABLED" : "DISABLED" }))} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
          <div><p className="text-sm font-medium text-ink">Display call buttons</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Show the call icon in customer chats and your business profile.</p></div>
          <Switch checked={Boolean(calling && calling.call_icon_visibility !== "DISABLE_ALL")} disabled={pending || !calling || calling.status !== "ENABLED"} onChange={(checked) => update({ call_icon_visibility: checked ? "DEFAULT" : "DISABLE_ALL" }, checked ? "Call buttons displayed" : "Call buttons hidden", (current) => ({ ...current, call_icon_visibility: checked ? "DEFAULT" : "DISABLE_ALL" }))} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
          <div><p className="text-sm font-medium text-ink">Callback permission prompt</p><p className="mt-0.5 text-xs leading-4 text-ink-faint">Let callers grant permission for your business to call them back where Meta permits it.</p></div>
          <Switch checked={calling?.callback_permission_status === "ENABLED"} disabled={pending || !calling || calling.status !== "ENABLED"} onChange={(checked) => update({ callback_permission_status: checked ? "ENABLED" : "DISABLED" }, checked ? "Callback permissions enabled" : "Callback permissions disabled", (current) => ({ ...current, callback_permission_status: checked ? "ENABLED" : "DISABLED" }))} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Regular call hours</p>
            <p className="mt-0.5 text-xs leading-4 text-ink-faint">{hoursSummary}</p>
            <p className="mt-1 text-[0.68rem] leading-4 text-ink-faint">Set the days, times and time zone when customers can reach you by WhatsApp call.</p>
          </div>
          <button type="button" onClick={openScheduleEditor} disabled={pending || scheduleSaving} className="flex-none rounded-lg border border-rule bg-paper-raised px-3 py-2 text-xs font-semibold text-ink transition hover:border-ledger/40 hover:text-ledger disabled:opacity-50">
            {calling?.call_hours?.weekly_operating_hours?.length ? "Manage" : "Set up"}
          </button>
        </div>
      </div>

      {saved ? <p className="mt-3 text-xs font-medium text-ledger" aria-live="polite">{saved}</p> : null}
      <p className="mt-3 text-[0.68rem] leading-4 text-ink-faint">Meta may take time to refresh call-button visibility on some customer devices. Server-side calling rules apply as soon as Meta accepts the update.</p>

      {scheduleOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="calling-hours-title">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-rule bg-paper-raised shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-rule bg-paper-raised px-4 py-4 sm:px-5">
              <div>
                <h3 id="calling-hours-title" className="text-base font-semibold text-ink">Regular hours</h3>
                <p className="mt-1 text-xs text-ink-faint">Set the hours when you&apos;re available to receive WhatsApp calls.</p>
              </div>
              <button type="button" onClick={() => setScheduleOpen(false)} disabled={scheduleSaving} className="rounded-lg px-2 py-1 text-lg leading-none text-ink-faint hover:bg-paper-sunk hover:text-ink" aria-label="Close regular hours editor">×</button>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <div>
                <label htmlFor="calling-timezone" className="text-xs font-semibold text-ink">Time zone</label>
                <select
                  id="calling-timezone"
                  value={scheduleDraft.timezone}
                  onChange={(event) => setScheduleDraft((current) => ({ ...current, timezone: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ledger/60 focus:ring-2 focus:ring-ledger/10"
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>{timezoneLabel(timezone)}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[0.68rem] leading-4 text-ink-faint">This timezone is saved with your Meta Calling schedule and controls how the regular hours are interpreted.</p>
              </div>

              <div className="space-y-2">
                {scheduleDraft.rows.map((row, index) => (
                  <div key={row.meta} className="rounded-xl border border-rule bg-paper p-3">
                    <div className="flex items-center gap-3">
                      <input
                        id={`calling-day-${row.meta}`}
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(event) => updateScheduleRow(index, { enabled: event.target.checked })}
                        className="h-4 w-4 rounded border-rule accent-current"
                      />
                      <label htmlFor={`calling-day-${row.meta}`} className="min-w-0 flex-1 text-sm font-medium text-ink">{row.label}</label>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 pl-7">
                      <label className="text-[0.68rem] text-ink-faint">Start
                        <input type="time" value={row.start} disabled={!row.enabled} onChange={(event) => updateScheduleRow(index, { start: event.target.value })} className="mt-1 block w-full rounded-lg border border-rule bg-paper-raised px-2.5 py-2 text-sm text-ink disabled:opacity-40" />
                      </label>
                      <label className="text-[0.68rem] text-ink-faint">End
                        <input type="time" value={row.end} disabled={!row.enabled} onChange={(event) => updateScheduleRow(index, { end: event.target.value })} className="mt-1 block w-full rounded-lg border border-rule bg-paper-raised px-2.5 py-2 text-sm text-ink disabled:opacity-40" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {scheduleError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{scheduleError}</p> : null}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-rule bg-paper-raised px-4 py-3 sm:px-5">
              <button type="button" onClick={() => setScheduleOpen(false)} disabled={scheduleSaving} className="rounded-lg border border-rule px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper-sunk disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void saveSchedule()} disabled={scheduleSaving} className="rounded-lg bg-ledger-bright px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">{scheduleSaving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
