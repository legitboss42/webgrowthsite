import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { readOwnedPostStatus } from "@/lib/scheduler/statusAccess";
import { createPublicStatusSnapshot } from "@/lib/scheduler/statusSnapshot";

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
  const { data: post, error } = await readOwnedPostStatus(db as unknown as import("@/lib/scheduler/statusAccess").OwnedStatusClient, id, session.userId);
  if (error) return NextResponse.json({ error: "Unable to load publishing status." }, { status: 502 });
  const snapshot = post ? createPublicStatusSnapshot(post) : null;
  if (!snapshot) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json(snapshot);
}
