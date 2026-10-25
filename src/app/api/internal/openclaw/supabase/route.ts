import "server-only";
import { NextResponse } from "next/server";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { verifyDelegatedOperation, consumeSiteOwnerApproval, DelegationDenied, type DelegatedAction } from "@/lib/openclaw/socialIamDelegation";
import { validateSupabaseDelegation, isSupabaseWrite, WEBGROWTH_SUPABASE_PROJECT, SupabaseDelegationDenied } from "@/lib/openclaw/supabaseDelegationPolicy";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store, max-age=0"};
const SUPABASE_DOMAIN=WEBGROWTH_SUPABASE_PROJECT+".supabase.co";
function reply(result:Record<string,unknown>,code=200) {
  return NextResponse.json(result,{status:code,headers:HEADERS});
}
function requireExactProject() {
  let host="";
  try { host=new URL(process.env.SUPABASE_URL||"").hostname; } catch {}
  if(host!==SUPABASE_DOMAIN)throw new DelegationDenied("SUPABASE_PROJECT_NOT_BOUND");
}
async function execute(action:DelegatedAction):Promise<Record<string,unknown>> {
  requireExactProject();
  const db=createSchedulerSupabaseClient();
  switch(action.operation) {
    case "supabase.health.read": {
      const {error}=await db.from("scheduler_audit_log").select("id").limit(1);
      if(error)throw new DelegationDenied("SUPABASE_READ_UNAVAILABLE");
      return {connected:true,projectBound:true,writeCapability:"EXACT_OWNER_APPROVAL_GATED"};
    }
    case "supabase.seo.read": {
      const limit=(action.data?.limit as number|undefined)||5;
      const {data,error}=await db.from("seo_audits")
        .select("id,performance_score,seo_score,accessibility_score,created_at")
        .order("created_at",{ascending:false}).limit(limit);
      if(error)throw new DelegationDenied("SUPABASE_READ_UNAVAILABLE");
      return {rows:data||[],count:(data||[]).length};
    }
    case "supabase.audit.read": {
      const limit=(action.data?.limit as number|undefined)||5;
      const {data,error}=await db.from("scheduler_audit_log")
        .select("id,event_type,created_at").eq("target_type","openclaw")
        .order("created_at",{ascending:false}).limit(limit);
      if(error)throw new DelegationDenied("SUPABASE_READ_UNAVAILABLE");
      return {rows:data||[],count:(data||[]).length};
    }
    case "supabase.audit.create": {
      const summary=String(action.data?.summary||"").trim();
      const {data,error}=await db.from("scheduler_audit_log")
        .insert({target_type:"openclaw",event_type:"MRWEB_OWNER_APPROVED_NOTE",
          metadata:{summary,actor:"mr-web",business:"webgrowth"}})
        .select("id,event_type,created_at").single();
      if(error || !data)throw new DelegationDenied("SUPABASE_WRITE_OUTCOME_UNCONFIRMED");
      return {executed:true,record:{id:data.id,eventType:data.event_type,createdAt:data.created_at}};
    }
  }
  throw new DelegationDenied("OPERATION_NOT_ALLOWED");
}
export async function POST(request:Request) {
  let envelope:unknown;
  try {
    const raw=await request.text();
    if(raw.length>18000)return reply({ok:false,error:"REQUEST_TOO_LARGE"},413);
    envelope=JSON.parse(raw);
  }catch{return reply({ok:false,error:"INVALID_REQUEST"},400);}
  try {
    // IAM role proof is bound to the exact payload and single-use nonce
    // by the existing Web Growth verification and nonce reservation service.
    const action=await verifyDelegatedOperation(envelope);
    validateSupabaseDelegation(action);
    if(isSupabaseWrite(action.operation)) {
      if(!action.approvalId)throw new DelegationDenied("OWNER_APPROVAL_REQUIRED");
      // An independently authenticated Web Growth owner-session approval
      // has to bind the same operation, project and exact payload digest.
      await consumeSiteOwnerApproval(action);
    }
    const result=await execute(action);
    return reply({ok:true,result});
  }catch(error) {
    const code=(error instanceof DelegationDenied||error instanceof SupabaseDelegationDenied)
      ?error.code:"SUPABASE_ACTION_UNAVAILABLE";
    return reply({ok:false,error:code},403);
  }
}
export async function GET() {
  return reply({ok:false,error:"SIGNED_POST_REQUIRED"},405);
}
