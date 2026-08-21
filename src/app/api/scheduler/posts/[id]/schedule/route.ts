import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canTransitionPost, isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
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
  const { data: post } = await supabase.from("scheduled_posts").select("id,status,approval_id")
    .eq("id", id).eq("user_id", session.userId).single();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  if (body?.action === "cancel") {
    if (!canTransitionPost(post.status as PostStatus, "CANCELLED")) {
      return NextResponse.json({ error: "This post can no longer be cancelled." }, { status: 409 });
    }
    await supabase.from("scheduled_posts").update({ status: "CANCELLED" }).eq("id", id).eq("user_id", session.userId);
    return NextResponse.json({ postId: id, status: "CANCELLED" });
  }

  if (body?.action === "schedule") {
    if (!post.approval_id) return NextResponse.json({ error: "Approval is required." }, { status: 409 });
    const scheduledFor = new Date(String(body.scheduledFor || ""));
    const timezone = String(body.timezone || "");
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now() || !timezone) {
      return NextResponse.json({ error: "Choose a future time and timezone." }, { status: 400 });
    }
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch {
      return NextResponse.json({ error: "Timezone is invalid." }, { status: 400 });
    }
    const { data: allowed } = await supabase.rpc("reserve_tiktok_daily_slot", {
      p_user_id: session.userId, p_now: new Date().toISOString(), p_limit: 3,
    });
    if (!allowed) return NextResponse.json({ error: "Daily beta scheduling limit reached." }, { status: 429 });
    await supabase.from("scheduled_posts").update({
      status: "SCHEDULED", scheduled_for: scheduledFor.toISOString(), timezone,
    }).eq("id", id).eq("user_id", session.userId);
    return NextResponse.json({ postId: id, status: "SCHEDULED", scheduledFor: scheduledFor.toISOString() });
  }

  return NextResponse.json({ error: "Unsupported schedule action." }, { status: 400 });
}

