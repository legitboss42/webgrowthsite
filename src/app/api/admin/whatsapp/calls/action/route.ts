import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";

export const runtime = "nodejs";
type CallAction = "pre_accept" | "accept" | "reject" | "terminate"; const ALLOWED_ACTIONS = new Set<CallAction>(["pre_accept","accept","reject","terminate"]);
async function updateStoredCall(callId: string, action: CallAction, workspaceId: string) { const now=new Date().toISOString(); const body:Record<string,unknown>={updated_at:now,last_event_at:now}; if(action==="accept"){body.status="accepted";body.answered_at=now;} else if(action==="reject"){body.status="rejected";body.ended_at=now;} else if(action==="terminate"){body.status="terminated";body.ended_at=now;} if(!body.status)return; await mutateWhatsAppRest({method:"PATCH",pathAndQuery:`whatsapp_calls?call_id=eq.${encodeURIComponent(callId)}`,body,workspaceId}); }
export async function POST(request:Request){
  const access=await getWhatsAppWorkspaceAccess(await cookies()); if(!access)return NextResponse.json({error:"Authentication required."},{status:401}); if(!isSameOriginMutation(request.headers.get("origin"),request.url))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const input=await request.json().catch(()=>null) as {callId?:unknown;action?:unknown;sdp?:unknown}|null; const callId=typeof input?.callId==="string"?input.callId.trim():""; const action=typeof input?.action==="string"?input.action.trim() as CallAction:"" as CallAction; const sdp=typeof input?.sdp==="string"?input.sdp:"";
  if(!callId||!ALLOWED_ACTIONS.has(action))return NextResponse.json({error:"Invalid call action."},{status:400}); if((action==="pre_accept"||action==="accept")&&!sdp.trim())return NextResponse.json({error:"An SDP answer is required to answer this call."},{status:400});
  const owned=await readWhatsAppRows<Record<string,unknown>>(`whatsapp_calls?call_id=eq.${encodeURIComponent(callId)}&select=call_id&limit=1`,{workspaceId:access.workspaceId}); if(!owned?.[0])return NextResponse.json({error:"This call does not belong to the active workspace."},{status:404});
  const meta=await resolveWhatsAppMetaConfig({workspaceId:access.workspaceId}); if(!meta)return NextResponse.json({error:"WhatsApp Calling API is not configured for this workspace."},{status:503});
  const body:Record<string,unknown>={messaging_product:"whatsapp",call_id:callId,action}; if(action==="pre_accept"||action==="accept")body.session={sdp_type:"answer",sdp};
  const response=await fetch(`https://graph.facebook.com/${meta.apiVersion}/${meta.phoneNumberId}/calls`,{method:"POST",headers:{Authorization:`Bearer ${meta.token}`,"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"}); const payload=await response.json().catch(()=>null) as Record<string,unknown>|null;
  if(!response.ok){const metaError=payload?.error&&typeof payload.error==="object"?payload.error as Record<string,unknown>:null; const message=typeof metaError?.message==="string"?metaError.message:"Meta rejected the call action."; console.error("WhatsApp call action failed",{workspaceId:access.workspaceId,action,status:response.status,code:metaError?.code,message}); return NextResponse.json({error:message},{status:response.status>=400&&response.status<600?response.status:502});}
  await updateStoredCall(callId,action,access.workspaceId); return NextResponse.json({ok:true,action,meta:payload});
}
