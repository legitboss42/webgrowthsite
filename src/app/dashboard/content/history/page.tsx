import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export default async function DashboardContentHistoryPage() {
  let jobs: Record<string, unknown>[] = [];
  let publications: Record<string, unknown>[] = [];
  try {
    const store = createSocialAutomationStore();
    jobs = await store.listRecentJobs(50);
    const ids = jobs.map((job) => String(job.id || "")).filter(Boolean);
    if (ids.length) {
      const db = createSchedulerSupabaseClient();
      const result = await db.from("social_publications").select("job_id,platform,status,external_url,last_error_message,updated_at").in("job_id", ids);
      if (!result.error) publications = (result.data || []) as Record<string, unknown>[];
    }
  } catch {}
  const byJob = new Map<string, Record<string, unknown>[]>();
  for (const item of publications) {
    const key = String(item.job_id || "");
    byJob.set(key, [...(byJob.get(key) || []), item]);
  }
  return <main>
    <DashboardHeading eyebrow="Content Automation / History" title="Automation history" description="Every article automation job and its Facebook, Instagram and TikTok handoff state, without merging the underlying publication engines." />
    <div className="mt-8 space-y-3">
      {jobs.length ? jobs.map((job) => <article key={String(job.id)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{String(job.article_slug || "Untitled article")}</h2><p className="mt-1 text-xs text-white/40">{String(job.created_at || "")}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{String(job.status || "QUEUED")}</span></div><div className="mt-4 flex flex-wrap gap-2">{(byJob.get(String(job.id)) || []).map((pub, index) => <span key={`${String(pub.platform)}-${index}`} className="rounded-lg bg-black/25 px-3 py-2 text-xs text-white/60">{String(pub.platform)} · {String(pub.status)}</span>)}</div></article>) : <p className="rounded-2xl border border-white/10 p-6 text-sm text-white/45">No automation history is available yet.</p>}
    </div>
  </main>;
}
