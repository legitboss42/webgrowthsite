import { NextResponse } from "next/server";
import { SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.redirect(new URL("/scheduler/", request.url), 303);
  response.cookies.delete(SCHEDULER_SESSION_COOKIE);
  return response;
}
