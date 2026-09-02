import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  createWorkspacePasswordSessionValue,
  getWorkspacePasswordCookieName,
  getWorkspacePasswordTtlSeconds,
  readWorkspacePasswordSessionFromCookieStore,
} from "@/lib/whatsapp/passwordAuth";
import { findWhatsAppTeamMemberByEmail } from "@/lib/whatsapp/teamAccess";
import { isWhatsAppWorkspaceId, WHATSAPP_WORKSPACE_COOKIE } from "@/lib/whatsapp/workspaceModel";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const access = await getWhatsAppWorkspaceAccess(cookieStore);
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const body = await request.json().catch(() => null) as { workspaceId?: unknown } | null;
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!isWhatsAppWorkspaceId(workspaceId)) return NextResponse.json({ error: "Invalid workspace." }, { status: 400 });
  const allowed = access.availableWorkspaces.some((workspace) => workspace.id === workspaceId && (workspace.status === "ACTIVE" || access.platformAdmin));
  if (!allowed) return NextResponse.json({ error: "You do not have access to that workspace." }, { status: 403 });

  const targetMember = access.platformAdmin
    ? null
    : await findWhatsAppTeamMemberByEmail(access.email, { activeOnly: true, workspaceId });
  if (!access.platformAdmin && !targetMember) return NextResponse.json({ error: "Your membership in that workspace is not active." }, { status: 403 });
  const targetRole = access.platformAdmin ? "owner" : targetMember!.role;

  const response = NextResponse.json({ ok: true, workspaceId, role: targetRole });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(WHATSAPP_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });

  // A password session carries a signed copy of the role only as a compatibility
  // aid for legacy synchronous Owner gates. Refresh it on every workspace switch so
  // an Owner role from one tenant can never be carried into another tenant.
  const passwordSession = readWorkspacePasswordSessionFromCookieStore(cookieStore);
  if (passwordSession) {
    response.cookies.set({
      name: getWorkspacePasswordCookieName(),
      value: createWorkspacePasswordSessionValue({
        userId: passwordSession.userId,
        email: passwordSession.email,
        fullName: targetMember?.displayName || passwordSession.fullName,
        workspaceId,
        workspaceRole: targetRole,
      }),
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: getWorkspacePasswordTtlSeconds(),
    });
  }
  return response;
}
