"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import { formatWhatsAppDuration } from "../analyticsModel";
import { formatWhatsAppAnalyticsPercent, type WhatsAppAnalyticsTrend } from "../advancedAnalyticsModel";

type Range = 7 | 30 | 90;
type CountRow = { label: string; count: number };
type ApiData = {
  ok: true;
  generatedAt: string;
  range: Range;
  capped: Record<string, boolean>;
  overview: {
    openBacklog: number;
    newContacts: number;
    conversationsOpened: number;
    medianFirstResponseMs: number | null;
    automationSuccessRate: number | null;
    campaignReplyRate: number | null;
    flowCompletionRate: number | null;
    callAnswerRate: number | null;
    trends: Record<string, WhatsAppAnalyticsTrend>;
  };
  conversations: {
    opened: number; closed: number; openBacklog: number; inboundMessages: number; outboundMessages: number;
    response: { measured: number; medianMs: number | null; averageMs: number | null; fastestMs: number | null; slowestMs: number | null };
    busiestHourUtc: { hour: number; count: number } | null;
  };
  team: { members: Array<{ id: string; name: string; email: string; role: string; active: boolean; assigned: number; replies: number; closed: number; assignments: number; lastSeenAt: string | null }> };
  crm: { newContacts: number; stages: CountRow[]; temperatures: CountRow[]; consent: CountRow[]; sources: CountRow[]; tags: CountRow[]; note: string };
  automations: {
    totalRuns: number;
    statuses: Record<string, number>;
    successRate: number | null;
    failureRate: number | null;
    duration: { count: number; averageMs: number | null; medianMs: number | null };
    byWorkflow: Array<{ id: string; name: string; runs: number; succeeded: number; failed: number; waiting: number; cancelled: number }>;
    byTrigger: CountRow[];
    recentFailures: Array<{ id: string; automationId: string; automationName: string; trigger: string; errorCode: string | null; error: string; createdAt: string }>;
  };
  campaigns: {
    recipients: number; sent: number; delivered: number; read: number; replied: number; failed: number; skipped: number;
    deliveryRate: number | null; readRate: number | null; replyRate: number | null; failureRate: number | null;
    campaigns: Array<{ id: string; name: string; status: string; template: string | null; audience: number; eligible: number; sent: number; delivered: number; read: number; replied: number; failed: number; skipped: number }>;
    recipientFailures: Array<{ campaignId: string; errorCode: string | null; error: string }>;
  };
  flows: {
    launches: number; completed: number; failed: number; incomplete: number; completionRate: number | null;
    duration: { count: number; averageMs: number | null; medianMs: number | null };
    byFlow: Array<{ id: string; name: string; status: string; launches: number; completed: number; failed: number; incomplete: number; completionRate: number | null }>;
    recent: Array<{ id: string; flowId: string; flowName: string; status: string; startedAt: string; completedAt: string | null; error: string | null }>;
  };
  calls: { total: number; inbound: number; outbound: number; answered: number; missed: number; answerRate: number | null; averageDurationSeconds: number | null; totalTalkSeconds: number };
};

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US") : "—";
}
function formatHour(hour: number | null | undefined) {
  if (typeof hour !== "number") return "—";
  return `${String(hour).padStart(2, "0")}:00 UTC`;
}
function formatSeconds(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? formatWhatsAppDuration(value * 1000) : "—";
}
function labelize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function Trend({ trend }: { trend?: WhatsAppAnalyticsTrend }) {
  if (!trend || trend.direction === "unavailable") return <span className="text-ink-faint">No comparison</span>;
  if (trend.direction === "flat") return <span className="text-ink-faint">No change</span>;
  if (trend.percent === null) return <span className="text-ink-faint">Previous period was zero</span>;
  const favorable = trend.favorable;
  return (
    <span className={favorable === true ? "text-ledger" : favorable === false ? "text-rose-600" : "text-ink-faint"}>
      {trend.direction === "up" ? "↑" : "↓"} {Math.abs(Math.round(trend.percent * 100))}% vs previous
    </span>
  );
}
function Metric({ label, value, note, icon, href, trend }: { label: string; value: string; note: string; icon: WhatsAppIconName; href?: string; trend?: WhatsAppAnalyticsTrend }) {
  const content = (
    <div className="h-full rounded-xl border border-rule bg-paper-raised p-4 transition hover:border-rule-strong">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-[.14em] text-ink-faint">{label}</p>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ledger-tint text-ledger"><WhatsAppIcon name={icon} className="h-4 w-4" /></span>
      </div>
      <p className="mt-2.5 font-display text-3xl font-semibold leading-none tabular-nums text-ink">{value}</p>
      <p className="mt-1.5 text-xs text-ink-faint">{note}</p>
      {trend ? <p className="mt-2 text-[0.68rem] font-medium"><Trend trend={trend} /></p> : null}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}
function Section({ title, note, href, children }: { title: string; note?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-rule bg-paper-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-ink">{title}</h2>{note ? <p className="mt-0.5 text-xs text-ink-faint">{note}</p> : null}</div>
        {href ? <Link href={href} className="text-xs font-medium text-ledger hover:underline">Open workspace</Link> : null}
      </div>
      {children}
    </section>
  );
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-paper-sunk px-3 py-3"><p className="text-[0.65rem] uppercase tracking-[.12em] text-ink-faint">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</p></div>;
}
function BarList({ rows, empty = "No data in this view." }: { rows: CountRow[]; empty?: string }) {
  const max = Math.max(0, ...rows.map((row) => row.count));
  if (!rows.length || max === 0) return <p className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-7 text-center text-xs text-ink-faint">{empty}</p>;
  return <ul className="mt-4 space-y-3">{rows.slice(0, 8).map((row) => <li key={row.label}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-ink-soft">{labelize(row.label)}</span><span className="tabular-nums text-ink">{formatNumber(row.count)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk"><div className="h-full rounded-full bg-ledger-bright" style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }} /></div></li>)}</ul>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded-lg border border-dashed border-rule-strong px-4 py-9 text-center text-sm text-ink-faint">{children}</div>;
}

export default function AdvancedAnalyticsPanel() {
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    fetch(`/api/admin/whatsapp/advanced-analytics/?days=${range}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as (ApiData & { error?: string }) | null;
        if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Advanced analytics could not be loaded.");
        return payload;
      })
      .then((payload) => setData(payload))
      .catch((reason) => { if (reason?.name !== "AbortError") setError(reason instanceof Error ? reason.message : "Advanced analytics could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [range]);

  const hasCap = useMemo(() => data ? Object.values(data.capped).some(Boolean) : false, [data]);

  if (loading && !data) return <section className="px-4 py-5 sm:px-6"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-paper-sunk" />)}</div></section>;
  if (error && !data) return <section className="px-4 py-5 sm:px-6"><div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-8 text-sm text-rose-700">{error}</div></section>;
  if (!data) return null;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-lg font-semibold text-ink">Advanced analytics</h1><p className="mt-1 text-sm text-ink-faint">Operational health across conversations, CRM, team, automations, campaigns, Flows and calls.</p></div>
        <div className="flex w-max rounded-xl border border-rule bg-paper-sunk p-1">{([7, 30, 90] as const).map((days) => <button key={days} type="button" onClick={() => setRange(days)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${range === days ? "bg-ledger-bright text-white" : "text-ink-soft hover:bg-paper-raised"}`}>{days} days</button>)}</div>
      </div>
      {loading ? <p className="mt-3 text-xs text-ink-faint">Refreshing analytics…</p> : null}
      {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Refresh failed: {error}. Showing the last successful result.</p> : null}
      {hasCap ? <p className="mt-3 rounded-lg bg-brass-tint px-3 py-2 text-xs text-[#6f4f16]">One or more analytics sources reached the safety row cap. Shorten the reporting range for exact high-volume results.</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Open backlog" value={formatNumber(data.overview.openBacklog)} note="Conversations currently open" icon="conversations" href="/admin/whatsapp/conversations/" />
        <Metric label="New contacts" value={formatNumber(data.overview.newContacts)} note={`Created in the last ${range} days`} icon="contacts" href="/admin/whatsapp/contacts/" trend={data.overview.trends.newContacts} />
        <Metric label="Conversations opened" value={formatNumber(data.overview.conversationsOpened)} note="Session-open events" icon="overview" href="/admin/whatsapp/conversations/" trend={data.overview.trends.conversationsOpened} />
        <Metric label="Median first response" value={formatWhatsAppDuration(data.overview.medianFirstResponseMs)} note="Customer wait to next business reply" icon="clock" trend={data.overview.trends.medianFirstResponseMs} />
        <Metric label="Automation success" value={formatWhatsAppAnalyticsPercent(data.overview.automationSuccessRate)} note="Succeeded among finished runs" icon="automations" href="/admin/whatsapp/automations/" trend={data.overview.trends.automationSuccessRate} />
        <Metric label="Campaign reply rate" value={formatWhatsAppAnalyticsPercent(data.overview.campaignReplyRate)} note="Replies among sent campaign recipients" icon="campaigns" href="/admin/whatsapp/campaigns/" trend={data.overview.trends.campaignReplyRate} />
        <Metric label="Flow completion" value={formatWhatsAppAnalyticsPercent(data.overview.flowCompletionRate)} note="Completed among Flow launches" icon="templates" href="/admin/whatsapp/flows/" trend={data.overview.trends.flowCompletionRate} />
        <Metric label="Call answer rate" value={formatWhatsAppAnalyticsPercent(data.overview.callAnswerRate)} note="Answered inbound calls" icon="phoneNumbers" href="/admin/whatsapp/calls/" trend={data.overview.trends.callAnswerRate} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Conversation health" note="Sessions, messages and customer wait time" href="/admin/whatsapp/conversations/">
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Opened" value={formatNumber(data.conversations.opened)} /><MiniStat label="Closed" value={formatNumber(data.conversations.closed)} /><MiniStat label="Inbound" value={formatNumber(data.conversations.inboundMessages)} /><MiniStat label="Outbound" value={formatNumber(data.conversations.outboundMessages)} /></div>
          <dl className="mt-4 divide-y divide-rule text-sm"><div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-faint">Open backlog</dt><dd className="tabular-nums text-ink">{formatNumber(data.conversations.openBacklog)}</dd></div><div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-faint">Median response</dt><dd className="tabular-nums text-ink">{formatWhatsAppDuration(data.conversations.response.medianMs)}</dd></div><div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-faint">Average response</dt><dd className="tabular-nums text-ink">{formatWhatsAppDuration(data.conversations.response.averageMs)}</dd></div><div className="flex justify-between gap-3 py-2.5"><dt className="text-ink-faint">Busiest hour</dt><dd className="tabular-nums text-ink">{formatHour(data.conversations.busiestHourUtc?.hour)}</dd></div></dl>
        </Section>

        <Section title="Team workload" note="Only actions with stored team attribution are credited" href="/admin/whatsapp/team/">
          {data.team.members.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead><tr className="border-b border-rule text-ink-faint"><th className="pb-2 font-medium">Team member</th><th className="pb-2 text-right font-medium">Assigned</th><th className="pb-2 text-right font-medium">Replies</th><th className="pb-2 text-right font-medium">Closed</th><th className="pb-2 text-right font-medium">Assignments</th></tr></thead><tbody>{data.team.members.map((member) => <tr key={member.id} className="border-b border-rule last:border-0"><td className="py-3"><p className="font-medium text-ink">{member.name}</p><p className="mt-0.5 text-[0.65rem] text-ink-faint">{labelize(member.role)}{member.active ? "" : " · inactive"}</p></td><td className="py-3 text-right tabular-nums text-ink">{member.assigned}</td><td className="py-3 text-right tabular-nums text-ink">{member.replies}</td><td className="py-3 text-right tabular-nums text-ink">{member.closed}</td><td className="py-3 text-right tabular-nums text-ink">{member.assignments}</td></tr>)}</tbody></table></div> : <Empty>No attributable team activity yet.</Empty>}
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Section title="CRM pipeline" note="Current-state distribution, not historical conversion" href="/admin/whatsapp/contacts/"><BarList rows={data.crm.stages} empty="No CRM contacts yet." /></Section>
        <Section title="Lead temperature" note={`${data.crm.newContacts} new contact${data.crm.newContacts === 1 ? "" : "s"} in this period`} href="/admin/whatsapp/contacts/"><BarList rows={data.crm.temperatures} /></Section>
        <Section title="Consent status" note="Current WhatsApp contact consent state" href="/admin/whatsapp/contacts/"><BarList rows={data.crm.consent} /></Section>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2"><Section title="Top contact sources" note="Only populated source values are counted"><BarList rows={data.crm.sources} empty="No contact source data has been recorded." /></Section><Section title="Top tags / service interest" note="Current tags across CRM contacts"><BarList rows={data.crm.tags} empty="No contact tags have been recorded." /></Section></div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <Section title="Automation performance" note={`${formatNumber(data.automations.totalRuns)} runs in this period`} href="/admin/whatsapp/automations/">
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Succeeded" value={formatNumber(data.automations.statuses.SUCCEEDED)} /><MiniStat label="Failed" value={formatNumber(data.automations.statuses.FAILED)} /><MiniStat label="Waiting" value={formatNumber(data.automations.statuses.WAITING)} /><MiniStat label="Median duration" value={formatWhatsAppDuration(data.automations.duration.medianMs)} /></div>
          {data.automations.byWorkflow.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-rule text-ink-faint"><th className="pb-2 font-medium">Workflow</th><th className="pb-2 text-right font-medium">Runs</th><th className="pb-2 text-right font-medium">Success</th><th className="pb-2 text-right font-medium">Failed</th><th className="pb-2 text-right font-medium">Waiting</th></tr></thead><tbody>{data.automations.byWorkflow.map((workflow) => <tr key={workflow.id} className="border-b border-rule last:border-0"><td className="max-w-[280px] truncate py-3 font-medium text-ink">{workflow.name}</td><td className="py-3 text-right tabular-nums">{workflow.runs}</td><td className="py-3 text-right tabular-nums text-ledger">{workflow.succeeded}</td><td className="py-3 text-right tabular-nums text-rose-600">{workflow.failed}</td><td className="py-3 text-right tabular-nums">{workflow.waiting}</td></tr>)}</tbody></table></div> : <Empty>No automation runs in this period.</Empty>}
        </Section>
        <Section title="Automation failures" note="Exact stored run errors" href="/admin/whatsapp/automations/">
          {data.automations.recentFailures.length ? <ul className="mt-4 divide-y divide-rule">{data.automations.recentFailures.map((failure) => <li key={failure.id} className="py-3 first:pt-0"><div className="flex items-start justify-between gap-3"><p className="text-xs font-medium text-ink">{failure.automationName}</p>{failure.errorCode ? <span className="rounded-full bg-rose-50 px-2 py-0.5 font-mono text-[0.6rem] text-rose-700">{failure.errorCode}</span> : null}</div><p className="mt-1 text-xs leading-5 text-ink-faint">{failure.error}</p><p className="mt-1 text-[0.65rem] text-ink-faint">Trigger: {labelize(failure.trigger || "unknown")}</p></li>)}</ul> : <Empty>No failed automation runs in this period.</Empty>}
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Campaign performance" note="Delivery funnel from tracked campaign recipients" href="/admin/whatsapp/campaigns/">
          {data.campaigns.campaigns.length || data.campaigns.recipients ? <><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Sent" value={formatNumber(data.campaigns.sent)} /><MiniStat label="Delivered" value={formatWhatsAppAnalyticsPercent(data.campaigns.deliveryRate)} /><MiniStat label="Read" value={formatWhatsAppAnalyticsPercent(data.campaigns.readRate)} /><MiniStat label="Replied" value={formatWhatsAppAnalyticsPercent(data.campaigns.replyRate)} /></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-rule text-ink-faint"><th className="pb-2 font-medium">Campaign</th><th className="pb-2 text-right font-medium">Audience</th><th className="pb-2 text-right font-medium">Sent</th><th className="pb-2 text-right font-medium">Read</th><th className="pb-2 text-right font-medium">Replies</th></tr></thead><tbody>{data.campaigns.campaigns.map((campaign) => <tr key={campaign.id} className="border-b border-rule last:border-0"><td className="py-3"><p className="font-medium text-ink">{campaign.name}</p><p className="mt-0.5 text-[0.65rem] text-ink-faint">{labelize(campaign.status)}{campaign.template ? ` · ${campaign.template}` : ""}</p></td><td className="py-3 text-right tabular-nums">{campaign.audience}</td><td className="py-3 text-right tabular-nums">{campaign.sent}</td><td className="py-3 text-right tabular-nums">{campaign.read}</td><td className="py-3 text-right tabular-nums">{campaign.replied}</td></tr>)}</tbody></table></div></> : <Empty>No campaigns have been sent yet. This remains an empty state rather than pretending zero is performance.</Empty>}
        </Section>

        <Section title="WhatsApp Flow performance" note="Launches, completion and incomplete submissions" href="/admin/whatsapp/flows/">
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Launches" value={formatNumber(data.flows.launches)} /><MiniStat label="Completed" value={formatNumber(data.flows.completed)} /><MiniStat label="Incomplete" value={formatNumber(data.flows.incomplete)} /><MiniStat label="Completion" value={formatWhatsAppAnalyticsPercent(data.flows.completionRate)} /></div>
          {data.flows.byFlow.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-rule text-ink-faint"><th className="pb-2 font-medium">Flow</th><th className="pb-2 text-right font-medium">Launches</th><th className="pb-2 text-right font-medium">Completed</th><th className="pb-2 text-right font-medium">Rate</th></tr></thead><tbody>{data.flows.byFlow.map((flow) => <tr key={flow.id} className="border-b border-rule last:border-0"><td className="py-3"><p className="font-medium text-ink">{flow.name}</p><p className="mt-0.5 text-[0.65rem] text-ink-faint">{labelize(flow.status)}</p></td><td className="py-3 text-right tabular-nums">{flow.launches}</td><td className="py-3 text-right tabular-nums">{flow.completed}</td><td className="py-3 text-right tabular-nums">{formatWhatsAppAnalyticsPercent(flow.completionRate)}</td></tr>)}</tbody></table></div> : <Empty>No Flow launches in this period.</Empty>}
        </Section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section title="Call performance" note="High-level call KPIs; detailed call analytics remain available" href="/admin/whatsapp/calls/">
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Inbound" value={formatNumber(data.calls.inbound)} /><MiniStat label="Outbound" value={formatNumber(data.calls.outbound)} /><MiniStat label="Missed" value={formatNumber(data.calls.missed)} /><MiniStat label="Answer rate" value={formatWhatsAppAnalyticsPercent(data.calls.answerRate)} /></div><dl className="mt-4 divide-y divide-rule text-sm"><div className="flex justify-between py-2.5"><dt className="text-ink-faint">Average duration</dt><dd className="tabular-nums text-ink">{formatSeconds(data.calls.averageDurationSeconds)}</dd></div><div className="flex justify-between py-2.5"><dt className="text-ink-faint">Total talk time</dt><dd className="tabular-nums text-ink">{formatSeconds(data.calls.totalTalkSeconds)}</dd></div></dl>
        </Section>
        <Section title="Reporting integrity" note="What this dashboard deliberately does not pretend to know">
          <ul className="mt-4 space-y-3 text-xs leading-5 text-ink-faint"><li>• CRM stage charts are current-state snapshots until stage-change history contains old and new values.</li><li>• Agent metrics credit only stored team activity with a proven actor. Automated sends are not attributed to a human.</li><li>• Campaign empty states stay empty until real campaigns run.</li><li>• Revenue, ROI and Meta billing are not estimated from WhatsApp activity.</li></ul>
        </Section>
      </div>
    </div>
  );
}
