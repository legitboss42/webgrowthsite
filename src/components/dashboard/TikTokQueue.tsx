import Link from "next/link";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export type TikTokQueueFilter = "all" | "drafts" | "scheduled" | "published" | "attention";

const statusFilters: Record<Exclude<TikTokQueueFilter, "all">, string[]> = {
  drafts: ["DRAFT", "NEEDS_APPROVAL", "NEEDS_CONNECTION"],
  scheduled: ["SCHEDULED", "CLAIMED", "SUBMITTING", "PROCESSING"],
  published: ["PUBLISHED"],
  attention: ["FAILED_RETRYABLE", "NEEDS_ATTENTION"],
};

export async function loadTikTokQueue(userId: string, filter: TikTokQueueFilter = "all", limit = 50) {
  const db = createSchedulerSupabaseClient();
  let query = db.from("scheduled_posts").select("id,title,caption,status,scheduled_for,updated_at,user_failure_code,retry_eligible").eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
  if (filter !== "all") query = query.in("status", statusFilters[filter]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as Array<Record<string, unknown>>;
}

export default function TikTokQueue({ posts, emptyLabel = "No posts in this queue." }: { posts: Array<Record<string, unknown>>; emptyLabel?: string }) {
  if (!posts.length) return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-sm text-white/45">{emptyLabel}</div>;
  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"><ul>{posts.map((post) => <li key={String(post.id)} className="border-b border-white/10 p-5 last:border-0"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><Link href={`/scheduler/posts/${String(post.id)}/`} className="font-semibold text-white hover:text-emerald-300">{String(post.title || "Untitled post")}</Link><p className="mt-1 line-clamp-2 max-w-3xl text-sm text-white/45">{String(post.caption || "No caption")}</p>{post.scheduled_for ? <p className="mt-2 text-xs text-white/35">Scheduled: {new Date(String(post.scheduled_for)).toLocaleString()}</p> : null}</div><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60">{String(post.status)}</span></div>{post.user_failure_code ? <p className="mt-3 text-xs text-amber-200/75">Attention code: {String(post.user_failure_code)}</p> : null}</li>)}</ul></div>;
}
