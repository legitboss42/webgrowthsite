import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canTransitionPost, isSameOriginMutation } from "@/lib/scheduler/policy";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";
import { schedulePublicPostAtBoundary } from "@/lib/scheduler/quotas";
import { parseOffsetScheduleInstant } from "@/lib/scheduler/scheduleTime";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import type { PostStatus } from "@/lib/scheduler/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const supabase = createSchedulerSupabaseClient();

  if (body?.action === "cancel") {
    const { data: post, error: postError } = await supabase.from("scheduled_posts").select("id,status")
      .eq("id", id).eq("user_id", session.userId).maybeSingle();
    if (postError) return NextResponse.json({ error: "Unable to read post." }, { status: 502 });
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (!canTransitionPost(post.status as PostStatus, "CANCELLED")) {
      return NextResponse.json({ error: "This post can no longer be cancelled." }, { status: 409 });
    }
    await supabase.from("scheduled_posts").update({ status: "CANCELLED" }).eq("id", id).eq("user_id", session.userId);
    return NextResponse.json({ postId: id, status: "CANCELLED" });
  }

  if (body?.action === "schedule") {
    const schedule = parseOffsetScheduleInstant({ scheduledFor: body.scheduledFor, localTime: body.localTime, timezone: body.timezone, nowIso: new Date().toISOString() });
    if (!schedule.ok) return NextResponse.json({ error: schedule.error }, { status: schedule.status });
    const { data: user, error: userError } = await supabase.from("scheduler_users")
      .select("status,suspended_at,deletion_requested_at,terms_version,privacy_version")
      .eq("id", session.userId).maybeSingle();
    if (userError) return NextResponse.json({ error: "Unable to verify scheduler access." }, { status: 502 });
    const result = await schedulePublicPostAtBoundary(await createSupabaseSchedulerStore(), {
      launch: getSchedulerLaunchState(),
      user: {
        status: typeof user?.status === "string" ? user.status : null,
        suspendedAt: typeof user?.suspended_at === "string" ? user.suspended_at : null,
        deletionRequestedAt: typeof user?.deletion_requested_at === "string" ? user.deletion_requested_at : null,
        termsVersion: typeof user?.terms_version === "string" ? user.terms_version : null,
        privacyVersion: typeof user?.privacy_version === "string" ? user.privacy_version : null,
      },
      reservation: {
        userId: session.userId,
        postId: id,
        scheduledForIso: schedule.scheduledForIso,
        timezone: schedule.timezone,
        nowIso: new Date().toISOString(),
      },
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ postId: id, status: "SCHEDULED", scheduledFor: result.scheduledFor });
  }

  return NextResponse.json({ error: "Unsupported schedule action." }, { status: 400 });
}

