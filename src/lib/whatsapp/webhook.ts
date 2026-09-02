import { createHmac, timingSafeEqual } from "node:crypto";
import { classifyWhatsAppIntent } from "./classify";
import { sanitizeWhatsAppStatusError } from "./messageStatus";
import type { WhatsAppLeadKeywordRules } from "./settings";

export type NormalizedIncomingMessage = {
  messageId: string;
  waId: string;
  displayName?: string;
  text?: string;
  timestamp: number;
  type: string;
  mediaId?: string;
  mediaMimeType?: string;
  mediaSha256?: string;
  mediaVoice?: boolean;
  mediaFilename?: string;
};

export type NormalizedStatus = {
  messageId: string;
  waId?: string;
  status: string;
  timestamp: number;
  error?: string;
};

export function verifyWebhook(url: URL, verifyToken: string) {
  const mode = url.searchParams.get("hub.mode");
  const suppliedToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && challenge && suppliedToken && verifyToken && suppliedToken === verifyToken) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

export function isValidMetaSignature(rawBody: string, suppliedSignature: string | null, appSecret: string) {
  if (!suppliedSignature || !appSecret || !suppliedSignature.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const suppliedBuffer = Buffer.from(suppliedSignature, "utf8");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

type UnknownRecord = Record<string, unknown>;
function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}
function getIncomingMedia(item: UnknownRecord, type: string) {
  if (type !== "audio" && type !== "image" && type !== "video" && type !== "document") return null;
  return asRecord(item[type]);
}

export function parseWhatsAppWebhook(payload: unknown): { messages: NormalizedIncomingMessage[]; statuses: NormalizedStatus[] } {
  const root = asRecord(payload);
  if (!root || root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) throw new Error("Invalid WhatsApp webhook payload");
  const messages: NormalizedIncomingMessage[] = [];
  const statuses: NormalizedStatus[] = [];
  for (const entry of root.entry) {
    const entryRecord = asRecord(entry);
    if (!entryRecord || !Array.isArray(entryRecord.changes)) continue;
    for (const change of entryRecord.changes) {
      const value = asRecord(asRecord(change)?.value);
      if (!value) continue;
      const names = new Map<string, string>();
      if (Array.isArray(value.contacts)) for (const contact of value.contacts) {
        const item = asRecord(contact); const profile = asRecord(item?.profile);
        if (typeof item?.wa_id === "string" && typeof profile?.name === "string") names.set(item.wa_id, profile.name);
      }
      if (Array.isArray(value.messages)) for (const message of value.messages) {
        const item = asRecord(message);
        const text = asRecord(item?.text);
        if (typeof item?.id !== "string" || typeof item?.from !== "string" || typeof item?.timestamp !== "string" || typeof item?.type !== "string") continue;
        const media = getIncomingMedia(item, item.type);
        const body = typeof text?.body === "string" ? text.body : typeof media?.caption === "string" ? media.caption : undefined;
        messages.push({
          messageId: item.id,
          waId: item.from,
          displayName: names.get(item.from),
          text: body,
          timestamp: Number(item.timestamp),
          type: item.type,
          mediaId: typeof media?.id === "string" ? media.id : undefined,
          mediaMimeType: typeof media?.mime_type === "string" ? media.mime_type : undefined,
          mediaSha256: typeof media?.sha256 === "string" ? media.sha256 : undefined,
          mediaVoice: item.type === "audio" && media?.voice === true,
          mediaFilename: typeof media?.filename === "string" ? media.filename : undefined,
        });
      }
      if (Array.isArray(value.statuses)) for (const status of value.statuses) {
        const item = asRecord(status);
        if (typeof item?.id !== "string" || typeof item?.status !== "string" || typeof item?.timestamp !== "string") continue;
        const failure = Array.isArray(item.errors) ? asRecord(item.errors[0]) : null;
        const failureData = asRecord(failure?.error_data);
        const error = failure ? sanitizeWhatsAppStatusError({
          code: typeof failure.code === "number" ? failure.code : undefined,
          title: typeof failure.title === "string" ? failure.title : undefined,
          details: typeof failureData?.details === "string" ? failureData.details : undefined,
        }) : undefined;
        statuses.push({ messageId: item.id, waId: typeof item.recipient_id === "string" ? item.recipient_id : undefined, status: item.status, timestamp: Number(item.timestamp), error });
      }
    }
  }
  return { messages, statuses };
}

export type WebhookProcessorStore = {
  recordInbound(message: NormalizedIncomingMessage): Promise<{ duplicate: boolean }>;
  updateMessageStatus(messageId: string, status: string, error?: string): Promise<void>;
  recordOutbound?(message: { messageId: string; waId: string; text: string; timestamp: number }): Promise<void>;
};
export type WhatsAppTextSender = (input: {
  to: string;
  text: string;
  customerMessageTimestamp: number;
  replyToMessageId?: string;
}) => Promise<{ sent: boolean; messageId?: string }>;

function getSafeReply(text: string | undefined, rules?: WhatsAppLeadKeywordRules) {
  const classification = classifyWhatsAppIntent(text || "", rules);
  if (classification.safeReplyKind === "PORTFOLIO") return "You can view selected Web Growth work here: https://webgrowth.info/portfolio/";
  if (classification.safeReplyKind === "AUDIT") return "Thanks for reaching out. Please send your website URL and tell us the main thing you would like improved.";
  if (classification.safeReplyKind === "SERVICE") return "Web Growth can help with website design, redesigns, ecommerce, SEO, performance, tracking, CRM, and marketing automation. Which service are you considering?";
  if (classification.safeReplyKind === "NEW_LEAD") return "Thanks for contacting Web Growth. What would you like to improve, and do you already have a website?";
  if (classification.safeReplyKind === "ACKNOWLEDGEMENT") return "Thanks, I’ve got the details. I’m reviewing the scope so I can give you an accurate answer rather than guessing.";
  return null;
}

export async function processWhatsAppWebhook(
  payload: unknown,
  store: WebhookProcessorStore,
  send?: WhatsAppTextSender,
  options: {
    leadKeywords?: WhatsAppLeadKeywordRules;
    shouldUseSafeReply?: (message: NormalizedIncomingMessage) => Promise<boolean>;
  } = {},
) {
  const { messages, statuses } = parseWhatsAppWebhook(payload);
  for (const message of messages) {
    const result = await store.recordInbound(message);
    if (result.duplicate) continue;
    const useSafeReply = options.shouldUseSafeReply ? await options.shouldUseSafeReply(message) : true;
    if (!useSafeReply || !send || message.type !== "text") continue;
    const reply = getSafeReply(message.text, options.leadKeywords);
    if (!reply) continue;
    const sent = await send({ to: message.waId, text: reply, customerMessageTimestamp: message.timestamp, replyToMessageId: message.messageId });
    if (sent.sent && sent.messageId && store.recordOutbound) {
      await store.recordOutbound({ messageId: sent.messageId, waId: message.waId, text: reply, timestamp: Math.floor(Date.now() / 1000) });
    }
  }
  for (const status of statuses) await store.updateMessageStatus(status.messageId, status.status, status.error);
  return { messages: messages.length, statuses: statuses.length };
}
