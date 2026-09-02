import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { dispatchWhatsAppAutomationEvent } from "@/lib/whatsapp/automationRuntime";
import {
  getWhatsAppConversationSession,
  setWhatsAppConversationSessionStatus,
  type WhatsAppConversationSessionStatus,
} from "@/lib/whatsapp/conversationLifecycle";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

function cleanId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{20,80}$/i.test(value.trim()) ? value.trim() : "";
}

async function canAccessConversation(conversationId: string) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return { access: null, session: null };
  const session = await getWhatsAppConversationSession(conversationId);
  if (!session) return { access, session: null };
  if (!canWhatsAppRoleSuperviseTeam(access.role)) {
    if (!access.memberId) return { access: null, session: null };
    if (session.assignedMemberId && session.assignedMemberId !== access.memberId) {
      return { access: null, session: null };
    }
  }
  return { access, session };
}

export async function GET(request: Request) {
  const conversationId = cleanId(new URL(request.url).searchParams.get("conversationId"));
  if (!conversationId) return NextResponse.json({ error: "A valid conversation id is required." }, { status: 400 });
  const { access, session } = await canAccessConversation(conversationId);
  if (!access) return NextResponse.json({ error: "Conversation access is required." }, { status: 403 });
  if (!session) return NextResponse.json({ error: "Conversation was not found." }, { status: 404 });
  return NextResponse.json({ ok: true, status: session.status });
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request payload." }, { status: 400 }); }

  const conversationId = cleanId(body.conversationId);
  const status = body.status === "open" || body.status === "closed" ? body.status as WhatsAppConversationSessionStatus : null;
  if (!conversationId || !status) return NextResponse.json({ error: "Conversation id and status are required." }, { status: 400 });

  const { access, session } = await canAccessConversation(conversationId);
  if (!access) return NextResponse.json({ error: "Conversation access is required." }, { status: 403 });
  if (!session) return NextResponse.json({ error: "Conversation was not found." }, { status: 404 });

  const result = await setWhatsAppConversationSessionStatus({
    conversationId,
    status,
    reason: "MANUAL",
    actorMemberId: access.memberId,
    actorEmail: access.email,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.changed && status === "open") {
    await dispatchWhatsAppAutomationEvent({
      type: "CONVERSATION_OPENED",
      eventKey: `conversation-opened:manual:${conversationId}:${Date.now()}`,
      contactId: result.contactId,
      conversationId,
      payload: { origin: "MANUAL", actorMemberId: access.memberId, actorEmail: access.email },
    });
  }

  return NextResponse.json({ ok: true, status, changed: result.changed });
}
