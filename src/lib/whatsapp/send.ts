import { isFreeformReplyAllowed } from "./classify";

type WhatsAppEnvironment = Record<string, string | undefined>;

type SendOptions = {
  env?: WhatsAppEnvironment;
  fetch?: typeof globalThis.fetch;
  now?: number;
};

type SendInput = {
  to: string;
  text: string;
  customerMessageTimestamp: number;
  replyToMessageId?: string;
};

export type SendResult =
  | { sent: true; messageId: string }
  | { sent: false; reason: "NOT_CONFIGURED" | "SERVICE_WINDOW_CLOSED" | "API_ERROR" };

export async function sendWhatsAppText(input: SendInput, options: SendOptions = {}): Promise<SendResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return { sent: false, reason: "NOT_CONFIGURED" };
  if (!isFreeformReplyAllowed(input.customerMessageTimestamp, options.now)) return { sent: false, reason: "SERVICE_WINDOW_CLOSED" };

  const apiVersion = env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v25.0";
  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: "text",
          text: { body: input.text },
          ...(input.replyToMessageId ? { context: { message_id: input.replyToMessageId } } : {}),
        }),
      }
    );
    if (!response.ok) {
      console.error("WhatsApp Cloud API send failed", { status: response.status });
      return { sent: false, reason: "API_ERROR" };
    }
    const body = (await response.json()) as { messages?: Array<{ id?: string }> };
    const messageId = body.messages?.[0]?.id;
    if (!messageId) return { sent: false, reason: "API_ERROR" };
    return { sent: true, messageId };
  } catch {
    console.error("WhatsApp Cloud API send request failed");
    return { sent: false, reason: "API_ERROR" };
  }
}
