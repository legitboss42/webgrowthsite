import { NextResponse } from "next/server";
import {
  getWhatsAppAutomationProcessorSecret,
  processWhatsAppAutomationQueue,
  secureAutomationSecretEqual,
} from "@/lib/whatsapp/automationRuntime";
import { closeInactiveWhatsAppConversations } from "@/lib/whatsapp/conversationLifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supplied = request.headers.get("x-webgrowth-automation-secret")?.trim() || "";
  const expected = await getWhatsAppAutomationProcessorSecret();
  if (!secureAutomationSecretEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid automation processor secret." }, { status: 401 });
  }
  const result = await processWhatsAppAutomationQueue(25);
  const conversations = await closeInactiveWhatsAppConversations();
  return NextResponse.json({ ok: true, ...result, conversations });
}
