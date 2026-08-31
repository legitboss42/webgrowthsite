import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";

export const runtime = "nodejs";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const WARNING_MS = 2 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = (url.searchParams.get("conversationId") || "").trim().slice(0, 128);
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation is required." }, { status: 400 });
  }
  if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) {
    return NextResponse.json({ error: "You do not have access to this conversation." }, { status: 403 });
  }

  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_messages?select=message_timestamp&conversation_id=eq.${encodeURIComponent(conversationId)}&direction=eq.inbound&order=message_timestamp.desc&limit=1`,
  );

  const rawTimestamp = rows?.[0]?.message_timestamp;
  const receivedAt = typeof rawTimestamp === "string" ? Date.parse(rawTimestamp) : Number.NaN;
  if (!Number.isFinite(receivedAt)) {
    return NextResponse.json({
      ok: true,
      state: "unavailable",
      latestInboundAt: null,
      expiresAt: null,
      remainingMs: null,
    });
  }

  const now = Date.now();
  const expiresAt = receivedAt + WINDOW_MS;
  const remainingMs = expiresAt - now;
  const state = remainingMs <= 0 ? "closed" : remainingMs <= WARNING_MS ? "closing" : "open";

  return NextResponse.json({
    ok: true,
    state,
    latestInboundAt: new Date(receivedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    remainingMs: Math.max(0, remainingMs),
  });
}
