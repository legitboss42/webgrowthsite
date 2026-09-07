"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Settings = {
  enabled: boolean;
  instagramEnabled: boolean;
  facebookEnabled: boolean;
  tiktokGenerationEnabled: boolean;
  assetRetentionDays: number;
};

type Connection = {
  connected: boolean;
  usable: boolean;
  facebookPageName: string | null;
  instagramAccountName: string | null;
  accessExpiresAt: string | null;
};

type Publication = {
  platform: "INSTAGRAM" | "FACEBOOK" | "TIKTOK";
  status: string;
  externalPublicationId: string | null;
  externalUrl: string | null;
  lastErrorMessage: string | null;
};

export type ContentAutomationJob = {
  id: string;
  articleSlug: string;
  articleTitle: string;
  status: string;
  createdAt: string;
  publications: Publication[];
};

type Props = {
  initialSettings: Settings;
  connection: Connection;
  jobs: ContentAutomationJob[];
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <label className="flex items-start justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-white/50">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 accent-emerald-500"
      />
    </label>
  );
}

function badge(status: string) {
  if (status === "PUBLISHED" || status === "COMPLETE") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "NEEDS_APPROVAL") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (status === "NEEDS_ATTENTION" || status === "FAILED_RETRYABLE") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (status === "SKIPPED") return "border-white/10 bg-white/[0.04] text-white/45";
  return "border-sky-400/30 bg-sky-400/10 text-sky-100";
}

function humanStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Not available";
}

export default function ContentAutomationClient({ initialSettings, connection, jobs }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [retrying, setRetrying] = useState<string | null>(null);

  function saveSettings() {
    setMessage(null);
    startSaving(async () => {
      const response = await fetch("/api/admin/content-automation/settings/", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        setMessage("Settings could not be saved.");
        return;
      }
      setMessage("Settings saved.");
      router.refresh();
    });
  }

  async function retry(jobId: string) {
    setMessage(null);
    setRetrying(jobId);
    try {
      const response = await fetch(`/api/admin/content-automation/jobs/${jobId}/retry/`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setMessage(body?.code === "NOTHING_TO_RETRY" ? "That job has nothing eligible for manual retry." : "Retry could not be started.");
        return;
      }
      setMessage("Retry completed or resumed.");
      router.refresh();
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-8">
      {message ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">{message}</div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0a100d] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Publishing controls</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Automation settings</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">New blog posts are converted once. Editing an existing article does not repost it.</p>
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Toggle
              label="Master automation"
              description="Stops all automatic publication preparation when disabled."
              checked={settings.enabled}
              onChange={(enabled) => setSettings((current) => ({ ...current, enabled }))}
            />
            <Toggle
              label="Instagram Reels"
              description="Automatically publish the branded Meta render."
              checked={settings.instagramEnabled}
              onChange={(instagramEnabled) => setSettings((current) => ({ ...current, instagramEnabled }))}
            />
            <Toggle
              label="Facebook Page Reels"
              description="Automatically publish the branded Meta render to the connected Page."
              checked={settings.facebookEnabled}
              onChange={(facebookEnabled) => setSettings((current) => ({ ...current, facebookEnabled }))}
            />
            <Toggle
              label="TikTok generation"
              description="Create the TikTok-safe render and queue it for required creator consent."
              checked={settings.tiktokGenerationEnabled}
              onChange={(tiktokGenerationEnabled) => setSettings((current) => ({ ...current, tiktokGenerationEnabled }))}
            />
          </div>

          <label className="mt-4 block max-w-xs text-sm text-white/65">
            Asset retention days
            <input
              type="number"
              min={1}
              max={30}
              value={settings.assetRetentionDays}
              onChange={(event) => setSettings((current) => ({ ...current, assetRetentionDays: Math.max(1, Math.min(30, Number(event.target.value) || 1)) }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-emerald-400/60"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a100d] p-6">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Meta connection</p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${connection.usable ? "bg-emerald-400" : connection.connected ? "bg-amber-300" : "bg-white/25"}`} />
            <span className="text-sm font-semibold text-white">
              {connection.usable ? "Connected" : connection.connected ? "Reconnect required" : "Not connected"}
            </span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-white/40">Facebook Page</dt>
              <dd className="mt-1 text-white/80">{connection.facebookPageName || "Not connected"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Instagram account</dt>
              <dd className="mt-1 text-white/80">{connection.instagramAccountName ? `@${connection.instagramAccountName.replace(/^@/, "")}` : "Not connected"}</dd>
            </div>
            <div>
              <dt className="text-white/40">Access expiry</dt>
              <dd className="mt-1 text-white/80">{formatDate(connection.accessExpiresAt)}</dd>
            </div>
          </dl>
          <a
            href="/api/admin/content-automation/meta/connect/?returnTo=/admin/content-automation/"
            className="mt-6 inline-flex rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-300/15"
          >
            {connection.connected ? "Reconnect Meta" : "Connect Meta"}
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0a100d] p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Recent jobs</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Blog-to-social activity</h2>
          </div>
          <Link href="/scheduler/dashboard/" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">Open TikTok scheduler</Link>
        </div>

        <div className="mt-6 space-y-4">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-center text-sm text-white/45">No social automation jobs yet.</div>
          ) : jobs.map((job) => {
            const canRetry = job.publications.some((publication) => publication.status === "FAILED_RETRYABLE" || publication.status === "NEEDS_ATTENTION");
            return (
              <article key={job.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{job.articleTitle}</h3>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge(job.status)}`}>{humanStatus(job.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">/blog/{job.articleSlug}/ · {formatDate(job.createdAt)}</p>
                  </div>
                  {canRetry ? (
                    <button
                      type="button"
                      onClick={() => retry(job.id)}
                      disabled={retrying === job.id}
                      className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50"
                    >
                      {retrying === job.id ? "Retrying..." : "Retry failed platforms"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {job.publications.map((publication) => (
                    <div key={publication.platform} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white/75">{humanStatus(publication.platform)}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge(publication.status)}`}>{humanStatus(publication.status)}</span>
                      </div>
                      {publication.lastErrorMessage ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-rose-200/70">{publication.lastErrorMessage}</p> : null}
                      {publication.platform === "TIKTOK" && publication.status === "NEEDS_APPROVAL" && publication.externalPublicationId ? (
                        <Link href={`/scheduler/posts/${publication.externalPublicationId}/`} className="mt-3 inline-block text-xs font-semibold text-amber-200 hover:text-amber-100">Review and consent</Link>
                      ) : publication.externalUrl ? (
                        <a href={publication.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-emerald-300">Open published post</a>
                      ) : publication.externalPublicationId ? (
                        <p className="mt-2 truncate text-[10px] text-white/30">ID: {publication.externalPublicationId}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
