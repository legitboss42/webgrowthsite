import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  canWhatsAppAccessConversation,
  getWhatsAppWorkspaceAccess,
} from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import {
  canWhatsAppRoleSuperviseTeam,
  normalizeWhatsAppTeamMember,
} from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function getConversation(conversationId: string) {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,assigned_member_id&limit=1`,
  );
  return rows?.[0] || null;
}

async function getTeamMembers() {
  const rows = await readWhatsAppRows<Record<string, unknown>>(
    "whatsapp_team_members?select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&order=display_name.asc",
  );
  return (rows || []).map(normalizeWhatsAppTeamMember);
}

async function saveHeartbeat(input: {
  conversationId: string;
  memberId: string;
  isTyping: boolean;
}) {
  const now = new Date().toISOString();
  const path = `whatsapp_conversation_presence?conversation_id=eq.${encodeURIComponent(input.conversationId)}&member_id=eq.${encodeURIComponent(input.memberId)}`;
  const patched = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: path,
    body: { is_typing: input.isTyping, last_seen_at: now },
  });
  if (patched.ok && patched.rows.length > 0) return patched;

  const inserted = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_conversation_presence",
    body: {
      conversation_id: input.conversationId,
      member_id: input.memberId,
      is_typing: input.isTyping,
      last_seen_at: now,
    },
  });
  if (inserted.ok) return inserted;

  // A simultaneous heartbeat can win the insert race. Retry the idempotent patch once.
  return mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: path,
    body: { is_typing: input.isTyping, last_seen_at: now },
  });
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const conversationId = cleanText(new URL(request.url).searchParams.get("conversationId"), 80);
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation id is required." }, { status: 400 });
  }
  if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) {
    return NextResponse.json({ error: "You cannot access this conversation." }, { status: 403 });
  }

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation was not found." }, { status: 404 });
  }

  const recentCutoff = new Date(Date.now() - 45_000).toISOString();
  const [noteRows, activityRows, presenceRows, members] = await Promise.all([
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_internal_notes?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,conversation_id,author_member_id,author_email,body,created_at&order=created_at.asc&limit=100`,
    ),
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_team_activity?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,actor_member_id,actor_email,target_member_id,event_type,metadata,created_at&order=created_at.desc&limit=50`,
    ),
    readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_conversation_presence?conversation_id=eq.${encodeURIComponent(conversationId)}&last_seen_at=gte.${encodeURIComponent(recentCutoff)}&select=member_id,is_typing,last_seen_at&order=last_seen_at.desc`,
    ),
    getTeamMembers(),
  ]);

  if (!noteRows || !activityRows || !presenceRows) {
    return NextResponse.json({ error: "Conversation collaboration data could not be loaded." }, { status: 503 });
  }

  const memberById = new Map(members.map((member) => [member.id, member]));
  const assignedMemberId =
    typeof conversation.assigned_member_id === "string" ? conversation.assigned_member_id : null;
  const canWriteNote = canWhatsAppRoleSuperviseTeam(access.role)
    ? true
    : await canWhatsAppAccessConversation(access, conversationId);

  const mentionableMembers = members.filter(
    (member) =>
      member.active &&
      member.id !== access.memberId &&
      (canWhatsAppRoleSuperviseTeam(member.role) || member.id === assignedMemberId),
  );

  return NextResponse.json({
    ok: true,
    viewerMemberId: access.memberId,
    canWriteNote,
    mentionableMembers,
    notes: noteRows.map((row) => {
      const authorId = typeof row.author_member_id === "string" ? row.author_member_id : null;
      return {
        id: String(row.id || ""),
        body: typeof row.body === "string" ? row.body : "",
        authorMemberId: authorId,
        authorName:
          (authorId ? memberById.get(authorId)?.displayName : null) ||
          (typeof row.author_email === "string" ? row.author_email : "Team member"),
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
      };
    }),
    activity: activityRows.map((row) => {
      const actorId = typeof row.actor_member_id === "string" ? row.actor_member_id : null;
      const targetId = typeof row.target_member_id === "string" ? row.target_member_id : null;
      return {
        id: String(row.id || ""),
        eventType: typeof row.event_type === "string" ? row.event_type : "activity",
        actorName:
          (actorId ? memberById.get(actorId)?.displayName : null) ||
          (typeof row.actor_email === "string" ? row.actor_email : "System"),
        targetName: targetId ? memberById.get(targetId)?.displayName || null : null,
        metadata:
          row.metadata && typeof row.metadata === "object" ? row.metadata : {},
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
      };
    }),
    viewers: presenceRows.map((row) => {
      const memberId = String(row.member_id || "");
      const member = memberById.get(memberId);
      return {
        memberId,
        displayName: member?.displayName || "Team member",
        isTyping: row.is_typing === true,
        lastSeenAt: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!access.memberId) {
    return NextResponse.json({ error: "Your team profile is not ready yet." }, { status: 409 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const action = cleanText(body.action, 30);
  const conversationId = cleanText(body.conversationId, 80);
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation id is required." }, { status: 400 });
  }

  if (action === "heartbeat") {
    if (!(await canWhatsAppAccessConversation(access, conversationId, { allowUnassigned: true }))) {
      return NextResponse.json({ error: "You cannot access this conversation." }, { status: 403 });
    }
    const saved = await saveHeartbeat({
      conversationId,
      memberId: access.memberId,
      isTyping: body.isTyping === true,
    });
    if (!saved.ok) {
      return NextResponse.json({ error: saved.message }, { status: saved.status });
    }
    return NextResponse.json({ ok: true });
  }

  if (action !== "note") {
    return NextResponse.json({ error: "Unsupported collaboration action." }, { status: 400 });
  }
  if (!(await canWhatsAppAccessConversation(access, conversationId))) {
    return NextResponse.json(
      { error: "Assign this conversation before adding internal notes." },
      { status: 403 },
    );
  }

  const noteBody = cleanText(body.body, 4000);
  if (!noteBody) {
    return NextResponse.json({ error: "Write an internal note first." }, { status: 400 });
  }

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation was not found." }, { status: 404 });
  }
  const assignedMemberId =
    typeof conversation.assigned_member_id === "string" ? conversation.assigned_member_id : null;
  const members = await getTeamMembers();
  const allowedMentionIds = new Set(
    members
      .filter(
        (member) =>
          member.active &&
          member.id !== access.memberId &&
          (canWhatsAppRoleSuperviseTeam(member.role) || member.id === assignedMemberId),
      )
      .map((member) => member.id),
  );
  const requestedMentionIds = Array.isArray(body.mentionMemberIds)
    ? body.mentionMemberIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const mentionMemberIds = [...new Set(requestedMentionIds)].filter((id) => allowedMentionIds.has(id));

  const created = await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_internal_notes",
    body: {
      conversation_id: conversationId,
      author_member_id: access.memberId,
      author_email: access.email,
      body: noteBody,
    },
  });
  if (!created.ok || !created.rows[0]) {
    return NextResponse.json(
      { error: created.ok ? "Internal note could not be created." : created.message },
      { status: created.ok ? 503 : created.status },
    );
  }

  const noteId = String(created.rows[0].id || "");
  if (noteId && mentionMemberIds.length > 0) {
    const mentions = await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_note_mentions",
      body: mentionMemberIds.map((memberId) => ({
        note_id: noteId,
        member_id: memberId,
      })),
    });
    if (!mentions.ok) {
      console.error("WhatsApp internal note was created but mentions could not be saved", {
        noteId,
        status: mentions.status,
      });
    }
  }

  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      conversation_id: conversationId,
      actor_member_id: access.memberId,
      actor_email: access.email,
      event_type: "internal_note_created",
      metadata: { mentionMemberIds },
    },
  });

  return NextResponse.json({ ok: true, noteId }, { status: 201 });
}
