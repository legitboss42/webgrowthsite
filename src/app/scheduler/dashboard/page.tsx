import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import TermsAcceptance from "@/components/scheduler/TermsAcceptance";
import { hasCurrentLegalAcceptance, isActiveSchedulerUser } from "@/lib/scheduler/legal";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export default async function DashboardPage() {
  const jar = await cookies();
  const session = readSchedulerSession(jar.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) redirect("/scheduler/sign-in/");

  const db = createSchedulerSupabaseClient();
  const { data: user } = await db.from("scheduler_users")
    .select("status,terms_version,privacy_version,suspended_at,deletion_requested_at")
    .eq("id", session.userId).single();
  if (!user) redirect("/scheduler/sign-in/");

  const active = isActiveSchedulerUser({
    status: user.status,
    suspendedAt: user.suspended_at,
    deletionRequestedAt: user.deletion_requested_at,
  });
  const accepted = hasCurrentLegalAcceptance({
    termsVersion: user.terms_version,
    privacyVersion: user.privacy_version,
  });

  if (!active) {
    return <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">Creator dashboard</p><h1 className="mt-3 font-serif text-4xl">Account access is unavailable</h1><p className="mt-5 max-w-xl leading-7 text-white/70">This scheduler account is suspended or pending deletion. You can sign in for account support, but uploading, reconnecting, approving, scheduling, and publishing are unavailable.</p></main>;
  }

  if (!accepted) {
    return <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">Creator dashboard</p><h1 className="mt-3 font-serif text-4xl">One more step before scheduling</h1><TermsAcceptance /></main>;
  }

  const { data: posts } = await db.from("scheduled_posts")
    .select("id,title,status,scheduled_for,updated_at").eq("user_id", session.userId)
    .order("updated_at", { ascending: false }).limit(20);
  return <main className="mx-auto max-w-7xl px-5 py-12"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">Creator dashboard</p><h1 className="mt-3 font-serif text-4xl">Publishing queue</h1></div><Link href="/scheduler/new/" className="rounded-full bg-[#ff5269] px-5 py-3 font-bold text-white">Create post</Link></div>
    <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">{posts?.length ? posts.map((post) => <Link key={post.id} href={`/scheduler/posts/${post.id}/`} className="grid gap-2 border-b border-white/10 p-5 last:border-0 sm:grid-cols-[1fr_auto]"><span><strong>{post.title || "Untitled post"}</strong><small className="mt-1 block text-white/45">{post.scheduled_for ? new Date(post.scheduled_for).toLocaleString() : "Not scheduled"}</small></span><span className="text-sm text-[#62f5e6]">{post.status}</span></Link>) : <div className="p-10 text-center text-white/50">Your first approved post will appear here.</div>}</div></main>;
}
