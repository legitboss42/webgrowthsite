import { NextResponse } from "next/server";
import { createSupabaseWhatsAppStore } from "@/lib/whatsapp/store";
import { isValidMetaSignature, processWhatsAppWebhook, verifyWebhook } from "@/lib/whatsapp/webhook";
import { sendWhatsAppText } from "@/lib/whatsapp/send";

export const runtime = "nodejs";

export function GET(request: Request) {
  return verifyWebhook(new URL(request.url), process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET?.trim() || "";
  if (!isValidMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }
  try {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("WhatsApp webhook storage is not configured");
      return NextResponse.json({ error: "Webhook storage is not configured" }, { status: 503 });
    }
    const result = await processWhatsAppWebhook(JSON.parse(rawBody), createSupabaseWhatsAppStore({ url: supabaseUrl, serviceRoleKey }), sendWhatsAppText);
    console.info("WhatsApp webhook processed", result);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }
}
