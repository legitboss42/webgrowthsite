import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import { requireContentAutomationDashboardAdmin } from "@/lib/dashboardSession";
import { getPublicPosts } from "@/lib/posts";

export default async function DashboardContentArticlesPage() {
  await requireContentAutomationDashboardAdmin();
  const posts = getPublicPosts();
  return <main>
    <DashboardHeading eyebrow="Content Automation / Articles" title="Published article sources" description="These Web Growth articles are eligible source content for the automation pipeline. The publishing engine remains separate from the dashboard." />
    <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      {posts.length ? <ul>{posts.map((post) => <li key={post.slug} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 last:border-0"><div><p className="font-medium">{post.title}</p><p className="mt-1 text-xs text-white/40">/{post.slug}</p></div><div className="flex gap-3"><Link href={`/blog/${post.slug}/`} className="text-sm text-white/60 hover:text-white">View article</Link><Link href={`/scheduler/new/?article=${encodeURIComponent(post.slug)}`} className="text-sm font-semibold text-emerald-300">Create TikTok post</Link></div></li>)}</ul> : <p className="p-6 text-sm text-white/45">No published articles were found.</p>}
    </div>
  </main>;
}
