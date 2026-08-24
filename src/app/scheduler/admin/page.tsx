import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";
import { createSupabaseSchedulerOperations, formatWorkerHeartbeatAge, type SchedulerOwnerOverview } from "@/lib/scheduler/operations";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

const gates = [
  ["Public enrollment", "publicEnrollment"], ["New scheduling", "newScheduling"], ["Video uploads", "video"],
  ["Direct Post", "directPost"], ["Public visibility", "publicPosting"],
] as const;

function metric(label: string, value: number | string) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-[.16em] text-white/50">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}

export default async function AdminPage() {
  const jar = await cookies();
  const session = readSchedulerSession(jar.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session || !isOwnerOpenId(session.openId)) notFound();
  let overview: SchedulerOwnerOverview | null = null;
  try { overview = await (await createSupabaseSchedulerOperations()).getOwnerOverview(); } catch { overview = null; }
  const launch = getSchedulerLaunchState();
  return <main className="mx-auto max-w-7xl px-5 py-12">
    <p className="text-xs uppercase tracking-[.25em] text-[#ff5269]">Owner operations</p><h1 className="mt-3 font-serif text-4xl">Scheduler health</h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">Aggregate monitoring only. Creator tokens, captions, media, and private workspace content are never displayed here.</p>
    {!overview ? <section className="mt-9 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-amber-100">Operational aggregates are currently unavailable. No health or delivery claim is shown until the database query succeeds.</section> : <>
      <section className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metric("Total users", overview.users.total)}{metric("Active users", overview.users.active)}{metric("Suspended users", overview.users.suspended)}{metric("Reconnect required", overview.reconnectRequired)}</section>
      <section className="mt-9"><h2 className="text-lg font-semibold">Workflow counts</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metric("Scheduled", overview.workflow.scheduled)}{metric("Overdue", overview.workflow.overdue)}{metric("Submitting", overview.workflow.submitting)}{metric("Processing", overview.workflow.processing)}{metric("Published", overview.workflow.published)}{metric("Failed", overview.workflow.failed)}{metric("Cancelled", overview.workflow.cancelled)}{metric("Cleanup backlog", overview.cleanup.pending)}</div></section>
      <section className="mt-9 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">Worker heartbeat</h2><p className="mt-2 text-sm text-white/65">Last successful cycle: {formatWorkerHeartbeatAge(overview.heartbeat.lastSucceededAt)}</p><p className="mt-1 text-sm text-white/65">Last started: {overview.heartbeat.lastStartedAt || "Not recorded"}</p><p className="mt-1 text-sm text-white/65">Latest safe code: {overview.heartbeat.lastErrorCode || "None"}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">Cleanup</h2><p className="mt-2 text-sm text-white/65">Awaiting cleanup: {overview.cleanup.pending}</p><p className="mt-1 text-sm text-white/65">Overdue deletion: {overview.cleanup.overdue}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">Failure categories</h2><ul className="mt-2 space-y-1 text-sm text-white/65">{Object.entries(overview.failureCategories).length ? Object.entries(overview.failureCategories).map(([code, total]) => <li key={code}>{code}: {total}</li>) : <li>No classified failures.</li>}</ul></div>
      </section>
    </>}
    <section className="mt-9"><h2 className="text-lg font-semibold">Current feature gates</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{gates.map(([label, key]) => metric(label, launch[key] ? "Enabled" : "Disabled"))}</div></section>
    <section className="mt-9 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="font-semibold">Account safety controls</h2><p className="mt-2 text-sm leading-6 text-white/65">Suspension and restoration use separate owner-only, same-origin endpoints. Enter only a scheduler user ID supplied through an authorized support process; this dashboard does not browse creator accounts or media.</p><div className="mt-4 grid gap-5 lg:grid-cols-2"><form action="/api/scheduler/admin/suspend-user/" method="post" className="grid gap-3 rounded-xl border border-white/10 p-4"><label className="text-sm">Scheduler user ID<input required name="userId" className="mt-1 block w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2" /></label><label className="text-sm">Reason<input required name="reason" maxLength={240} className="mt-1 block w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2" /></label><button className="w-fit rounded-lg bg-[#ff5269] px-4 py-2 text-sm font-semibold text-black">Suspend account</button></form><form action="/api/scheduler/admin/restore-user/" method="post" className="grid gap-3 rounded-xl border border-white/10 p-4"><label className="text-sm">Scheduler user ID<input required name="userId" className="mt-1 block w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2" /></label><button className="w-fit rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold">Restore account</button></form></div></section>
  </main>;
}
