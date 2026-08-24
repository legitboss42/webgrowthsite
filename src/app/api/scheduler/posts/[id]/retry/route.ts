import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  createRetryRpcStore,
  createRetryClientAtBoundary,
  retryPostAtBoundary,
  type RetryAttempt,
  type RetryRpcClient,
} from "@/lib/scheduler/retry";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { id } = await context.params;
  const clientBoundary = createRetryClientAtBoundary(createSchedulerSupabaseClient);
  if (!clientBoundary.ok) {
    return NextResponse.json({ error: clientBoundary.error }, { status: clientBoundary.status });
  }
  const supabase = clientBoundary.client;
  const { data: post, error: postError } = await supabase.from("scheduled_posts")
    .select("id,user_id,status,approval_id,retry_eligible,terminal_at")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (postError) return NextResponse.json({ error: "Unable to verify retry eligibility." }, { status: 502 });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const [{ data: user, error: userError }, { data: approval, error: approvalError }, attemptRead] = await Promise.all([
    supabase.from("scheduler_users")
      .select("status,suspended_at,deletion_requested_at,terms_version,privacy_version")
      .eq("id", session.userId)
      .maybeSingle(),
    post.approval_id
      ? supabase.from("post_approvals")
        .select("id,post_id,user_id,fingerprint,invalidated_at")
        .eq("id", post.approval_id)
        .eq("post_id", post.id)
        .eq("user_id", session.userId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    post.approval_id
      ? supabase.from("publish_attempts")
        .select("id,approval_id,request_fingerprint,attempt_number,status,publish_id,error_code")
        .eq("post_id", post.id)
        .eq("approval_id", post.approval_id)
        .order("attempt_number", { ascending: false })
        .limit(1)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (userError || approvalError || attemptRead.error) {
    return NextResponse.json({ error: "Unable to verify retry eligibility." }, { status: 502 });
  }
  const currentAttempt = attemptRead.data?.[0];
  const result = await retryPostAtBoundary(
    createRetryRpcStore(supabase as unknown as RetryRpcClient),
    {
      launch: getSchedulerLaunchState(),
      userId: session.userId,
      user: {
        status: typeof user?.status === "string" ? user.status : null,
        suspendedAt: typeof user?.suspended_at === "string" ? user.suspended_at : null,
        deletionRequestedAt: typeof user?.deletion_requested_at === "string" ? user.deletion_requested_at : null,
        termsVersion: typeof user?.terms_version === "string" ? user.terms_version : null,
        privacyVersion: typeof user?.privacy_version === "string" ? user.privacy_version : null,
      },
      post: {
        id: post.id,
        userId: post.user_id,
        status: post.status,
        approvalId: post.approval_id,
        retryEligible: post.retry_eligible === true,
        terminalAt: typeof post.terminal_at === "string" ? post.terminal_at : null,
      },
      approval: approval ? {
        id: approval.id,
        postId: approval.post_id,
        userId: approval.user_id,
        fingerprint: approval.fingerprint,
        invalidatedAt: typeof approval.invalidated_at === "string" ? approval.invalidated_at : null,
      } : null,
      attempt: currentAttempt ? {
        id: currentAttempt.id,
        approvalId: currentAttempt.approval_id,
        requestFingerprint: currentAttempt.request_fingerprint,
        attemptNumber: currentAttempt.attempt_number,
        status: currentAttempt.status,
        publishId: typeof currentAttempt.publish_id === "string" ? currentAttempt.publish_id : null,
        errorCode: typeof currentAttempt.error_code === "string" ? currentAttempt.error_code : null,
      } satisfies RetryAttempt : null,
    },
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({
    postId: result.postId,
    attemptNumber: result.attemptNumber,
    status: "SCHEDULED",
  });
}
