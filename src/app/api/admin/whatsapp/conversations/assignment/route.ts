import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { dispatchWhatsAppAutomationEvent } from "@/lib/whatsapp/automationRuntime";
import {
  canWhatsAppRoleSuperviseTeam,
  isWhatsAppTeamMemberAssignable,
  normalizeWhatsAppTeamMember,
} from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

type AssignmentBody = { conversationId?: unknown; memberId?: unknown };
function text(value: unknown, max = 100) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const access = await getWhatsAppWorkspaceAccess(cookieStore);
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  let body: AssignmentBody;
  try { body = (await request.json()) as AssignmentBody; }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }

  const conversationId = text(body.conversationId, 80);
  const requestedMemberId = body.memberId === null ? "" : text(body.memberId, 80);
  if (!conversationId) return NextResponse.json({ error: "Conversation id is required." }, { status: 400 });

  const conversationRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}&select=id,contact_id,assigned_member_id,assigned_to&limit=1`,
  );
  const conversation = conversationRows?.[0];
  if (!conversation) return NextResponse.json({ error: "Conversation was not found." }, { status: 404 });
  const currentMemberId = typeof conversation.assigned_member_id === "string" ? conversation.assigned_member_id : null;

  let targetMember: ReturnType<typeof normalizeWhatsAppTeamMember> | null = null;
  if (requestedMemberId) {
    const targetRows = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_team_members?id=eq.${encodeURIComponent(requestedMemberId)}&active=eq.true&select=id,google_email,display_name,role,availability,active,google_user_id,last_seen_at,created_at,updated_at&limit=1`,
    );
    targetMember = targetRows?.[0] ? normalizeWhatsAppTeamMember(targetRows[0]) : null;
    if (!targetMember) return NextResponse.json({ error: "That team member is not active." }, { status: 409 });
  }

  const nextMemberId = targetMember?.id || null;
  const assignmentIsUnchanged = currentMemberId === nextMemberId;
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    if (!access.memberId) return NextResponse.json({ error: "Your team profile is not ready for assignment." }, { status: 409 });
    if (!targetMember || targetMember.id !== access.memberId) return NextResponse.json({ error: "Agents can only assign an unassigned conversation to themselves." }, { status: 403 });
    if (currentMemberId && currentMemberId !== access.memberId) return NextResponse.json({ error: "This conversation is already assigned to another team member." }, { status: 409 });
  }

  if (targetMember && !assignmentIsUnchanged && !isWhatsAppTeamMemberAssignable(targetMember)) {
    return NextResponse.json({ error: `${targetMember.displayName} is not Online and cannot receive a new conversation assignment.` }, { status: 409 });
  }

  if (assignmentIsUnchanged) {
    return NextResponse.json({ ok: true, assignment: targetMember ? { memberId: targetMember.id, displayName: targetMember.displayName, googleEmail: targetMember.googleEmail } : null });
  }

  const updated = await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`,
    body: { assigned_member_id: nextMemberId, assigned_to: targetMember?.googleEmail || null, updated_at: new Date().toISOString() },
  });
  if (!updated.ok) return NextResponse.json({ error: updated.message }, { status: updated.status });

  const eventType = !targetMember ? "conversation_unassigned" : currentMemberId ? "conversation_reassigned" : "conversation_assigned";
  await mutateWhatsAppRest({
    method: "POST", pathAndQuery: "whatsapp_team_activity",
    body: {
      conversation_id: conversationId, actor_member_id: access.memberId, actor_email: access.email,
      target_member_id: nextMemberId, event_type: eventType,
      metadata: { previousMemberId: currentMemberId, assignedMemberId: nextMemberId },
    },
  });

  if (targetMember) {
    await dispatchWhatsAppAutomationEvent({
      type: "CONVERSATION_ASSIGNED",
      eventKey: `conversation:${conversationId}:assigned:${targetMember.id}:${Date.now()}`,
      triggerValue: targetMember.id,
      contactId: typeof conversation.contact_id === "string" ? conversation.contact_id : undefined,
      conversationId,
      payload: { previousMemberId: currentMemberId, assignedMemberId: targetMember.id },
    });
  }

  return NextResponse.json({
    ok: true,
    assignment: targetMember ? { memberId: targetMember.id, displayName: targetMember.displayName, googleEmail: targetMember.googleEmail } : null,
  });
}
