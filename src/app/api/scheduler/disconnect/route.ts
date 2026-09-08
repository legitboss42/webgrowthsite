import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSchedulerSessionFromCookieStore } from "@/lib/scheduler/session";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSessionFromCookieStore(cookieStore);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  try {
    await (await createSupabaseSchedulerStore()).disconnectUser(session.userId);
    return NextResponse.redirect(new URL("/dashboard/connections/?disconnected=tiktok", request.url), 303);
  } catch {
    return NextResponse.json({ error: "Unable to disconnect TikTok publishing safely." }, { status: 502 });
  }
}
