import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";

export type DelegatedAction = {
  business: "webgrowth";
  agent: string;
  operation: string;
  resource: string;
  data?: Record<string, unknown>;
  approvalId?: string;
};
export type StsEvidence = {
  headers: Record<string,string>;
  nonce: string;
  body: string;
};
export class DelegationDenied extends Error {
  constructor(public readonly code: string) { super(code); }
}

const STS_URL = "https://sts.eu-central-1.amazonaws.com/";
const STS_BODY = "Action=GetCallerIdentity&Version=2011-06-15";
const AUDIENCE = "webgrowth.info/openclaw-social-v1";
const EXPECTED_ROLE = "arn:aws:sts::849662766503:assumed-role/mr-web-ai-ssm/";
const SAFE = /^[a-zA-Z0-9_.:@/-]{1,128}$/;

function sha(text: string) { return createHash("sha256").update(text).digest("hex"); }

export async function verifyDelegatedOperation(
  evidence: unknown,
  opts: { transport?: typeof fetch; reserve?: (nonce:string,approvalId:string|null)=>Promise<boolean> } = {},
): Promise<DelegatedAction> {
  if (!evidence || typeof evidence !== "object") throw new DelegationDenied("INVALID_ATTESTATION");
  const e = evidence as Partial<StsEvidence>;
  if (typeof e.body !== "string" || e.body.length > 7000 ||
      typeof e.nonce !== "string" || !/^[a-f0-9-]{32,36}$/.test(e.nonce) ||
      !e.headers || typeof e.headers !== "object") throw new DelegationDenied("INVALID_ATTESTATION");
  let action: DelegatedAction;
  try { action = JSON.parse(e.body) as DelegatedAction; }
  catch { throw new DelegationDenied("INVALID_ACTION"); }
  if (!action || action.business !== "webgrowth" || !SAFE.test(action.agent) ||
      !SAFE.test(action.operation) || !SAFE.test(action.resource) ||
      (action.approvalId !== undefined && !/^ap_[a-zA-Z0-9_-]{8,100}$/.test(action.approvalId)) ||
      (action.data !== undefined && (typeof action.data !== "object" || !action.data ||
       Array.isArray(action.data))) ||
      Object.keys(action).some(k=>!["business","agent","operation","resource","data","approvalId"].includes(k))
  ) throw new DelegationDenied("INVALID_ACTION");

  const incoming:Record<string,string> = {};
  for (const [k,v] of Object.entries(e.headers)) {
    const key=k.toLowerCase();
    if (!["authorization","x-amz-date","x-amz-security-token","x-mrweb-audience","x-mrweb-context","content-type","host"].includes(key) ||
        typeof v !== "string" || v.length>4096 || /[\r\n]/.test(v))
      throw new DelegationDenied("INVALID_STS_HEADERS");
    incoming[key]=v;
  }
  if (incoming["x-mrweb-audience"]!==AUDIENCE ||
      incoming["x-mrweb-context"]!==sha(e.nonce+"\n"+e.body) ||
      !incoming["authorization"]?.startsWith("AWS4-HMAC-SHA256 ") ||
      incoming["content-type"]!=="application/x-www-form-urlencoded" ||
      (incoming.host && incoming.host!=="sts.eu-central-1.amazonaws.com"))
    throw new DelegationDenied("STS_PROOF_MISMATCH");

  const auth=incoming["authorization"];
  const signed=auth.match(/SignedHeaders=([^,\s]+)/)?.[1]?.split(";") || [];
  if (!["host","x-amz-date","x-mrweb-audience","x-mrweb-context"].every(s=>signed.includes(s)) ||
      (incoming["x-amz-security-token"] && !signed.includes("x-amz-security-token")))
    throw new DelegationDenied("STS_PROOF_NOT_BOUND");
  const date=incoming["x-amz-date"];
  if (!/^\d{8}T\d{6}Z$/.test(date||"")) throw new DelegationDenied("STALE_STS_PROOF");
  const time=Date.parse(date.slice(0,4)+"-"+date.slice(4,6)+"-"+date.slice(6,8)+"T"+
                        date.slice(9,11)+":"+date.slice(11,13)+":"+date.slice(13,15)+"Z");
  if (!Number.isFinite(time) || Math.abs(Date.now()-time)>90_000)
    throw new DelegationDenied("STALE_STS_PROOF");
  const outboundHeaders:Record<string,string>={};
  for(const k of ["authorization","x-amz-date","x-amz-security-token","x-mrweb-audience","x-mrweb-context","content-type"])
    if(incoming[k])outboundHeaders[k]=incoming[k];
  // Fixed STS URL, method and query-action; no user-directed URL or arbitrary AWS operation.
  let response:Response;
  try {
    response=await (opts.transport||fetch)(STS_URL,{
      method:"POST",headers:outboundHeaders,body:STS_BODY,
      redirect:"error",cache:"no-store",signal:AbortSignal.timeout(10_000)
    });
  } catch { throw new DelegationDenied("STS_UNAVAILABLE"); }
  if(!response.ok)throw new DelegationDenied("STS_ATTESTATION_REJECTED");
  const xml=(await response.text()).slice(0,8192);
  const arn=xml.match(/<Arn>([^<]{1,256})<\/Arn>/)?.[1] || "";
  if (!arn.startsWith(EXPECTED_ROLE)) throw new DelegationDenied("STS_ROLE_NOT_AUTHORIZED");

  // Nonce and owner approval receipt replay resistance is enforced atomically in production DB.
  const reserve=opts.reserve || (async(nonce:string,approvalId:string|null)=>{
    const db=createSchedulerSupabaseClient();
    const { error }=await db.from("openclaw_social_requests").insert({
      nonce,approval_id:approvalId,operation:action.operation,created_at:new Date().toISOString()
    });
    return !error;
  });
  if (!await reserve(e.nonce,action.approvalId||null))
    throw new DelegationDenied("DUPLICATE_OR_UNAVAILABLE_APPROVAL");
  return action;
}

export function validateProviderApproval(action: DelegatedAction) {
  const mutating = new Set(["meta.page.post","meta.instagram.prepare","meta.instagram.publish","whatsapp.reply"]);
  if (mutating.has(action.operation) && !action.approvalId)
    throw new DelegationDenied("OWNER_APPROVAL_REQUIRED");
  if (!mutating.has(action.operation) && !new Set(["social.connection.status","meta.page.profile","meta.instagram.profile","whatsapp.phone.profile",...mutating]).has(action.operation))
    throw new DelegationDenied("OPERATION_NOT_ALLOWED");
}


export function ownerApprovalDigest(action: DelegatedAction) {
  return sha(JSON.stringify({
    business:action.business,agent:action.agent,operation:action.operation,
    resource:action.resource,data:action.data||{}
  }));
}

export async function consumeSiteOwnerApproval(action: DelegatedAction) {
  const mutating=new Set(["meta.page.post","meta.instagram.prepare","meta.instagram.publish","whatsapp.reply"]);
  if(!mutating.has(action.operation))return;
  if(!action.approvalId)throw new DelegationDenied("OWNER_APPROVAL_REQUIRED");
  const db=createSchedulerSupabaseClient();
  const {data:approval,error}=await db.from("openclaw_social_approvals")
    .select("approval_id,business_id,agent_id,operation,resource_id,payload_digest,expires_at,used_at")
    .eq("approval_id",action.approvalId).maybeSingle();
  if(error||!approval||approval.business_id!==action.business||
     approval.agent_id!==action.agent||approval.operation!==action.operation||
     approval.resource_id!==action.resource||approval.payload_digest!==ownerApprovalDigest(action)||
     Boolean(approval.used_at)||Date.parse(approval.expires_at)<Date.now())
    throw new DelegationDenied("OWNER_APPROVAL_NOT_VERIFIED");
  // CAS update guarantees exact approval cannot be used more than once.
  const {data:consumed,error:updateError}=await db.from("openclaw_social_approvals")
    .update({used_at:new Date().toISOString()}).eq("approval_id",action.approvalId)
    .is("used_at",null).select("approval_id").maybeSingle();
  if(updateError||!consumed)throw new DelegationDenied("OWNER_APPROVAL_ALREADY_USED");
}
