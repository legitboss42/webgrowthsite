import { NextResponse } from "next/server";
import { isValidMetaSignature, parseWhatsAppWebhook, verifyWebhook } from "@/lib/whatsapp/webhook";

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
    parseWhatsAppWebhook(JSON.parse(rawBody));
    console.info("WhatsApp webhook accepted");
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }
}
