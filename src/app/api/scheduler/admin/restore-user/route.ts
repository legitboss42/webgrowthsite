import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isOwnerOpenId } from "@/lib/scheduler/config";
import { createSupabaseSchedulerOperations } from "@/lib/scheduler/operations";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RestoreRouteDependencies = {
  cookies: () => Promise<{ get(name: string): { value: string } | undefined }>;
  restoreUser: (userId: string) => Promise<boolean>;
};

export function createRestoreUserHandler(dependencies: RestoreRouteDependencies) {
  return async function POST(request: Request) {
    const session = readSchedulerSession((await dependencies.cookies()).get(SCHEDULER_SESSION_COOKIE)?.value);
    if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!isOwnerOpenId(session.openId)) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const form = await request.formData();
    const userId = String(form.get("userId") || "");
    if (!uuid.test(userId)) return NextResponse.json({ error: "A valid scheduler user ID is required." }, { status: 400 });
    if (!await dependencies.restoreUser(userId)) return NextResponse.json({ error: "Account could not be restored." }, { status: 404 });
    return NextResponse.redirect(new URL("/scheduler/admin/?operation=restored", request.url), 303);
  };
}

export const POST = createRestoreUserHandler({
  cookies,
  async restoreUser(userId) { return (await createSupabaseSchedulerOperations()).restoreUser(userId); },
});
