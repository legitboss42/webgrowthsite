import Link from "next/link";
import { cookies } from "next/headers";
import { DashboardHeading, MetricCard } from "@/components/dashboard/DashboardShell";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { canonicalContentAutomationAccess } from "@/lib/unifiedAuthorization";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export default async function DashboardContentPage() {
  const jar = await cookies();
  const session = readWebGrowthSessionFromCookieStore(jar)!;
  const allowed = canonicalContentAutomationAccess(session);
  if (!allowed) return <main><DashboardHeading eyebrow="Content Automation" title="Admin access required" description="The unified login identifies you, but Content Automation retains its existing admin-only permission boundary." /><div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm text-amber-100/80">This account is not configured as a Content Automation administrator.</div></main>;

  let jobs: Record<string, unknown>[] = [];
  let settings: Record<string, unknown> | null = null;
  let connection: Awaited<ReturnType<ReturnType<typeof createSocialAutomationStore>["getConnectionSummary"]>> = null;
  try {
    const store = createSocialAutomationStore();
    [jobs, settings, connection] = await Promise.all([store.listRecentJobs(10), store.getSettings(), store.getConnectionSummary("META")]);
  } catch {}
  const attention = jobs.filter((job) => String(job.status) === "NEEDS_ATTENTION").length;

  return <main>
    <DashboardHeading eyebrow="Content Automation" title="Blog-to-social pipeline" description="New articles stay in the Content Automation engine, but their TikTok output now feeds the same publishing queue used by manual posts." actions={<div className="flex gap-2"><Link href="/dashboard/content/articles/" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75">Articles</Link><Link href="/dashboard/content/history/" className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-[#07100c]">History</Link></div>} />
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Recent jobs" value={jobs.length} />
      <MetricCard label="Needs attention" value={attention} />
      <MetricCard label="Automation" value={settings?.enabled === true ? "Enabled" : settings ? "Paused" : "—"} />
      <MetricCard label="Meta connection" value={connection && !connection.reconnectRequired ? "Connected" : connection ? "Reconnect" : "Not connected"} />
    </section>
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="border-b border-white/10 px-5 py-4"><h2 className="font-semibold">Recent automation jobs</h2></div>
      {jobs.length ? <ul>{jobs.map((job) => <li key={String(job.id)} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 last:border-0"><div><p className="font-medium">{String(job.article_slug || "Untitled article")}</p><p className="mt-1 text-xs text-white/40">{String(job.created_at || "")}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{String(job.status || "QUEUED")}</span></li>)}</ul> : <p className="p-6 text-sm text-white/45">No automation jobs are available yet.</p>}
    </section>
    <div className="mt-6"><Link href="/admin/content-automation/" className="text-sm font-semibold text-emerald-300">Open advanced Content Automation controls →</Link></div>
  </main>;
}
