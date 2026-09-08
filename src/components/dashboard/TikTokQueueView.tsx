import { cookies } from "next/headers";
import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardShell";
import TikTokQueue, { loadTikTokQueue, type TikTokQueueFilter } from "@/components/dashboard/TikTokQueue";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

const descriptions: Record<Exclude<TikTokQueueFilter, "all">, string> = {
  drafts: "Draft, approval and connection-gated posts waiting for a publishing decision.",
  scheduled: "Approved posts scheduled or currently moving through the TikTok publishing worker.",
  published: "Posts that reached a confirmed published state.",
  attention: "Retryable failures and posts that require manual attention before publishing can continue.",
};

export default async function TikTokQueueView({ filter, title }: { filter: Exclude<TikTokQueueFilter, "all">; title: string }) {
  const jar = await cookies();
  const session = readWebGrowthSessionFromCookieStore(jar)!;
  let posts: Array<Record<string, unknown>> = [];
  if (session.schedulerUserId) {
    try { posts = await loadTikTokQueue(session.schedulerUserId, filter); } catch {}
  }
  return <main><DashboardHeading eyebrow={`TikTok Publishing / ${title}`} title={title} description={descriptions[filter]} actions={<Link href="/dashboard/tiktok/new/" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-[#07100c]">Create post</Link>} /><nav className="mt-6 flex flex-wrap gap-2" aria-label="TikTok queues"><Link href="/dashboard/tiktok/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/65">All</Link>{[["Drafts","drafts"],["Scheduled","scheduled"],["Published","published"],["Attention","attention"]].map(([label,path]) => <Link key={path} href={`/dashboard/tiktok/${path}/`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/65">{label}</Link>)}</nav><section className="mt-6"><TikTokQueue posts={posts} /></section></main>;
}
