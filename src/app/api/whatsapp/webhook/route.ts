import { NextResponse } from "next/server";
import { createSupabaseWhatsAppStore } from "@/lib/whatsapp/store";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { extractWhatsAppCallEvents, storeWhatsAppCallEvents } from "@/lib/whatsapp/callHistory";
import {
  isValidMetaSignature,
  parseWhatsAppWebhook,
  processWhatsAppWebhook,
  verifyWebhook,
} from "@/lib/whatsapp/webhook";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import {
  claimWhatsAppPushDelivery,
  sendWhatsAppPushNotification,
} from "@/lib/whatsapp/webPush";

export const runtime = "nodejs";

export function GET(request: Request) {
  return verifyWebhook(
    new URL(request.url),
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "",
  );
}

function pushBody(message: ReturnType<typeof parseWhatsAppWebhook>["messages"][number]) {
  if (message.text) return message.text.trim().slice(0, 180);
  if (message.type === "audio") return message.mediaVoice ? "Voice note" : "Audio message";
  if (message.type === "image") return "Image";
  if (message.type === "video") return "Video";
  if (message.type === "document") return "Document";
  return `New ${message.type || "WhatsApp"} message`;
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

    const payload = JSON.parse(rawBody);
    const parsed = parseWhatsAppWebhook(payload);
    const callEvents = extractWhatsAppCallEvents(payload);
    const [{ settings }, quickSettings] = await Promise.all([
      loadWhatsAppSettings(),
      loadWhatsAppQuickSettings(),
    ]);

    const result = await processWhatsAppWebhook(
      payload,
      createSupabaseWhatsAppStore({
        url: supabaseUrl,
        serviceRoleKey,
        leadKeywords: settings.leadKeywords,
      }),
      sendWhatsAppText,
      { leadKeywords: settings.leadKeywords },
    );

    try {
      await storeWhatsAppCallEvents(payload);
    } catch (error) {
      console.error("WhatsApp call history processing failed", error);
    }

    const incomingRinging = callEvents.filter(
      (event) => event.direction === "inbound" && event.status === "ringing",
    );
    if (incomingRinging.length) {
      await Promise.all(
        incomingRinging.map(async (event) => {
          try {
            const id = `call:${String(event.call_id)}:ringing`;
            const claimed = await claimWhatsAppPushDelivery(id);
            if (!claimed) return;
            const name = typeof event.customer_name === "string" && event.customer_name.trim()
              ? event.customer_name.trim()
              : typeof event.customer_wa_id === "string" && event.customer_wa_id.trim()
                ? event.customer_wa_id.trim()
                : "WhatsApp caller";
            await sendWhatsAppPushNotification({
              id,
              title: `Incoming WhatsApp call · ${name}`,
              body: "Tap to open Web Growth and answer or reject the call.",
              url: `/admin/whatsapp/calls/?call=${encodeURIComponent(String(event.call_id))}`,
            });
          } catch (error) {
            console.error("WhatsApp incoming-call push failed", error);
          }
        }),
      );
    }

    if (quickSettings.newMessageAlertsEnabled && parsed.messages.length) {
      await Promise.all(
        parsed.messages.map(async (message) => {
          try {
            const claimed = await claimWhatsAppPushDelivery(message.messageId);
            if (!claimed) return;
            await sendWhatsAppPushNotification({
              id: message.messageId,
              title: `New WhatsApp message from ${message.displayName || message.waId}`,
              body: pushBody(message),
              url: "/admin/whatsapp/conversations/",
            });
          } catch (error) {
            console.error("WhatsApp background push failed", error);
          }
        }),
      );
    }

    console.info("WhatsApp webhook processed", result);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }
}
