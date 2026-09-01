import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import {
  canAgentAccessWhatsAppContact,
  normalizeWhatsAppContactRow,
} from "@/app/admin/whatsapp/contactsModel";
import { buildWhatsAppContactTimeline } from "@/app/admin/whatsapp/contactTimelineModel";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const runtime = "nodejs";

const CONTACT_SELECT =
  "id,wa_id,phone,display_name,business_name,email,website,source,lead_status,lead_temperature,lead_stage,tags,custom_fields,opt_in_status,opt_in_at,opt_out_at,created_at,updated_at,whatsapp_conversations(id,status,intent,last_message_at,human_review_required,assigned_member_id)";

function cleanId(value: string | null) {
  const clean = value?.trim() || "";
  return /^[0-9a-f-]{20,80}$/i.test(clean) ? clean : "";
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const contactId = cleanId(new URL(request.url).searchParams.get("id"));
  if (!contactId) return NextResponse.json({ error: "A valid contact id is required." }, { status: 400 });

  const contactRows = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}&select=${CONTACT_SELECT}&limit=1`,
  );
  const rawContact = contactRows?.[0];
  if (!rawContact) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  const contact = normalizeWhatsAppContactRow(rawContact);
  if (!canWhatsAppRoleSuperviseTeam(access.role) && !canAgentAccessWhatsAppContact(contact, access.memberId)) {
    return NextResponse.json({ error: "You do not have access to this contact." }, { status: 403 });
  }

  const conversationId = contact.conversation?.id;
  const messagePromise = conversationId
    ? readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,whatsapp_message_id,direction,message_type,message_text,message_timestamp,delivery_status,media_voice,media_filename&order=message_timestamp.desc&limit=150`,
      )
    : Promise.resolve([] as Record<string, unknown>[]);
  const callPromise = readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_calls?customer_wa_id=eq.${encodeURIComponent(contact.wa_id)}&select=call_id,direction,status,started_at,answered_at,ended_at,duration_seconds,last_event_at&order=last_event_at.desc&limit=75`,
  );
  const conversationActivityPromise = conversationId
    ? readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_team_activity?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,actor_email,event_type,metadata,created_at&order=created_at.desc&limit=100`,
      )
    : Promise.resolve([] as Record<string, unknown>[]);
  const contactActivityPromise = readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_team_activity?metadata->>contactId=eq.${encodeURIComponent(contactId)}&select=id,actor_email,event_type,metadata,created_at&order=created_at.desc&limit=100`,
  );

  const [messages, calls, conversationActivities, contactActivities] = await Promise.all([
    messagePromise,
    callPromise,
    conversationActivityPromise,
    contactActivityPromise,
  ]);

  const items = buildWhatsAppContactTimeline({
    messages,
    calls,
    activities: [...(conversationActivities || []), ...(contactActivities || [])],
  });

  return NextResponse.json({
    ok: true,
    contactId: contact.id,
    conversationId: conversationId || null,
    items,
  });
}
