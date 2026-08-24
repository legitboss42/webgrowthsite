import { sendWhatsAppText, type SendResult } from "./send";
import type { WhatsAppStore } from "./store";

type InboxReplySend = (
  input: {
    to: string;
    text: string;
    customerMessageTimestamp: number;
    replyToMessageId?: string;
  },
  options?: { now?: number },
) => Promise<SendResult>;

export type InboxReplyInput = {
  conversationId: string;
  waId: string;
  text: string;
  customerMessageTimestamp: number;
  replyToMessageId?: string;
};

export type InboxReplyResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: Extract<SendResult, { sent: false }>["reason"] };

export async function sendInboxWhatsAppReply(
  input: InboxReplyInput,
  options: {
    store: WhatsAppStore;
    send?: InboxReplySend;
    now?: number;
  },
): Promise<InboxReplyResult> {
  const text = input.text.trim();
  const send = options.send || sendWhatsAppText;
  const result = await send(
    {
      to: input.waId,
      text,
      customerMessageTimestamp: input.customerMessageTimestamp,
      replyToMessageId: input.replyToMessageId,
    },
    { now: options.now },
  );

  if (!result.sent) return { ok: false, reason: result.reason };

  await options.store.recordOutbound({
    conversationId: input.conversationId,
    messageId: result.messageId,
    waId: input.waId,
    text,
    timestamp: options.now || Math.floor(Date.now() / 1000),
  });

  return { ok: true, messageId: result.messageId };
}
