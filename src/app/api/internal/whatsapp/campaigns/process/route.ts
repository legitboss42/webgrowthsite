import { NextResponse } from "next/server";
import {
  getWhatsAppCampaignProcessorSecret,
  processWhatsAppCampaignQueue,
  secureCampaignSecretEqual,
} from "@/lib/whatsapp/campaignRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await getWhatsAppCampaignProcessorSecret();
  if (!secureCampaignSecretEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid campaign processor secret." }, { status: 401 });
  }
  const result = await processWhatsAppCampaignQueue(25);
  return NextResponse.json({ ok: true, ...result });
}
