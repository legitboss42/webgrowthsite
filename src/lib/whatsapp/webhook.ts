import { createHmac, timingSafeEqual } from "node:crypto";

export type NormalizedIncomingMessage = {
  messageId: string;
  waId: string;
  displayName?: string;
  text?: string;
  timestamp: number;
  type: string;
};

export type NormalizedStatus = {
  messageId: string;
  waId?: string;
  status: string;
  timestamp: number;
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
        const item = asRecord(message); const text = asRecord(item?.text);
        if (typeof item?.id !== "string" || typeof item?.from !== "string" || typeof item?.timestamp !== "string" || typeof item?.type !== "string") continue;
        messages.push({ messageId: item.id, waId: item.from, displayName: names.get(item.from), text: typeof text?.body === "string" ? text.body : undefined, timestamp: Number(item.timestamp), type: item.type });
      }
      if (Array.isArray(value.statuses)) for (const status of value.statuses) {
        const item = asRecord(status);
        if (typeof item?.id !== "string" || typeof item?.status !== "string" || typeof item?.timestamp !== "string") continue;
        statuses.push({ messageId: item.id, waId: typeof item.recipient_id === "string" ? item.recipient_id : undefined, status: item.status, timestamp: Number(item.timestamp) });
      }
    }
  }
  return { messages, statuses };
}
