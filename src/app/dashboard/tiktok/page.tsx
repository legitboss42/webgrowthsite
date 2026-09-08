import Link from "next/link";
import { DashboardHeading, MetricCard } from "@/components/dashboard/DashboardShell";
import TikTokQueue, { loadTikTokQueue } from "@/components/dashboard/TikTokQueue";
import { requireWebGrowthDashboardSession } from "@/lib/dashboardSession";

export default async function DashboardTikTokPage() {
  const { session } = await requireWebGrowthDashboardSession();
  if (!session.schedulerUserId) return <main><DashboardHeading eyebrow="TikTok Publishing" title="Connect TikTok to activate publishing" description="Your Web Growth account is valid, but it does not yet have a linked scheduler identity." actions={<Link href="/api/scheduler/auth/authorize/?mode=login&returnTo=/dashboard/tiktok/" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07100c]">Connect TikTok</Link>} /><div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm text-white/55">Connecting TikTok adds publishing identity to this same Web Growth session. It does not create a second dashboard account.</div></main>;

  let posts: Array<Record<string, unknown>> = [];
  try { posts = await loadTikTokQueue(session.schedulerUserId, "all", 20); } catch {}
  const counts = {
    drafts: posts.filter((p) => ["DRAFT", "NEEDS_APPROVAL", "NEEDS_CONNECTION"].includes(String(p.status))).length,
    scheduled: posts.filter((p) => ["SCHEDULED", "CLAIMED", "SUBMITTING", "PROCESSING"].includes(String(p.status))).length,
    published: posts.filter((p) => String(p.status) === "PUBLISHED").length,
    attention: posts.filter((p) => ["FAILED_RETRYABLE", "NEEDS_ATTENTION"].includes(String(p.status))).length,
  };
  return <main>
    <DashboardHeading eyebrow="TikTok Publishing" title="Publishing queue" description="Manual posts and Content Automation output share this scheduler queue." actions={<Link href="/dashboard/tiktok/new/" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07100c]">Create post</Link>} />
    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Drafts" value={counts.drafts} /><MetricCard label="Scheduled" value={counts.scheduled} /><MetricCard label="Published" value={counts.published} /><MetricCard label="Needs attention" value={counts.attention} /></section>
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="TikTok queues">{[["Drafts","drafts"],["Scheduled","scheduled"],["Published","published"],["Attention","attention"]].map(([label,path]) => <Link key={path} href={`/dashboard/tiktok/${path}/`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/65 hover:text-white">{label}</Link>)}</nav>
    <section className="mt-6"><TikTokQueue posts={posts} emptyLabel="No TikTok posts have been created yet." /></section>
  </main>;
}
