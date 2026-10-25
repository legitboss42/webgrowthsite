import "server-only";
import { NextResponse } from "next/server";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { createMetaClient } from "@/lib/socialAutomation/metaClient";
import { selectManagedMetaAccount } from "@/lib/openclaw/socialMetaAccountBinding";
import { verifyDelegatedOperation, validateProviderApproval,
         consumeSiteOwnerApproval, DelegationDenied, type DelegatedAction } from "@/lib/openclaw/socialIamDelegation";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";
import { getDefaultWhatsAppWorkspace } from "@/lib/whatsapp/workspaces";
import { verifyWhatsAppBusinessPhone } from "@/lib/whatsapp/whatsappReadOnlyVerifier";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { getSupabaseWhatsAppReplyContext, createSupabaseWhatsAppStore } from "@/lib/whatsapp/store";
import { sendInboxWhatsAppReply } from "@/lib/whatsapp/inboxReply";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store, max-age=0"};
const VALID_VERSION=/^v\d{1,3}\.\d{1,2}$/;
const VALID_GRAPH_ID=/^\d{4,30}$/;
const VALID_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireText(data:Record<string,unknown>|undefined,key:string,max:number) {
  const value=data?.[key];
  if(typeof value!=="string"||!value.trim()||value.length>max)
    throw new DelegationDenied("INVALID_ACTION_DATA");
  return value.trim();
}
async function metaGraph(input:{
  version:string;id:string;token:string;edge?:string;fields?:Record<string,string>;
  method?:"GET"|"POST";
}) {
  if(!VALID_VERSION.test(input.version)||!VALID_GRAPH_ID.test(input.id)||
    !["","/feed","/media","/media_publish"].includes(input.edge||""))
    throw new DelegationDenied("INVALID_GRAPH_RESOURCE");
  const url=new URL("https://graph.facebook.com/"+input.version+"/"+input.id+(input.edge||""));
  const method=input.method||"GET";
  const params=new URLSearchParams(input.fields||{});
  if(method==="GET")url.search=params.toString();
  let response:Response;
  try {
    response=await fetch(url,{method,
      headers:{Authorization:"Bearer "+input.token,Accept:"application/json",
               ...(method==="POST"?{"Content-Type":"application/x-www-form-urlencoded"}:{})},
      ...(method==="POST"?{body:params.toString()}:{}),
      cache:"no-store",redirect:"error",signal:AbortSignal.timeout(18000)});
  }catch{throw new DelegationDenied("PROVIDER_UNAVAILABLE");}
  if(!response.ok)throw new DelegationDenied(
    [401,403].includes(response.status)?"PROVIDER_PERMISSION_DENIED":
    response.status===429?"PROVIDER_RATE_LIMITED":"PROVIDER_HTTP_"+response.status);
  const raw=(await response.text()).slice(0,15000);
  try{return JSON.parse(raw) as Record<string,unknown>;}
  catch{throw new DelegationDenied("INVALID_PROVIDER_RESULT");}
}

async function execute(action:DelegatedAction):Promise<Record<string,unknown>> {
  if(action.operation==="social.connection.status")return {
    roleValidated:true,business:action.business,writeMode:"OWNER_APPROVAL_GATED"
  };
  if(action.operation.startsWith("meta.")) {
    const conn=await createSocialAutomationStore().getMetaConnectionWithTokens();
    if(!conn||conn.summary.reconnectRequired)
      throw new DelegationDenied("META_AUTH_UNAVAILABLE");
    const version=process.env.META_GRAPH_VERSION||"";
    // Exactly one account pair is authorized for each registered business.
    // Never send a NOUNCompass action using the Web Growth-selected Page token.
    let account;
    if(action.business==="webgrowth") {
      account=selectManagedMetaAccount("webgrowth",action.operation,action.resource,[{
        facebookPageId:conn.summary.facebookPageId||"",
        instagramAccountId:conn.summary.instagramAccountId||"",
        pageAccessToken:conn.tokens.pageAccessToken||""
      }]);
    } else {
      if(!conn.tokens.userAccessToken)
        throw new DelegationDenied("NOUNCOMPASS_OAUTH_REQUIRED");
      let pages;
      try {
        pages=await createMetaClient({graphVersion:version}).listManagedPages({
          userAccessToken:conn.tokens.userAccessToken
        });
      } catch {throw new DelegationDenied("NOUNCOMPASS_OAUTH_UNAVAILABLE");}
      account=selectManagedMetaAccount("nouncompass",action.operation,action.resource,pages);
    }
    if(!account)throw new DelegationDenied("BUSINESS_RESOURCE_MISMATCH");
    const expected=account.graphId;
    const core={version,id:expected,token:account.pageToken};
    switch(action.operation) {
      case "meta.page.profile": {
        const response=await metaGraph({...core,fields:{fields:"id,name,followers_count"}});
        return {verified:response.id===expected,channel:"facebook_page",
          name:typeof response.name==="string"?response.name:""};
      }
      case "meta.instagram.profile": {
        const response=await metaGraph({...core,fields:{fields:"id,username,media_count"}});
        return {verified:response.id===expected,channel:"instagram",
          username:typeof response.username==="string"?response.username:""};
      }
      case "meta.page.post": {
        const message=requireText(action.data,"message",2000);
        const output=await metaGraph({...core,edge:"/feed",method:"POST",fields:{message}});
        if(typeof output.id!=="string")throw new DelegationDenied("PUBLICATION_OUTCOME_UNKNOWN");
        return {executed:true,postId:output.id};
      }
      case "meta.instagram.prepare": {
        const imageUrl=requireText(action.data,"image_url",1700);
        const caption=requireText(action.data,"caption",1800);
        const parsed=new URL(imageUrl);
        if(parsed.protocol!=="https:"||parsed.username||parsed.password||parsed.port||
           !parsed.hostname.includes(".")||/(?:localhost|\.internal|\.local)$/.test(parsed.hostname)||
           /^(?:127\.|10\.|192\.168\.|169\.254\.)/.test(parsed.hostname))
          throw new DelegationDenied("PUBLIC_IMAGE_REQUIRED");
        const output=await metaGraph({...core,edge:"/media",method:"POST",fields:{image_url:imageUrl,caption}});
        if(typeof output.id!=="string")throw new DelegationDenied("MEDIA_CREATION_UNKNOWN");
        return {executed:true,creationId:output.id};
      }
      case "meta.instagram.publish": {
        const creation=requireText(action.data,"creation_id",30);
        if(!VALID_GRAPH_ID.test(creation))throw new DelegationDenied("INVALID_MEDIA_CONTAINER");
        const output=await metaGraph({...core,edge:"/media_publish",method:"POST",fields:{creation_id:creation}});
        if(typeof output.id!=="string")throw new DelegationDenied("PUBLICATION_OUTCOME_UNKNOWN");
        return {executed:true,mediaId:output.id};
      }
    }
  }
  if(action.operation.startsWith("whatsapp.")) {
    const workspace=await getDefaultWhatsAppWorkspace();
    if(!workspace||workspace.slug!=="web-growth"||
      !workspace.isPlatformOwned||workspace.status!=="ACTIVE")
      throw new DelegationDenied("WORKSPACE_NOT_AUTHORIZED");
    const config=await resolveWhatsAppMetaConfig({workspaceId:workspace.id});
    if(!config||config.workspaceId!==workspace.id)
      throw new DelegationDenied("WHATSAPP_AUTH_UNAVAILABLE");
    if(action.operation==="whatsapp.phone.profile") {
      if(action.resource!==config.phoneNumberId)
        throw new DelegationDenied("BUSINESS_RESOURCE_MISMATCH");
      const result=await verifyWhatsAppBusinessPhone({
        apiVersion:config.apiVersion,phoneNumberId:config.phoneNumberId,token:config.token
      });
      return {verified:result.ok,status:result.status,httpStatus:result.httpStatus};
    }
    if(action.operation==="whatsapp.reply") {
      if(!VALID_UUID.test(action.resource))throw new DelegationDenied("INVALID_CONVERSATION");
      const message=requireText(action.data,"message",1200);
      const db=createSchedulerSupabaseClient();
      const {data:conv,error}=await db.from("whatsapp_conversations")
        .select("id,status,whatsapp_contacts!inner(wa_id)")
        .eq("workspace_id",workspace.id).eq("id",action.resource).maybeSingle();
      if(error||!conv||conv.status!=="open")throw new DelegationDenied("CONVERSATION_NOT_AUTHORIZED");
      const contacts=conv.whatsapp_contacts as {wa_id?:string}|Array<{wa_id?:string}>|null;
      const to=Array.isArray(contacts)?contacts[0]?.wa_id:contacts?.wa_id;
      if(!to)throw new DelegationDenied("CONVERSATION_NOT_AUTHORIZED");
      const cfg={
        url:process.env.SUPABASE_URL||"",
        serviceRoleKey:process.env.SUPABASE_SERVICE_ROLE_KEY||"",
        workspaceId:workspace.id
      };
      if(!cfg.url||!cfg.serviceRoleKey)throw new DelegationDenied("DATABASE_NOT_CONFIGURED");
      const context=await getSupabaseWhatsAppReplyContext(cfg,action.resource,to);
      if(!context)throw new DelegationDenied("SERVICE_WINDOW_CLOSED_OR_CONVERSATION_INVALID");
      const result=await sendInboxWhatsAppReply({...context,text:message},{
        store:createSupabaseWhatsAppStore(cfg)
      });
      if(!result.ok)throw new DelegationDenied("MESSAGE_NOT_SENT_"+result.reason);
      return {executed:true,messageId:result.messageId};
    }
  }
  throw new DelegationDenied("OPERATION_NOT_ALLOWED");
}

export async function POST(request:Request) {
  const reply=(data:Record<string,unknown>,status=200)=>
    NextResponse.json(data,{status,headers:HEADERS});
  let envelope:unknown;
  try {
    const raw=await request.text();
    if(raw.length>18000)return reply({ok:false,error:"REQUEST_TOO_LARGE"},413);
    envelope=JSON.parse(raw);
  }catch{return reply({ok:false,error:"INVALID_REQUEST"},400);}
  try {
    const action=await verifyDelegatedOperation(envelope);
    validateProviderApproval(action);
    // Independent authenticated website-owner consent before any actual external write.
    await consumeSiteOwnerApproval(action);
    const result=await execute(action);
    try {
      await createSocialAutomationStore().audit({
        eventType:"OPENCLAW_SOCIAL_ACTION",actor:"SYSTEM",metadata:{
          agent:action.agent,business:action.business,operation:action.operation,
          approvalId:action.approvalId||null,success:true,at:new Date().toISOString()
        }
      });
    }catch{console.warn("[openclaw-social] Sanitized audit unavailable");}
    return reply({ok:true,result});
  }catch(error) {
    const code=error instanceof DelegationDenied?error.code:"SOCIAL_ACTION_FAILED";
    return reply({ok:false,error:code},403);
  }
}
export async function GET() {
  return NextResponse.json({ok:false,error:"SIGNED_POST_REQUIRED"},{status:405,headers:HEADERS});
}
