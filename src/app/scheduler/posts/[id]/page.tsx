import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PostApprovalPanel from "@/components/scheduler/PostApprovalPanel";
import PostStatusPanel from "@/components/scheduler/PostStatusPanel";
import { getSchedulerConfig } from "@/lib/scheduler/config";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createPostPageClientProps } from "@/lib/scheduler/postPageProps";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const session = readSchedulerSession(jar.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) redirect("/scheduler/sign-in/");

  const { id } = await params;
  const db = createSchedulerSupabaseClient();
  const { data: post } = await db
    .from("scheduled_posts")
    .select("id,title,caption,status,scheduled_for,timezone,approval_id,terminal_at,user_failure_code,retry_eligible,next_retry_at")
    .eq("id", id)
    .eq("user_id", session.userId)
    .single();
  if (!post) notFound();
  const approvalRead = post.approval_id
    ? await db.from("post_approvals")
      .select("id,invalidated_at")
      .eq("id", post.approval_id)
      .eq("post_id", post.id)
      .eq("user_id", session.userId)
      .maybeSingle()
    : { data: null, error: null };
  if (approvalRead.error) notFound();
  let clientProps;
  try {
    clientProps = createPostPageClientProps(post, approvalRead.data);
  } catch {
    notFound();
  }

  const config = getSchedulerConfig();

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[.25em] text-[#62f5e6]">{post.status}</p>
      <h1 className="mt-3 font-serif text-4xl">{post.title || "Untitled post"}</h1>
      <p className="mt-5 whitespace-pre-wrap text-white/65">{post.caption}</p>
      <PostApprovalPanel post={clientProps.approvalPost} directPostEnabled={config.directPostEnabled} />
      <PostStatusPanel {...clientProps.statusPanel} />
    </main>
  );
}
