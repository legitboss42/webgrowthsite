import { mutateWhatsAppRest } from "./data";

export async function recordWhatsAppConversationActivity(input: {
  conversationId: string;
  actorMemberId?: string | null;
  actorEmail: string;
  eventType: string;
  targetMemberId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await mutateWhatsAppRest({
    method: "POST",
    pathAndQuery: "whatsapp_team_activity",
    body: {
      conversation_id: input.conversationId,
      actor_member_id: input.actorMemberId || null,
      actor_email: input.actorEmail,
      target_member_id: input.targetMemberId || null,
      event_type: input.eventType,
      metadata: input.metadata || {},
    },
  });
}
