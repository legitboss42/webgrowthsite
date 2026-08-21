import { NextResponse } from "next/server";
import { SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/scheduler/", request.url), 303);
  response.cookies.delete(SCHEDULER_SESSION_COOKIE);
  return response;
}
