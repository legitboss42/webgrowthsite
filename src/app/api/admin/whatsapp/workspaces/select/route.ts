import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
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

  const response = NextResponse.json({ ok: true, workspaceId });
  response.cookies.set(WHATSAPP_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/whatsapp",
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}
