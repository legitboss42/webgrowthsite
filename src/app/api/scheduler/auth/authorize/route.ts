import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canStartSchedulerOAuth } from "@/lib/scheduler/legal";
import { getSchedulerLaunchState } from "@/lib/scheduler/launch";
import {
  buildSchedulerAuthorizeUrl,
  createSchedulerOAuthState,
  type SchedulerAuthMode,
  SCHEDULER_OAUTH_STATE_COOKIE,
} from "@/lib/scheduler/oauth";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let session = null;
  try {
    const cookieStore = await cookies();
    session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  } catch {
    session = null;
  }
  if (!canStartSchedulerOAuth(getSchedulerLaunchState(), session?.openId || null)) {
    const response = NextResponse.json({ error: "Scheduler enrollment is not available yet." }, { status: 503 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const mode: SchedulerAuthMode = url.searchParams.get("mode") === "publishing" ? "publishing" : "login";
  const state = createSchedulerOAuthState(url.searchParams.get("returnTo") || "", mode);
  const response = NextResponse.redirect(buildSchedulerAuthorizeUrl(state.payload.state, mode));
  response.cookies.set(SCHEDULER_OAUTH_STATE_COOKIE, state.cookie, {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: 600,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
