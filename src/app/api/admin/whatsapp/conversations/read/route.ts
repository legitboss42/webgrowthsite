import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { conversationId?: unknown } | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
  if (!conversationId || conversationId.length > 128) {
    return NextResponse.json({ error: "Invalid conversation." }, { status: 400 });
  }
  if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) {
    return NextResponse.json({ error: "You do not have access to this conversation." }, { status: 403 });
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return NextResponse.json({ error: "WhatsApp storage is not configured." }, { status: 503 });
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error("Unable to mark WhatsApp conversation read", response.status);
    return NextResponse.json({ error: "Unable to mark this conversation as read." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
