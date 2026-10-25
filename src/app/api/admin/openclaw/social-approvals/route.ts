import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { ownerApprovalDigest, type DelegatedAction } from "@/lib/openclaw/socialIamDelegation";

export const runtime="nodejs";
const HEADERS={"Cache-Control":"no-store,max-age=0"};
const OPS=new Set(["meta.page.post","meta.instagram.prepare","meta.instagram.publish","whatsapp.reply"]);
const AGENTS=new Set(["mr-web","ada","amara","emmanuel","favour","felix","kemi",
  "malik","mercy","princess","samuel","zara"]);

export async function POST(request:Request) {
  const reply=(body:Record<string,unknown>,status=200)=>
    NextResponse.json(body,{status,headers:HEADERS});
  if(!isSameOriginMutation(request.headers.get("origin"),request.url))
    return reply({ok:false,error:"INVALID_ORIGIN"},403);
  let proposal:{approvalId?:string;action?:DelegatedAction};
  try {
    const raw=await request.text();
    if(raw.length>6000)return reply({ok:false,error:"REQUEST_TOO_LARGE"},413);
    proposal=JSON.parse(raw);
  }catch{return reply({ok:false,error:"INVALID_REQUEST"},400);}
  const action=proposal?.action;
  if(!action||action.business!=="webgrowth"||!AGENTS.has(action.agent)||
     !OPS.has(action.operation)||typeof action.resource!=="string"||
     !/^[a-zA-Z0-9-]{4,60}$/.test(action.resource)||
     !/^ap_[a-zA-Z0-9_-]{8,100}$/.test(proposal.approvalId||"")||
     !action.data||typeof action.data!=="object"||Array.isArray(action.data)||
     Object.keys(action).some(k=>!["business","agent","operation","resource","data"].includes(k)))
    return reply({ok:false,error:"INVALID_PROPOSAL"},400);

  const store=await cookies();
  if(!(await hasContentAutomationAdminAccess(store)))
    return reply({ok:false,error:"ADMIN_AUTH_REQUIRED"},401);
  if(action.operation==="whatsapp.reply") {
    const wa=await getWhatsAppWorkspaceAccess(store);
    if(!wa||!wa.platformAdmin||wa.workspaceSlug!=="web-growth")
      return reply({ok:false,error:"WHATSAPP_PLATFORM_ADMIN_REQUIRED"},403);
  }
  // One approval authorizes exactly one action fingerprint on exactly one
  // business resource, and is consumed before the outbound provider mutation.
  const db=createSchedulerSupabaseClient();
  const approvedBy="webgrowth-owner-session";
  const {error}=await db.from("openclaw_social_approvals").insert({
    approval_id:proposal.approvalId,
    business_id:action.business,agent_id:action.agent,operation:action.operation,
    resource_id:action.resource,payload_digest:ownerApprovalDigest(action),
    approved_by:approvedBy,approved_at:new Date().toISOString(),
    expires_at:new Date(Date.now()+30*60*1000).toISOString()
  });
  if(error)return reply({ok:false,error:"APPROVAL_ALREADY_EXISTS_OR_UNAVAILABLE"},409);
  return reply({ok:true,status:"OWNER_APPROVED_FOR_ONE_ACTION",
    approvalId:proposal.approvalId,operation:action.operation,
    business:action.business,resource:action.resource,
    expiresInSeconds:1800});
}
