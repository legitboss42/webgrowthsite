import { NextResponse } from "next/server";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type OwnerRouteDependencies = {
  cookies: () => Promise<{ get(name: string): { value: string } | undefined }>;
};

type SuspendRouteDependencies = OwnerRouteDependencies & {
  suspendUser: (userId: string, reason: string) => Promise<boolean>;
};

type RestoreRouteDependencies = OwnerRouteDependencies & {
  restoreUser: (userId: string) => Promise<boolean>;
};

async function authorizeOwnerMutation(request: Request, dependencies: OwnerRouteDependencies) {
  const session = readSchedulerSession((await dependencies.cookies()).get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isOwnerOpenId(session.openId)) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  return null;
}

export function createSuspendUserHandler(dependencies: SuspendRouteDependencies) {
  return async function POST(request: Request) {
    const denied = await authorizeOwnerMutation(request, dependencies);
    if (denied) return denied;
    const form = await request.formData();
    const userId = String(form.get("userId") || "");
    const reason = String(form.get("reason") || "").trim();
    if (!uuid.test(userId) || !reason) return NextResponse.json({ error: "A valid scheduler user ID and reason are required." }, { status: 400 });
    if (!await dependencies.suspendUser(userId, reason)) return NextResponse.json({ error: "Account could not be suspended." }, { status: 404 });
    return NextResponse.redirect(new URL("/scheduler/admin/?operation=suspended", request.url), 303);
  };
}

export function createRestoreUserHandler(dependencies: RestoreRouteDependencies) {
  return async function POST(request: Request) {
    const denied = await authorizeOwnerMutation(request, dependencies);
    if (denied) return denied;
    const form = await request.formData();
    const userId = String(form.get("userId") || "");
    if (!uuid.test(userId)) return NextResponse.json({ error: "A valid scheduler user ID is required." }, { status: 400 });
    if (!await dependencies.restoreUser(userId)) return NextResponse.json({ error: "Account could not be restored." }, { status: 404 });
    return NextResponse.redirect(new URL("/scheduler/admin/?operation=restored", request.url), 303);
  };
}
