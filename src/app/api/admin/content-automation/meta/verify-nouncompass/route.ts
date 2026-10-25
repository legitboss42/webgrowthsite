import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { createMetaClient } from "@/lib/socialAutomation/metaClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = {"Cache-Control":"no-store,max-age=0"};
// Exact owner-registered NOUNCompass resources, not input from a browser/agent.
const NOUNCOMPASS_PAGE = "102469882650501";
const NOUNCOMPASS_INSTAGRAM = "17841446869937750";

function summarizeNouncompassPageAccess(
  pages:Array<{
    facebookPageId:string;
    instagramAccountId:string;
    pageAccessToken:string;
    tasks:string[];
  }>
) {
  const match=pages.find((p)=>
    p.facebookPageId===NOUNCOMPASS_PAGE &&
    p.instagramAccountId===NOUNCOMPASS_INSTAGRAM);
  const pageMatch=pages.some((p)=>p.facebookPageId===NOUNCOMPASS_PAGE);
  const igMatch=pages.some((p)=>p.instagramAccountId===NOUNCOMPASS_INSTAGRAM);
  return {
    pageVisible:pageMatch,
    instagramVisible:igMatch,
    linkedOnSamePage:Boolean(match),
    pageTokenAvailable:Boolean(match?.pageAccessToken),
    // An OAuth listing and returned Page token are not an actual publish grant.
    status:match && match.pageAccessToken ?
      "NOUNCOMPASS_OAUTH_PAGE_LINKED" : "NOUNCOMPASS_AUTH_NOT_VERIFIED"
  };
}

/**
 * Runs only inside already-authenticated Web Growth Content Automation admin.
 * Reads the existing encrypted Meta USER token strictly within the server.
 * No token, Page ID, IG ID, account name or Graph body reaches browser/log.
 */
export async function GET() {
  const reply=(body:Record<string,unknown>, status=200)=>
    NextResponse.json(body,{status,headers:HEADERS});
  if(!(await hasContentAutomationAdminAccess(await cookies()))) {
    return reply({ok:false,status:"ADMIN_AUTH_REQUIRED"},401);
  }
  try {
    const store=createSocialAutomationStore();
    const connection=await store.getMetaConnectionWithTokens();
    if(!connection || connection.summary.reconnectRequired ||
       !connection.tokens.userAccessToken) {
      return reply({ok:false,status:"META_USER_OAUTH_UNAVAILABLE"},409);
    }
    const pages=await createMetaClient({
      graphVersion:process.env.META_GRAPH_VERSION||""
    }).listManagedPages({userAccessToken:connection.tokens.userAccessToken});
    const found=summarizeNouncompassPageAccess(pages);
    const response={
      ok:found.linkedOnSamePage && found.pageTokenAvailable,
      status:found.status,
      checkedAt:new Date().toISOString(),
      business:"nouncompass",
      pageVisible:found.pageVisible,
      instagramVisible:found.instagramVisible,
      linkedOnSamePage:found.linkedOnSamePage,
      pageTokenAvailable:found.pageTokenAvailable,
      publishingRightsVerified:false
    };
    try {
      await store.audit({eventType:"NOUNCOMPASS_META_PAGE_DISCOVERY_CHECK",
        actor:"ADMIN",metadata:response});
    }catch{console.warn("[nouncompass-meta-check] Sanitized audit unavailable.");}
    return reply(response);
  } catch {
    return reply({ok:false,status:"NOUNCOMPASS_META_DISCOVERY_UNAVAILABLE"},503);
  }
}
