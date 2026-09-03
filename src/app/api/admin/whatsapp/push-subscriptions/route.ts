import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { deleteWhatsAppPushSubscription, saveWhatsAppPushSubscription } from "@/lib/whatsapp/webPush";

export const runtime = "nodejs";

async function guard(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) } as const;
  return { access } as const;
}

function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export async function POST(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }
  const endpoint = body.endpoint;
  const keys = body.keys && typeof body.keys === "object" && !Array.isArray(body.keys) ? body.keys as Record<string, unknown> : null;
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;
  if (!validEndpoint(endpoint) || typeof p256dh !== "string" || typeof auth !== "string" || !p256dh || !auth) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  const result = await saveWhatsAppPushSubscription({ workspaceId: guarded.access.workspaceId, endpoint, p256dh: p256dh.slice(0, 512), auth: auth.slice(0, 512), userAgent: request.headers.get("user-agent") || undefined });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guarded = await guard(request);
  if ("response" in guarded) return guarded.response;
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }
  if (!validEndpoint(body.endpoint)) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  await deleteWhatsAppPushSubscription(body.endpoint, guarded.access.workspaceId);
  return NextResponse.json({ ok: true });
}
