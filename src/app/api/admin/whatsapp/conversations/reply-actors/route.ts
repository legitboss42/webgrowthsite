import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";

export const runtime = "nodejs";

type ReplyActor = {
  displayName: string;
  memberId?: string | null;
};

function cleanText(value: unknown, max = 320) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = cleanText(url.searchParams.get("conversationId"), 80);
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation id is required." }, { status: 400 });
  }

  if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) {
    return NextResponse.json({ error: "You do not have access to this conversation." }, { status: 403 });
  }

  const [activityRows, memberRows] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_team_activity?conversation_id=eq.${encodeURIComponent(conversationId)}&event_type=eq.conversation_reply_sent&select=actor_member_id,actor_email,metadata,created_at&order=created_at.asc`,
    ),
    readWhatsAppRows<Record<string, unknown>>(
      "whatsapp_team_members?select=id,google_email,display_name,active&order=display_name.asc",
    ),
  ]);

  if (!activityRows || !memberRows) {
    return NextResponse.json({ error: "Reply attribution could not be loaded." }, { status: 503 });
  }

  const memberById = new Map<string, { displayName: string; email: string }>();
  const memberByEmail = new Map<string, { id: string; displayName: string }>();

  for (const row of memberRows) {
    const id = cleanText(row.id, 80);
    const email = cleanText(row.google_email, 254).toLowerCase();
    const displayName = cleanText(row.display_name, 120) || email;
    if (id) memberById.set(id, { displayName, email });
    if (email) memberByEmail.set(email, { id, displayName });
  }

  const actors: Record<string, ReplyActor> = {};

  for (const row of activityRows) {
    const metadata = row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : null;
    const messageId = cleanText(metadata?.messageId, 320);
    if (!messageId) continue;

    const actorMemberId = cleanText(row.actor_member_id, 80) || null;
    const actorEmail = cleanText(row.actor_email, 254).toLowerCase();
    const byId = actorMemberId ? memberById.get(actorMemberId) : undefined;
    const byEmail = actorEmail ? memberByEmail.get(actorEmail) : undefined;
    const displayName = byId?.displayName || byEmail?.displayName || actorEmail;
    if (!displayName) continue;

    actors[messageId] = {
      displayName,
      memberId: actorMemberId || byEmail?.id || null,
    };
  }

  return NextResponse.json({ ok: true, actors });
}
