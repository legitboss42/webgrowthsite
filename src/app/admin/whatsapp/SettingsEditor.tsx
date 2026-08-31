"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_SETTINGS_LIMITS,
  WHATSAPP_WEEKDAY_LABELS,
  WHATSAPP_WEEKDAY_SHORT_LABELS,
  describeWhatsAppBusinessDays,
  normalizeWhatsAppKeywordList,
  validateWhatsAppSettingsInput,
  type WhatsAppSettings,
} from "@/lib/whatsapp/settings";

type Draft = {
  hot: string;
  warm: string;
  spam: string;
  hoursEnabled: boolean;
  timezone: string;
  days: number[];
  start: string;
  end: string;
  target: string;
  activityWindowDays: string;
  inboxRefreshSeconds: string;
};

const COMMON_TIMEZONES = [
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Europe/London",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "UTC",
];

function toDraft(settings: WhatsAppSettings): Draft {
  return {
    hot: settings.leadKeywords.hot.join("\n"),
    warm: settings.leadKeywords.warm.join("\n"),
    spam: settings.leadKeywords.spam.join("\n"),
    hoursEnabled: settings.businessHours.enabled,
    timezone: settings.businessHours.timezone,
    days: settings.businessHours.days,
    start: settings.businessHours.start,
    end: settings.businessHours.end,
    target: String(settings.targetFirstResponseMinutes),
    activityWindowDays: String(settings.console.activityWindowDays),
    inboxRefreshSeconds: String(settings.console.inboxRefreshSeconds),
  };
}

function toPayload(draft: Draft) {
  return {
    leadKeywords: { hot: draft.hot, warm: draft.warm, spam: draft.spam },
    businessHours: {
      enabled: draft.hoursEnabled,
      timezone: draft.timezone.trim(),
      days: draft.days,
      start: draft.start,
      end: draft.end,
    },
    targetFirstResponseMinutes: draft.target.trim(),
    console: {
      activityWindowDays: draft.activityWindowDays.trim(),
      inboxRefreshSeconds: draft.inboxRefreshSeconds.trim(),
    },
  };
}

const FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/15 disabled:cursor-not-allowed disabled:opacity-60";
const LABEL_CLASS = "block text-xs font-semibold text-ink-soft";

function SectionCard({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-4 shadow-[0_12px_32px_-28px_rgba(14,26,20,.45)] sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-ledger-tint text-xs font-bold text-ledger">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-ink-faint">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-rule bg-paper px-3.5 py-3 transition hover:border-rule-strong">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-ink-faint">{description}</span>
      </span>
      <span className="relative flex-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-paper-sunk ring-1 ring-rule transition peer-checked:bg-ledger-bright peer-focus-visible:ring-2 peer-focus-visible:ring-ledger-bright/30 peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function KeywordField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const parsed = normalizeWhatsAppKeywordList(value);
  const overflow = parsed.length >= WHATSAPP_SETTINGS_LIMITS.keywordsPerList;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={4}
        aria-describedby={`${id}-hint`}
        placeholder="One keyword or phrase per line"
        className={`${FIELD_CLASS} resize-y`}
      />
      <p id={`${id}-hint`} className="mt-1.5 text-[0.68rem] leading-4 text-ink-faint">
        {hint} <span className="tabular-nums text-ink-soft">{parsed.length} saved</span>
        {overflow ? <span className="text-rose-700"> · only the first {WHATSAPP_SETTINGS_LIMITS.keywordsPerList} are kept</span> : null}
      </p>
    </div>
  );
}

export default function SettingsEditor({ settings, storageReady }: { settings: WhatsAppSettings; storageReady: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings));
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  };

  const toggleDay = (day: number) => {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day].sort((a, b) => a - b),
    }));
    setFeedback(null);
  };

  const validation = useMemo(() => validateWhatsAppSettingsInput(toPayload(draft)), [draft]);
  const dirty = validation.ok ? JSON.stringify(validation.value) !== JSON.stringify(settings) : true;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!validation.ok) {
      setFeedback({ tone: "error", text: validation.error });
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/admin/whatsapp/settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        setFeedback({ tone: "error", text: payload.error || "The settings could not be saved." });
        return;
      }
      setFeedback({ tone: "ok", text: "Settings saved. Changes apply immediately." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {!storageReady ? (
        <div className="rounded-2xl border border-brass/30 bg-brass-tint px-4 py-3 text-xs leading-5 text-ink-soft">
          <span className="font-semibold text-ink">Settings storage is unavailable.</span> The console is using built-in defaults and saving is disabled until the WhatsApp settings table is available.
        </div>
      ) : null}

      <SectionCard
        number="3"
        title="Messaging & response settings"
        description="Control business hours, response targets and how quickly the inbox refreshes."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Toggle
            checked={draft.hoursEnabled}
            onChange={(checked) => update("hoursEnabled", checked)}
            disabled={isPending}
            label="Track business hours"
            description="Show whether your team is currently inside its configured working hours."
          />
          <div className="rounded-xl border border-ledger/15 bg-ledger-tint px-3.5 py-3">
            <p className="text-sm font-medium text-ink">WhatsApp 24-hour window</p>
            <p className="mt-0.5 text-xs leading-4 text-ink-soft">This setting does not override Meta rules. Free-form replies still require an open customer-service window.</p>
          </div>
        </div>

        <div className={`mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${draft.hoursEnabled ? "" : "opacity-50"}`}>
          <div className="sm:col-span-2">
            <label htmlFor="hours-timezone" className={LABEL_CLASS}>Timezone</label>
            <input id="hours-timezone" list="whatsapp-timezones" value={draft.timezone} onChange={(event) => update("timezone", event.target.value)} disabled={isPending || !draft.hoursEnabled} className={FIELD_CLASS} />
            <datalist id="whatsapp-timezones">{COMMON_TIMEZONES.map((zone) => <option key={zone} value={zone} />)}</datalist>
          </div>
          <div>
            <label htmlFor="hours-start" className={LABEL_CLASS}>Opens</label>
            <input id="hours-start" type="time" value={draft.start} onChange={(event) => update("start", event.target.value)} disabled={isPending || !draft.hoursEnabled} className={FIELD_CLASS} />
          </div>
          <div>
            <label htmlFor="hours-end" className={LABEL_CLASS}>Closes</label>
            <input id="hours-end" type="time" value={draft.end} onChange={(event) => update("end", event.target.value)} disabled={isPending || !draft.hoursEnabled} className={FIELD_CLASS} />
          </div>
        </div>

        <fieldset className={`mt-4 ${draft.hoursEnabled ? "" : "opacity-50"}`}>
          <legend className={LABEL_CLASS}>Working days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WHATSAPP_WEEKDAY_SHORT_LABELS.map((short, day) => {
              const active = draft.days.includes(day);
              return (
                <label key={short} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ledger-bright ${active ? "border-ledger/20 bg-ledger-tint text-ledger" : "border-rule bg-paper text-ink-faint hover:border-rule-strong"} ${isPending || !draft.hoursEnabled ? "pointer-events-none" : ""}`}>
                  <input type="checkbox" checked={active} onChange={() => toggleDay(day)} disabled={isPending || !draft.hoursEnabled} aria-label={WHATSAPP_WEEKDAY_LABELS[day]} className="sr-only" />
                  {short}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[0.68rem] text-ink-faint">{describeWhatsAppBusinessDays(draft.days)}, {draft.start}–{draft.end}</p>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="response-target" className={LABEL_CLASS}>First reply target</label>
            <div className="relative">
              <input id="response-target" type="number" inputMode="numeric" min={WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.min} max={WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.max} value={draft.target} onChange={(event) => update("target", event.target.value)} disabled={isPending} className={`${FIELD_CLASS} pr-16`} />
              <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-ink-faint">minutes</span>
            </div>
          </div>
          <div>
            <label htmlFor="activity-window" className={LABEL_CLASS}>Analytics window</label>
            <div className="relative">
              <input id="activity-window" type="number" inputMode="numeric" min={WHATSAPP_SETTINGS_LIMITS.activityWindowDays.min} max={WHATSAPP_SETTINGS_LIMITS.activityWindowDays.max} value={draft.activityWindowDays} onChange={(event) => update("activityWindowDays", event.target.value)} disabled={isPending} className={`${FIELD_CLASS} pr-12`} />
              <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-ink-faint">days</span>
            </div>
          </div>
          <div>
            <label htmlFor="inbox-refresh" className={LABEL_CLASS}>Inbox refresh</label>
            <div className="relative">
              <input id="inbox-refresh" type="number" inputMode="numeric" min={WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.min} max={WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.max} value={draft.inboxRefreshSeconds} onChange={(event) => update("inboxRefreshSeconds", event.target.value)} disabled={isPending} className={`${FIELD_CLASS} pr-16`} />
              <span className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-ink-faint">seconds</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        number="4"
        title="Lead classification"
        description="Optional words and phrases that help the inbox prioritise conversations."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <KeywordField id="keywords-hot" label="Hot leads" hint="Always flagged for review." value={draft.hot} onChange={(value) => update("hot", value)} disabled={isPending} />
          <KeywordField id="keywords-warm" label="Warm leads" hint="Raises a cold lead to warm." value={draft.warm} onChange={(value) => update("warm", value)} disabled={isPending} />
          <KeywordField id="keywords-spam" label="Spam / suppress" hint="Stored, but excluded from auto-reply." value={draft.spam} onChange={(value) => update("spam", value)} disabled={isPending} />
        </div>
      </SectionCard>

      {feedback ? (
        <p role="status" className={`rounded-xl px-4 py-3 text-xs ${feedback.tone === "ok" ? "border border-ledger/15 bg-ledger-tint text-ledger" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>{feedback.text}</p>
      ) : !validation.ok ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{validation.error}</p>
      ) : null}

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper-raised/95 px-4 py-3 shadow-[0_18px_45px_-25px_rgba(14,26,20,.55)] backdrop-blur">
        <span className="text-xs text-ink-faint">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setDraft(toDraft(settings)); setFeedback(null); }} disabled={isPending || !dirty} className="rounded-xl border border-rule px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:border-rule-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-45">Discard</button>
          <button type="submit" disabled={isPending || !storageReady || !validation.ok || !dirty} className="rounded-xl bg-ledger-bright px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint">{isPending ? "Saving..." : "Save changes"}</button>
        </div>
      </div>
    </form>
  );
}
