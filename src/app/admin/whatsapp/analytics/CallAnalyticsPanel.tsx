"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";

type CallAnalytics = {
  range: number;
  total: number;
  incoming: number;
  outgoing: number;
  answered: number;
  missed: number;
  active: number;
  answerRate: number | null;
  averageDurationSeconds: number | null;
  totalTalkSeconds: number;
};

type CallAnalyticsResponse =
  | { ok: true; analytics: CallAnalytics }
  | { ok?: false; error?: string };

function formatRate(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds <= 0) return "—";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const rest = rounded % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-[.14em] text-ink-faint">{label}</p>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger">
          <WhatsAppIcon name="phoneNumbers" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 font-display text-3xl font-semibold leading-none tabular-nums text-ink">{value}</p>
      <p className="mt-1.5 text-xs text-ink-faint">{note}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-rule py-2.5 text-sm first:border-t-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export default function CallAnalyticsPanel() {
  const searchParams = useSearchParams();
  const days = searchParams.get("days") || "30";
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/admin/whatsapp/call-analytics/?days=${encodeURIComponent(days)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as CallAnalyticsResponse;
        if (!response.ok || !payload.ok) {
          throw new Error("error" in payload && payload.error ? payload.error : "Call analytics could not be loaded.");
        }
        setAnalytics(payload.analytics);
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setAnalytics(null);
        setError(reason instanceof Error ? reason.message : "Call analytics could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [days]);

  const directionShares = useMemo(() => {
    if (!analytics?.total) return { incoming: 0, outgoing: 0 };
    return {
      incoming: (analytics.incoming / analytics.total) * 100,
      outgoing: (analytics.outgoing / analytics.total) * 100,
    };
  }, [analytics]);

  return (
    <section className="px-4 pb-6 sm:px-6">
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-rule pt-5">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">Calling API</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Call analytics</h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            Incoming and outgoing WhatsApp calls for the same reporting range selected above.
          </p>
        </div>
        <Link
          href="/admin/whatsapp/calls/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-paper-raised px-3 py-2 text-xs font-medium text-ledger transition hover:border-ledger"
        >
          <WhatsAppIcon name="phoneNumbers" className="h-3.5 w-3.5" />
          Open call history
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-paper-sunk" />)}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-xl border border-brass/25 bg-brass-tint px-4 py-3 text-sm text-[#6f4f16]">{error}</p>
      ) : analytics ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Total calls"
              value={analytics.total.toLocaleString("en-US")}
              note={`${analytics.range}-day reporting range`}
            />
            <Metric
              label="Incoming"
              value={analytics.incoming.toLocaleString("en-US")}
              note={`${Math.round(directionShares.incoming)}% of all calls`}
            />
            <Metric
              label="Outgoing"
              value={analytics.outgoing.toLocaleString("en-US")}
              note={`${Math.round(directionShares.outgoing)}% of all calls`}
            />
            <Metric
              label="Answer rate"
              value={formatRate(analytics.answerRate)}
              note={analytics.incoming ? "Answered incoming calls" : "No incoming calls yet"}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              <h3 className="text-sm font-semibold text-ink">Call performance</h3>
              <p className="mt-0.5 text-xs text-ink-faint">How calls progressed after they reached the business.</p>
              <dl className="mt-3">
                <Stat label="Answered" value={analytics.answered.toLocaleString("en-US")} />
                <Stat label="Missed / unanswered" value={analytics.missed.toLocaleString("en-US")} />
                <Stat label="Active now" value={analytics.active.toLocaleString("en-US")} />
                <Stat label="Average talk time" value={formatDuration(analytics.averageDurationSeconds)} />
                <Stat label="Total talk time" value={formatDuration(analytics.totalTalkSeconds)} />
              </dl>
            </div>

            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              <h3 className="text-sm font-semibold text-ink">Call direction</h3>
              <p className="mt-0.5 text-xs text-ink-faint">Incoming customer calls compared with business-originated calls.</p>
              {analytics.total ? (
                <>
                  <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-paper-sunk" aria-label={`${analytics.incoming} incoming and ${analytics.outgoing} outgoing calls`}>
                    <span className="bg-ledger-bright" style={{ width: `${directionShares.incoming}%` }} />
                    <span className="bg-brass" style={{ width: `${directionShares.outgoing}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-ledger-tint/60 p-3">
                      <p className="text-[0.65rem] uppercase tracking-[.12em] text-ledger">Incoming</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{analytics.incoming.toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-lg bg-brass-tint p-3">
                      <p className="text-[0.65rem] uppercase tracking-[.12em] text-[#6f4f16]">Outgoing</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{analytics.outgoing.toLocaleString("en-US")}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-10 text-center text-sm text-ink-faint">
                  No calls in this reporting range yet.
                </div>
              )}
              <p className="mt-4 border-t border-rule pt-3 text-[0.68rem] leading-5 text-ink-faint">
                These figures come from the call events stored from Meta&apos;s Calling API webhook, so they match Call History rather than a separate estimate.
              </p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
