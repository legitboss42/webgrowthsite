/**
 * Explicit, HMAC-authenticated, READ-ONLY Mr Web inbox bridge.
 * This is not an admin-cookie proxy, a public WhatsApp messaging API, or an
 * agent permission provider. Hermes M7 must authorize the exact agent and
 * connection BEFORE signing any call to this endpoint.
 *
 * Deliberately no send, CRM mutation, template or campaign actions.
 * Not deployed from this branch until the owner's one combined cutover.
 */
import { NextResponse } from "next/server";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { getWhatsAppWorkspaceById } from "@/lib/whatsapp/workspaces";
import { isWhatsAppWorkspaceId } from "@/lib/whatsapp/workspaceModel";
import { requireAgentInboxQuery, verifyMrWebAgentSignature } from "@/lib/whatsapp/mrwebAgentAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function reply(payload: Record<string,unknown>, status=200) {
  return NextResponse.json(payload,{status,headers:{"Cache-Control":"no-store, private"}});
}
export async function POST(request: Request) {
  const secret = process.env.MRWEB_WHATSAPP_BRIDGE_KEY;
  const workspaceId = process.env.MRWEB_WHATSAPP_WORKSPACE_ID;
  if (!secret || secret.length < 32 || !isWhatsAppWorkspaceId(workspaceId))
    return reply({error:"WHATSAPP_AGENT_BRIDGE_DISABLED"},503);
  const size=Number(request.headers.get("content-length")||"0");
  if (size>4000)return reply({error:"REQUEST_TOO_LARGE"},413);
  let raw:string;
  try {raw=await request.text();}catch{return reply({error:"INVALID_REQUEST"},400);}
  if(!verifyMrWebAgentSignature({
    body:raw,timestamp:request.headers.get("x-mrweb-timestamp"),
    nonce:request.headers.get("x-mrweb-nonce"),signature:request.headers.get("x-mrweb-signature"),
    secret
  }))return reply({error:"UNAUTHORIZED"},401);

  let query;
  try {query=requireAgentInboxQuery(JSON.parse(raw),workspaceId);}
  catch {return reply({error:"SCOPE_DENIED"},403);}

  // The configured secondary boundary must be the platform-owned Web Growth
  // workspace, not any SaaS customer workspace or a caller-supplied cookie.
  const workspace=await getWhatsAppWorkspaceById(workspaceId);
  if (!workspace || workspace.slug!=="web-growth" || !workspace.isPlatformOwned || workspace.status!=="ACTIVE")
    return reply({error:"WHATSAPP_WORKSPACE_NOT_AUTHORIZED"},403);
  const limit=query.limit??20;
  if(query.operation==="conversations.list") {
    const rows=await readWhatsAppRows<Record<string,unknown>>(
      "whatsapp_conversations?select=id,status,intent,human_review_required,last_message_at,assigned_member_id"+
      "&order=last_message_at.desc&limit="+limit,{workspaceId}
    );
    if(rows===null)return reply({error:"INBOX_UNAVAILABLE"},503);
    return reply({ok:true,operation:query.operation,conversations:rows.map(x=>({
      id:x.id,status:x.status,intent:x.intent,human_review_required:x.human_review_required,
      last_message_at:x.last_message_at,assigned_member_id:x.assigned_member_id
    }))});
  }
  const conversations=await readWhatsAppRows<Record<string,unknown>>(
    "whatsapp_conversations?select=id&id=eq."+encodeURIComponent(query.conversationId)+"&limit=1",
    {workspaceId}
  );
  if(conversations===null)return reply({error:"INBOX_UNAVAILABLE"},503);
  if(conversations.length!==1)return reply({error:"CONVERSATION_NOT_FOUND"},404);
  const rows=await readWhatsAppRows<Record<string,unknown>>(
    "whatsapp_messages?select=id,conversation_id,direction,message_type,message_text,message_timestamp,delivery_status"+
    "&conversation_id=eq."+encodeURIComponent(query.conversationId)+
    "&message_type=eq.text&order=message_timestamp.desc&limit="+limit,
    {workspaceId}
  );
  if(rows===null)return reply({error:"INBOX_UNAVAILABLE"},503);
  return reply({ok:true,operation:query.operation,messages:rows.map(x=>({
    id:x.id,conversation_id:x.conversation_id,direction:x.direction,
    message_type:x.message_type,message_text:x.message_text,
    message_timestamp:x.message_timestamp,delivery_status:x.delivery_status
  }))});
}
