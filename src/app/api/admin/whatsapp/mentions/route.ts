import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { normalizeWhatsAppTeamMember } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

export async function GET() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!access.memberId) {
    return NextResponse.json({ ok: true, notifications: [] });
  }

  const mentionRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_note_mentions?member_id=eq.${encodeURIComponent(access.memberId)}&read_at=is.null&select=note_id,created_at&order=created_at.desc&limit=20`,
  );
  if (!mentionRows) {
    return NextResponse.json({ error: "Mentions could not be loaded." }, { status: 503 });
  }
  if (mentionRows.length === 0) {
    return NextResponse.json({ ok: true, notifications: [] });
  }

  const noteIds = [...new Set(mentionRows.map((row) => String(row.note_id || "")).filter(Boolean))];
  const noteFilter = noteIds.join(",");
  const noteRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_internal_notes?id=in.(${noteFilter})&select=id,conversation_id,author_member_id,author_email,body,created_at`,
  );
  if (!noteRows) {
    return NextResponse.json({ error: "Mentioned notes could not be loaded." }, { status: 503 });
  }

  const authorIds = [...new Set(noteRows.map((row) => String(row.author_member_id || "")).filter(Boolean))];
  const teamRows = authorIds.length
    ? await readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_team_members?id=in.(${authorIds.join(",")})&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at`,
      )
    : [];
  const authorById = new Map(
    (teamRows || []).map((row) => {
      const member = normalizeWhatsAppTeamMember(row);
      return [member.id, member];
    }),
  );
  const mentionCreatedByNote = new Map(
    mentionRows.map((row) => [String(row.note_id || ""), typeof row.created_at === "string" ? row.created_at : null]),
  );

  return NextResponse.json({
    ok: true,
    notifications: noteRows
      .map((row) => {
        const noteId = String(row.id || "");
        const authorId = String(row.author_member_id || "");
        const author = authorById.get(authorId);
        return {
          noteId,
          conversationId: String(row.conversation_id || ""),
          authorName:
            author?.displayName ||
            (typeof row.author_email === "string" ? row.author_email : "Team member"),
          body: typeof row.body === "string" ? row.body : "",
          createdAt:
            mentionCreatedByNote.get(noteId) ||
            (typeof row.created_at === "string" ? row.created_at : null),
        };
      })
      .filter((item) => item.noteId && item.conversationId),
  });
}

export async function PATCH(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!access.memberId) {
    return NextResponse.json({ ok: true });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: { noteId?: unknown } = {};
  try {
    body = (await request.json()) as { noteId?: unknown };
  } catch {
    // An empty body means mark every unread mention as read.
  }

  const noteId = typeof body.noteId === "string" ? body.noteId.trim().slice(0, 80) : "";
  const filter = noteId
    ? `&note_id=eq.${encodeURIComponent(noteId)}`
    : "&read_at=is.null";
  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_note_mentions?member_id=eq.${encodeURIComponent(access.memberId)}${filter}`,
    body: { read_at: new Date().toISOString() },
  });
  if (!updated.ok) {
    return NextResponse.json({ error: updated.message }, { status: updated.status });
  }

  return NextResponse.json({ ok: true });
}
