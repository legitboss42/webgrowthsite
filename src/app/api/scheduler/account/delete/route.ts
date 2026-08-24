import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  readAccountDeletionConfirmation,
  requestAccountDeletionAtBoundary,
} from "@/lib/scheduler/retention";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  const sameOrigin = isSameOriginMutation(request.headers.get("origin"), request.url);
  const result = await requestAccountDeletionAtBoundary({
    userId: session?.userId || null,
    sameOrigin,
    confirmation: session && sameOrigin ? await readAccountDeletionConfirmation(request) : "",
  }, {
    async requestAccountDeletion(userId) {
      return (await createSupabaseSchedulerStore()).requestAccountDeletion(userId);
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.redirect(new URL("/scheduler/?account-deletion=requested", request.url), 303);
  response.cookies.delete(SCHEDULER_SESSION_COOKIE);
  return response;
}
