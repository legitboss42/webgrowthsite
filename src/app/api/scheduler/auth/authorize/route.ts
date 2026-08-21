import { NextResponse } from "next/server";
import {
  buildSchedulerAuthorizeUrl,
  createSchedulerOAuthState,
  type SchedulerAuthMode,
  SCHEDULER_OAUTH_STATE_COOKIE,
} from "@/lib/scheduler/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode: SchedulerAuthMode = url.searchParams.get("mode") === "publishing" ? "publishing" : "login";
  const state = createSchedulerOAuthState(url.searchParams.get("returnTo") || "", mode);
  const response = NextResponse.redirect(buildSchedulerAuthorizeUrl(state.payload.state, mode));
  response.cookies.set(SCHEDULER_OAUTH_STATE_COOKIE, state.cookie, {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: 600,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
