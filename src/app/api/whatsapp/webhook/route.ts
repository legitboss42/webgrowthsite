import { NextResponse } from "next/server";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { createSupabaseWhatsAppStore } from "@/lib/whatsapp/store";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { extractWhatsAppCallEvents, storeWhatsAppCallEvents } from "@/lib/whatsapp/callHistory";
import { ensureWhatsAppConversationOpenedByInbound } from "@/lib/whatsapp/conversationLifecycle";
import {
  isValidMetaSignature,
  parseWhatsAppWebhook,
  processWhatsAppWebhook,
  verifyWebhook,
  type NormalizedIncomingMessage,
} from "@/lib/whatsapp/webhook";
import { sendWhatsAppText } from "@/lib/whatsapp/send";
import { dispatchWhatsAppAutomationEvent, resumeWhatsAppAutomationQuestion } from "@/lib/whatsapp/automationRuntime";
import { recordWhatsAppCampaignInbound, updateWhatsAppCampaignDeliveryStatus } from "@/lib/whatsapp/campaignRuntime";
import { claimWhatsAppPushDelivery, sendWhatsAppPushNotification } from "@/lib/whatsapp/webPush";

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

async function dispatchMessageAutomations(message: NormalizedIncomingMessage) {
  try {
    if (message.interactiveReplyId) {
      const resumed = await resumeWhatsAppAutomationQuestion({
        waId: message.waId,
        messageId: message.messageId,
        replyId: message.interactiveReplyId,
        replyTitle: message.interactiveReplyTitle,
        replyDescription: message.interactiveReplyDescription,
        timestamp: message.timestamp,
      });
      if (resumed.resumed > 0) return { started: resumed.resumed, skipped: 0, failed: 0 };
      if ("failed" in resumed && resumed.failed) return { started: 0, skipped: 0, failed: 1 };
    }

    const session = await ensureWhatsAppConversationOpenedByInbound({
      waId: message.waId,
      messageId: message.messageId,
    });

    const contacts = await readWhatsAppRows<Record<string, unknown>>(
      `whatsapp_contacts?wa_id=eq.${encodeURIComponent(message.waId)}&select=id,created_at&limit=1`,
    );
    const contact = contacts?.[0];
    const contactId = session.contactId || (typeof contact?.id === "string" ? contact.id : undefined);

    let conversationId = session.conversationId;
    if (!conversationId && contactId) {
      const conversations = await readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_conversations?contact_id=eq.${encodeURIComponent(contactId)}&select=id&order=last_message_at.desc&limit=1`,
      );
      conversationId = typeof conversations?.[0]?.id === "string" ? conversations[0].id : undefined;
    }

    let openedResult = { started: 0, skipped: 0, failed: 0 };
    if (session.opened && conversationId) {
      openedResult = await dispatchWhatsAppAutomationEvent({
        type: "CONVERSATION_OPENED",
        eventKey: `conversation-opened:message:${message.messageId}`,
        contactId,
        conversationId,
        waId: message.waId,
        payload: {
          origin: "CUSTOMER_MESSAGE",
          displayName: message.displayName || null,
          openingMessageId: message.messageId,
        },
        message: { id: message.messageId, text: message.text, type: message.type, timestamp: message.timestamp },
      });
    }

    const messageResult = await dispatchWhatsAppAutomationEvent({
      type: "NEW_MESSAGE",
      eventKey: `message:${message.messageId}`,
      contactId,
      conversationId,
      waId: message.waId,
      payload: {
        displayName: message.displayName || null,
        mediaId: message.mediaId || null,
        interactiveReplyId: message.interactiveReplyId || null,
        interactiveReplyTitle: message.interactiveReplyTitle || null,
      },
      message: { id: message.messageId, text: message.text, type: message.type, timestamp: message.timestamp },
    });

    const createdAt = typeof contact?.created_at === "string" ? Date.parse(contact.created_at) : Number.NaN;
    const messageAt = message.timestamp * 1000;
    if (contactId && Number.isFinite(createdAt) && Math.abs(messageAt - createdAt) <= 120_000) {
      await dispatchWhatsAppAutomationEvent({
        type: "NEW_CONTACT",
        eventKey: `contact-created:${contactId}`,
        contactId,
        conversationId,
        waId: message.waId,
        payload: { source: "WhatsApp inbound" },
      });
    }

    return {
      started: openedResult.started + messageResult.started,
      skipped: openedResult.skipped + messageResult.skipped,
      failed: openedResult.failed + messageResult.failed,
    };
  } catch (error) {
    console.error("WhatsApp automation message dispatch failed", error);
    return { started: 0, skipped: 0, failed: 1 };
  }
}

async function dispatchMissedCallAutomations(events: ReturnType<typeof extractWhatsAppCallEvents>) {
  for (const event of events) {
    if (event.direction !== "inbound" || !new Set(["rejected", "terminate", "terminated"]).has(String(event.status))) continue;
    try {
      const rows = await readWhatsAppRows<Record<string, unknown>>(
        `whatsapp_calls?call_id=eq.${encodeURIComponent(String(event.call_id))}&select=call_id,customer_wa_id,answered_at&limit=1`,
      );
      const call = rows?.[0];
      if (!call || call.answered_at) continue;
      const waId = typeof call.customer_wa_id === "string" ? call.customer_wa_id : undefined;
      const contacts = waId
        ? await readWhatsAppRows<Record<string, unknown>>(`whatsapp_contacts?wa_id=eq.${encodeURIComponent(waId)}&select=id&limit=1`)
        : [];
      const contactId = typeof contacts?.[0]?.id === "string" ? contacts[0].id : undefined;
      const conversations = contactId
        ? await readWhatsAppRows<Record<string, unknown>>(`whatsapp_conversations?contact_id=eq.${encodeURIComponent(contactId)}&select=id&order=last_message_at.desc&limit=1`)
        : [];
      await dispatchWhatsAppAutomationEvent({
        type: "MISSED_CALL",
        eventKey: `missed-call:${String(event.call_id)}`,
        contactId,
        conversationId: typeof conversations?.[0]?.id === "string" ? conversations[0].id : undefined,
        waId,
        payload: { callId: String(event.call_id), status: String(event.status) },
      });
    } catch (error) {
      console.error("WhatsApp missed-call automation dispatch failed", error);
    }
  }
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
    const [{ settings }, quickSettings] = await Promise.all([loadWhatsAppSettings(), loadWhatsAppQuickSettings()]);

    const result = await processWhatsAppWebhook(
      payload,
      createSupabaseWhatsAppStore({ url: supabaseUrl, serviceRoleKey, leadKeywords: settings.leadKeywords }),
      sendWhatsAppText,
      {
        leadKeywords: settings.leadKeywords,
        shouldUseSafeReply: async (message) => {
          const campaign = await recordWhatsAppCampaignInbound({
            waId: message.waId,
            messageId: message.messageId,
            timestamp: message.timestamp,
            text: message.text,
          });
          if (campaign.optedOut) return false;
          const automation = await dispatchMessageAutomations(message);
          return automation.started === 0;
        },
      },
    );

    await Promise.all(parsed.statuses.map(async (status) => {
      try { await updateWhatsAppCampaignDeliveryStatus(status.messageId, status.status, status.error); }
      catch (error) { console.error("WhatsApp campaign delivery tracking failed", error); }
    }));

    try { await storeWhatsAppCallEvents(payload); }
    catch (error) { console.error("WhatsApp call history processing failed", error); }
    await dispatchMissedCallAutomations(callEvents);

    const incomingRinging = callEvents.filter((event) => event.direction === "inbound" && event.status === "ringing");
    if (incomingRinging.length) {
      await Promise.all(incomingRinging.map(async (event) => {
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
        } catch (error) { console.error("WhatsApp incoming-call push failed", error); }
      }));
    }

    if (quickSettings.newMessageAlertsEnabled && parsed.messages.length) {
      await Promise.all(parsed.messages.map(async (message) => {
        try {
          const claimed = await claimWhatsAppPushDelivery(message.messageId);
          if (!claimed) return;
          await sendWhatsAppPushNotification({
            id: message.messageId,
            title: `New WhatsApp message from ${message.displayName || message.waId}`,
            body: pushBody(message),
            url: "/admin/whatsapp/conversations/",
          });
        } catch (error) { console.error("WhatsApp background push failed", error); }
      }));
    }

    console.info("WhatsApp webhook processed", result);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }
}
