import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CURRENT_SCHEDULER_PRIVACY_VERSION, CURRENT_SCHEDULER_TERMS_VERSION, isActiveSchedulerUser } from "@/lib/scheduler/legal";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";

const ACCEPTANCE_KEYS = ["action", "termsVersion", "privacyVersion", "retentionAcknowledged", "contentResponsibilityAcknowledged"] as const;

function isExactAcceptanceBody(body: Record<string, unknown> | null): boolean {
  if (!body || Object.keys(body).length !== ACCEPTANCE_KEYS.length) return false;
  if (!ACCEPTANCE_KEYS.every((key) => Object.prototype.hasOwnProperty.call(body, key))) return false;
  return body.action === "accept" && body.termsVersion === CURRENT_SCHEDULER_TERMS_VERSION && body.privacyVersion === CURRENT_SCHEDULER_PRIVACY_VERSION && body.retentionAcknowledged === true && body.contentResponsibilityAcknowledged === true;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!isExactAcceptanceBody(body)) return NextResponse.json({ error: "Invalid acceptance request." }, { status: 400 });

  const store = await createSupabaseSchedulerStore();
  const user = await store.getUser(session.userId);
  if (!user || !isActiveSchedulerUser({ status: typeof user.status === "string" ? user.status : null, suspendedAt: typeof user.suspended_at === "string" ? user.suspended_at : null, deletionRequestedAt: typeof user.deletion_requested_at === "string" ? user.deletion_requested_at : null })) {
    return NextResponse.json({ error: "Active scheduler access is required." }, { status: 403 });
  }
  await store.acceptLegalAcceptance(session.userId, { termsVersion: CURRENT_SCHEDULER_TERMS_VERSION, privacyVersion: CURRENT_SCHEDULER_PRIVACY_VERSION });
  return NextResponse.json({ accepted: true });
}
