import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { isPostStatus } from "@/lib/scheduler/types";

const SAFE_FAILURE_CODES = new Set([
  "TIKTOK_RECONNECT_REQUIRED",
  "TIKTOK_MEDIA_REJECTED",
  "MEDIA_VALIDATION_STALE",
  "UNSUPPORTED_MEDIA",
  "CREATOR_SETTINGS_CHANGED",
  "PRIVACY_MISMATCH",
  "TIKTOK_QUOTA_EXCEEDED",
  "DAILY_POST_LIMIT_REACHED",
  "PUBLISH_RETRY_SCHEDULED",
  "PUBLISH_RECONCILIATION_REQUIRED",
  "TIKTOK_PUBLISH_FAILED",
]);

function sanitizeFailureCode(value: unknown) {
  return typeof value === "string" && SAFE_FAILURE_CODES.has(value) ? value : null;
}

function nextPollAfterMs(status: string) {
  return ["CLAIMED", "SUBMITTING", "PROCESSING"].includes(status) ? 5_000 : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  let db;
  try {
    db = createSchedulerSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Unable to load publishing status." }, { status: 502 });
  }
  const { data: post, error } = await db
    .from("scheduled_posts")
    .select("status,terminal_at,user_failure_code,retry_eligible")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load publishing status." }, { status: 502 });
  if (!post || !isPostStatus(post.status)) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const failureCode = sanitizeFailureCode(post.user_failure_code);
  return NextResponse.json({
    status: post.status,
    publishedAt: post.status === "PUBLISHED" && typeof post.terminal_at === "string" ? post.terminal_at : null,
    failureCode,
    retryEligible: post.retry_eligible === true,
    nextPollAfterMs: nextPollAfterMs(post.status),
  });
}
