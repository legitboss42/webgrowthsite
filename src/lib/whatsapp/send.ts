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
  | {
      sent: false;
      reason:
        | "NOT_CONFIGURED"
        | "SERVICE_WINDOW_CLOSED"
        | "INVALID_RECIPIENT"
        | "TOKEN_EXPIRED"
        | "PERMISSION_DENIED"
        | "META_SERVICE_ERROR"
        | "API_ERROR";
      diagnostic?: { status?: number; code?: number; subcode?: number; traceId?: string };
    };

export function normalizeWhatsAppRecipient(value: string): string | null {
  const compact = value.trim().replace(/[\s()\-]/g, "");
  if (/^0[789]\d{9}$/.test(compact)) return `234${compact.slice(1)}`;
  if (/^\+234[789]\d{9}$/.test(compact)) return compact.slice(1);
  if (/^234[789]\d{9}$/.test(compact)) return compact;
  return null;
}

function classifyMetaFailure(status: number, payload: unknown): Extract<SendResult, { sent: false }> {
  const error = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: unknown }).error : undefined;
  const details = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const diagnostic = {
    status,
    ...(typeof details.code === "number" ? { code: details.code } : {}),
    ...(typeof details.error_subcode === "number" ? { subcode: details.error_subcode } : {}),
    ...(typeof details.fbtrace_id === "string" ? { traceId: details.fbtrace_id } : {}),
  };

  if (details.code === 190) return { sent: false, reason: "TOKEN_EXPIRED", diagnostic };
  if (status === 401 || status === 403 || details.code === 10 || details.code === 200) {
    return { sent: false, reason: "PERMISSION_DENIED", diagnostic };
  }
  if (status >= 500) return { sent: false, reason: "META_SERVICE_ERROR", diagnostic };
  return { sent: false, reason: "API_ERROR", diagnostic };
}

export async function sendWhatsAppText(input: SendInput, options: SendOptions = {}): Promise<SendResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return { sent: false, reason: "NOT_CONFIGURED" };
  if (!isFreeformReplyAllowed(input.customerMessageTimestamp, options.now)) return { sent: false, reason: "SERVICE_WINDOW_CLOSED" };
  const recipient = normalizeWhatsAppRecipient(input.to);
  if (!recipient) return { sent: false, reason: "INVALID_RECIPIENT" };

  const apiVersion = env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: { preview_url: false, body: input.text.trim() },
          ...(input.replyToMessageId ? { context: { message_id: input.replyToMessageId } } : {}),
        }),
      }
    );
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => undefined);
      const failure = classifyMetaFailure(response.status, payload);
      console.error("WhatsApp Cloud API send failed", failure.diagnostic);
      return failure;
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
