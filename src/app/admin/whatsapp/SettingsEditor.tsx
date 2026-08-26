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

/**
 * Keyword lists are held as raw text while the operator types, so a half-finished
 * line is never reformatted underneath the cursor. They are normalised on save.
 */
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
  "mt-1 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/20 disabled:opacity-60";
const LABEL_CLASS =
  "block text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ink-faint";

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-rule bg-paper-raised p-5">
      <legend className="px-1 text-sm font-semibold text-ink">{title}</legend>
      <p className="mt-0.5 text-xs leading-5 text-ink-faint">{description}</p>
      <div className="mt-4">{children}</div>
    </fieldset>
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
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={5}
        aria-describedby={`${id}-hint`}
        placeholder="One per line"
        className={FIELD_CLASS}
      />
      <p id={`${id}-hint`} className="mt-1 text-[0.65rem] leading-4 text-ink-faint">
        {hint}{" "}
        <span className="tabular-nums text-ink-soft">
          {parsed.length} keyword{parsed.length === 1 ? "" : "s"}
        </span>
        {overflow ? (
          <span className="text-rose-700">
            {" "}
            — only the first {WHATSAPP_SETTINGS_LIMITS.keywordsPerList} are kept
          </span>
        ) : null}
      </p>
    </div>
  );
}

export default function SettingsEditor({
  settings,
  storageReady,
}: {
  settings: WhatsAppSettings;
  storageReady: boolean;
}) {
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

  // The same validator the API route uses, so an invalid submission is caught before
  // a request is made and the message is identical either way.
  const validation = useMemo(() => validateWhatsAppSettingsInput(toPayload(draft)), [draft]);
  const dirty = validation.ok
    ? JSON.stringify(validation.value) !== JSON.stringify(settings)
    : true;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!validation.ok) {
      setFeedback({ tone: "error", text: validation.error });
      return;
    }

    startTransition(async () => {
      // Trailing slash matches next.config's trailingSlash: true, avoiding a 308 hop.
      const response = await fetch("/api/admin/whatsapp/settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!payload.ok) {
        setFeedback({ tone: "error", text: payload.error || "The settings could not be saved." });
        return;
      }
      setFeedback({ tone: "ok", text: "Settings saved. They apply to new activity immediately." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {!storageReady ? (
        <p className="rounded-xl border border-brass/30 bg-brass-tint px-4 py-3 text-xs leading-5 text-ink-soft">
          <span className="font-semibold text-ink">Settings storage is not created yet.</span> The
          console is running on the built-in defaults shown below. Run the{" "}
          <span className="font-mono">whatsapp_settings</span> migration in Supabase, then save.
          Until then a save will be refused rather than silently lost.
        </p>
      ) : null}

      <Group
        title="Lead scoring keywords"
        description="Your own words, layered on top of the built-in rules. The built-in rules still decide what a message is about; these only change how warm it is. Precedence is spam first, then hot, then warm — so a message mentioning both a price and a spam word stays silenced."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <KeywordField
            id="keywords-hot"
            label="Hot"
            hint="Always treated as a hot lead and flagged for review."
            value={draft.hot}
            onChange={(value) => update("hot", value)}
            disabled={isPending}
          />
          <KeywordField
            id="keywords-warm"
            label="Warm"
            hint="Lifts a cold message to warm. Never cools a hot one."
            value={draft.warm}
            onChange={(value) => update("warm", value)}
            disabled={isPending}
          />
          <KeywordField
            id="keywords-spam"
            label="Spam"
            hint="Forced cold and never auto-replied to. The message is still stored."
            value={draft.spam}
            onChange={(value) => update("spam", value)}
            disabled={isPending}
          />
        </div>
        <p className="mt-3 text-[0.65rem] leading-4 text-ink-faint">
          Matching is on whole words, so <span className="font-mono">art</span> will not fire
          inside <span className="font-mono">start</span>. Phrases are allowed —{" "}
          <span className="font-mono">how much</span> works. Case does not matter.
        </p>
      </Group>

      <Group
        title="Business hours and response target"
        description="Used to label activity in the console. Nothing here stops a message being received or a reply being sent — WhatsApp's own 24-hour service window is what governs replies."
      >
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.hoursEnabled}
            onChange={(event) => update("hoursEnabled", event.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-rule-strong text-ledger-bright focus:ring-2 focus:ring-ledger-bright/20"
          />
          Track business hours
        </label>

        <div
          className={`mt-4 grid gap-4 sm:grid-cols-3 ${draft.hoursEnabled ? "" : "opacity-50"}`}
        >
          <div className="sm:col-span-3">
            <label htmlFor="hours-timezone" className={LABEL_CLASS}>
              Timezone
            </label>
            <input
              id="hours-timezone"
              list="whatsapp-timezones"
              value={draft.timezone}
              onChange={(event) => update("timezone", event.target.value)}
              disabled={isPending || !draft.hoursEnabled}
              placeholder="Africa/Johannesburg"
              className={FIELD_CLASS}
            />
            <datalist id="whatsapp-timezones">
              {COMMON_TIMEZONES.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="hours-start" className={LABEL_CLASS}>
              Opens
            </label>
            <input
              id="hours-start"
              type="time"
              value={draft.start}
              onChange={(event) => update("start", event.target.value)}
              disabled={isPending || !draft.hoursEnabled}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="hours-end" className={LABEL_CLASS}>
              Closes
            </label>
            <input
              id="hours-end"
              type="time"
              value={draft.end}
              onChange={(event) => update("end", event.target.value)}
              disabled={isPending || !draft.hoursEnabled}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <label htmlFor="response-target" className={LABEL_CLASS}>
              First reply target (minutes)
            </label>
            <input
              id="response-target"
              type="number"
              inputMode="numeric"
              min={WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.min}
              max={WHATSAPP_SETTINGS_LIMITS.targetFirstResponseMinutes.max}
              value={draft.target}
              onChange={(event) => update("target", event.target.value)}
              disabled={isPending}
              aria-describedby="response-target-hint"
              className={FIELD_CLASS}
            />
            <p id="response-target-hint" className="mt-1 text-[0.65rem] text-ink-faint">
              0 means no target. Analytics compares your median against it.
            </p>
          </div>

          <fieldset className="sm:col-span-3">
            <legend className={LABEL_CLASS}>Open on</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WHATSAPP_WEEKDAY_SHORT_LABELS.map((short, day) => {
                const active = draft.days.includes(day);
                return (
                  <label
                    key={short}
                    // The checkbox itself is sr-only, so the focus ring has to live on the
                    // label or keyboard users get no indication of where they are.
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ledger-bright ${
                      active
                        ? "border-ledger/20 bg-ledger-tint text-ledger"
                        : "border-rule bg-paper text-ink-faint hover:border-rule-strong"
                    } ${isPending || !draft.hoursEnabled ? "pointer-events-none" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleDay(day)}
                      disabled={isPending || !draft.hoursEnabled}
                      aria-label={WHATSAPP_WEEKDAY_LABELS[day]}
                      className="sr-only"
                    />
                    {short}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[0.65rem] text-ink-faint">
              {describeWhatsAppBusinessDays(draft.days)}, {draft.start}–{draft.end}. Overnight
              hours are not supported yet — closing must be later the same day.
            </p>
          </fieldset>
        </div>
      </Group>

      <Group
        title="Console preferences"
        description="How this console behaves for everyone who opens it."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="activity-window" className={LABEL_CLASS}>
              Overview activity window (days)
            </label>
            <input
              id="activity-window"
              type="number"
              inputMode="numeric"
              min={WHATSAPP_SETTINGS_LIMITS.activityWindowDays.min}
              max={WHATSAPP_SETTINGS_LIMITS.activityWindowDays.max}
              value={draft.activityWindowDays}
              onChange={(event) => update("activityWindowDays", event.target.value)}
              disabled={isPending}
              aria-describedby="activity-window-hint"
              className={FIELD_CLASS}
            />
            <p id="activity-window-hint" className="mt-1 text-[0.65rem] text-ink-faint">
              {WHATSAPP_SETTINGS_LIMITS.activityWindowDays.min}–
              {WHATSAPP_SETTINGS_LIMITS.activityWindowDays.max}. Sets the range the overview
              sparkline and counts cover.
            </p>
          </div>
          <div>
            <label htmlFor="inbox-refresh" className={LABEL_CLASS}>
              Inbox refresh (seconds)
            </label>
            <input
              id="inbox-refresh"
              type="number"
              inputMode="numeric"
              min={WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.min}
              max={WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.max}
              value={draft.inboxRefreshSeconds}
              onChange={(event) => update("inboxRefreshSeconds", event.target.value)}
              disabled={isPending}
              aria-describedby="inbox-refresh-hint"
              className={FIELD_CLASS}
            />
            <p id="inbox-refresh-hint" className="mt-1 text-[0.65rem] text-ink-faint">
              {WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.min}–
              {WHATSAPP_SETTINGS_LIMITS.inboxRefreshSeconds.max}. There is no push connection, so
              the inbox polls on this interval. Shorter means more requests.
            </p>
          </div>
        </div>
      </Group>

      {feedback ? (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-xs ${
            feedback.tone === "ok"
              ? "border border-ledger/15 bg-ledger-tint text-ledger"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : !validation.ok ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {validation.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !validation.ok || !dirty}
          className="rounded-full bg-ledger-bright px-5 py-2 text-sm font-medium text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
        >
          {isPending ? "Saving..." : "Save settings"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(toDraft(settings));
            setFeedback(null);
          }}
          disabled={isPending || !dirty}
          className="rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-rule-strong hover:text-ink disabled:opacity-50"
        >
          Discard changes
        </button>
        <span className="text-xs text-ink-faint">
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>
    </form>
  );
}
