/**
 * Agent → customer typing indicator on the WhatsApp Cloud API.
 *
 * The request shape below was verified against the live account on v26.0 rather than
 * recalled: Meta's own JSON-schema validation names the field and publishes the enum
 * ("Your request has violated JSON schema constraint 'enum' for the JSON field
 * 'typing_indicator.type' ... expected : '[text]'"). Posting the same body with a
 * deliberately invalid message id returns the identical error as a plain read receipt
 * does, which is what confirms the `typing_indicator` field itself is accepted.
 *
 *   POST /{phone-number-id}/messages
 *   { messaging_product: "whatsapp",
 *     status: "read",
 *     message_id: "<a real inbound wamid>",
 *     typing_indicator: { type: "text" } }
 *
 * Two consequences follow from that shape and are not optional:
 *
 *  1. It needs a real inbound message id. There is no way to show typing to someone
 *     who has not messaged the business, which also means it can only ever appear
 *     inside an open service window.
 *  2. Meta bundles the indicator with the read receipt. Triggering typing therefore
 *     marks the customer's last message as read — the customer sees their own blue
 *     ticks. That is Meta's behaviour, not a choice this module makes, and the
 *     composer says so on screen.
 *
 * Meta dismisses the indicator when a message is sent or after roughly 25 seconds,
 * so a long draft needs an occasional refresh rather than one call per keystroke.
 *
 * Never import this into a client component — the browser must not hold the token.
 */

export type WhatsAppTypingResult =
  | { sent: true }
  | {
      sent: false;
      reason:
        | "NOT_CONFIGURED"
        | "INVALID_MESSAGE_ID"
        | "TOKEN_EXPIRED"
        | "PERMISSION_DENIED"
        | "META_SERVICE_ERROR"
        | "API_ERROR";
    };

/**
 * How long a single indicator is treated as still showing. Comfortably inside Meta's
 * ~25 second dismissal so a continuous draft never flickers, and long enough that a
 * fast typist generates a handful of calls per minute rather than hundreds.
 */
export const WHATSAPP_TYPING_REFRESH_MS = 8_000;

/**
 * The throttle, as a pure decision so it can be tested without a browser.
 *
 * Fires on the first keystroke of a draft and then at most once per refresh window.
 * An emptied draft stops firing entirely — there is nothing to indicate.
 */
export function shouldSendWhatsAppTypingSignal(input: {
  hasDraft: boolean;
  lastSentAt?: number;
  now: number;
  refreshMs?: number;
}): boolean {
  if (!input.hasDraft) return false;
  if (input.lastSentAt === undefined) return true;
  return input.now - input.lastSentAt >= (input.refreshMs ?? WHATSAPP_TYPING_REFRESH_MS);
}

type TypingOptions = {
  env?: Record<string, string | undefined>;
  fetch?: typeof globalThis.fetch;
};

function classifyTypingFailure(
  status: number,
  payload: unknown,
): Extract<WhatsAppTypingResult, { sent: false }> {
  const error = (payload as { error?: { code?: number; message?: string } } | null)?.error;
  const code = typeof error?.code === "number" ? error.code : undefined;

  if (code === 190) return { sent: false, reason: "TOKEN_EXPIRED" };
  if (status === 401 || status === 403 || code === 10 || code === 200) {
    return { sent: false, reason: "PERMISSION_DENIED" };
  }
  // 131009 is what Meta returns when the wamid is not one it can attach a receipt
  // to — usually because the message is too old or belongs to another number.
  if (code === 131009 || code === 100) return { sent: false, reason: "INVALID_MESSAGE_ID" };
  if (status >= 500) return { sent: false, reason: "META_SERVICE_ERROR" };
  return { sent: false, reason: "API_ERROR" };
}

/**
 * Shows the typing indicator to the customer who sent `messageId`.
 *
 * Resolves rather than throws on every failure path. The caller treats typing as
 * decorative: a failure here must never be allowed to interfere with sending the
 * actual message.
 */
export async function sendWhatsAppTypingIndicator(
  input: { messageId: string },
  options: TypingOptions = {},
): Promise<WhatsAppTypingResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return { sent: false, reason: "NOT_CONFIGURED" };

  const messageId = input.messageId.trim();
  if (!messageId) return { sent: false, reason: "INVALID_MESSAGE_ID" };

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
          typing_indicator: { type: "text" },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      // Logged server-side only. The route returns the reason code, never this body.
      console.warn("WhatsApp typing indicator refused", response.status);
      return classifyTypingFailure(response.status, payload);
    }

    return { sent: true };
  } catch (error) {
    console.warn("Unable to reach Meta for the WhatsApp typing indicator", error);
    return { sent: false, reason: "API_ERROR" };
  }
}
