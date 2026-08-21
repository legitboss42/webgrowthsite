import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await (await createSupabaseSchedulerStore()).disconnectUser(session.userId);
  return NextResponse.redirect(new URL("/scheduler/settings/?disconnected=1", request.url), 303);
}
