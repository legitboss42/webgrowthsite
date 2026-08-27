import { sendWhatsAppAudio, sendWhatsAppMedia, sendWhatsAppText, type SendResult } from "./send";
import type { WhatsAppMediaKind } from "./media";
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

type InboxAudioReplySend = (
  input: {
    to: string;
    audio: Blob;
    filename: string;
    mimeType: string;
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

export type InboxAudioReplyInput = {
  conversationId: string;
  waId: string;
  audio: Blob;
  filename: string;
  mimeType: string;
  customerMessageTimestamp: number;
  replyToMessageId?: string;
};

export type InboxReplyResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: Extract<SendResult, { sent: false }>["reason"] };

export type InboxAudioReplyResult =
  | { ok: true; messageId: string; mediaId: string }
  | { ok: false; reason: Extract<SendResult, { sent: false }>["reason"] };

type InboxMediaReplySend = (
  input: {
    to: string;
    kind: WhatsAppMediaKind;
    file: Blob;
    filename: string;
    mimeType: string;
    caption?: string;
    customerMessageTimestamp: number;
    replyToMessageId?: string;
  },
  options?: { now?: number },
) => Promise<SendResult>;

export type InboxMediaReplyInput = {
  conversationId: string;
  waId: string;
  kind: WhatsAppMediaKind;
  file: Blob;
  filename: string;
  mimeType: string;
  caption?: string;
  customerMessageTimestamp: number;
  replyToMessageId?: string;
};

export type InboxMediaReplyResult = InboxAudioReplyResult;

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

export async function sendInboxWhatsAppAudioReply(
  input: InboxAudioReplyInput,
  options: {
    store: WhatsAppStore;
    send?: InboxAudioReplySend;
    now?: number;
  },
): Promise<InboxAudioReplyResult> {
  const send = options.send || sendWhatsAppAudio;
  const result = await send(
    {
      to: input.waId,
      audio: input.audio,
      filename: input.filename,
      mimeType: input.mimeType,
      customerMessageTimestamp: input.customerMessageTimestamp,
      replyToMessageId: input.replyToMessageId,
    },
    { now: options.now },
  );

  if (!result.sent) return { ok: false, reason: result.reason };
  if (!result.mediaId) return { ok: false, reason: "API_ERROR" };

  await options.store.recordOutbound({
    conversationId: input.conversationId,
    messageId: result.messageId,
    waId: input.waId,
    timestamp: options.now || Math.floor(Date.now() / 1000),
    type: "audio",
    mediaId: result.mediaId,
    mediaMimeType: input.mimeType,
    mediaVoice: true,
    mediaFilename: input.filename,
  });

  return { ok: true, messageId: result.messageId, mediaId: result.mediaId };
}

/**
 * Attachments from the composer's `+` menu and paperclip: image, video, document, and
 * plain audio files.
 *
 * Separate from `sendInboxWhatsAppAudioReply` on purpose — that one always records a
 * voice note, and an uploaded MP3 is not one. The caption is stored as the message text
 * so the thread reads the same as it does on the customer's phone.
 */
export async function sendInboxWhatsAppMediaReply(
  input: InboxMediaReplyInput,
  options: {
    store: WhatsAppStore;
    send?: InboxMediaReplySend;
    now?: number;
  },
): Promise<InboxMediaReplyResult> {
  const send = options.send || sendWhatsAppMedia;
  const caption = input.caption?.trim() || "";
  const result = await send(
    {
      to: input.waId,
      kind: input.kind,
      file: input.file,
      filename: input.filename,
      mimeType: input.mimeType,
      caption,
      customerMessageTimestamp: input.customerMessageTimestamp,
      replyToMessageId: input.replyToMessageId,
    },
    { now: options.now },
  );

  if (!result.sent) return { ok: false, reason: result.reason };
  if (!result.mediaId) return { ok: false, reason: "API_ERROR" };

  await options.store.recordOutbound({
    conversationId: input.conversationId,
    messageId: result.messageId,
    waId: input.waId,
    timestamp: options.now || Math.floor(Date.now() / 1000),
    type: input.kind,
    text: caption || undefined,
    mediaId: result.mediaId,
    mediaMimeType: input.mimeType,
    mediaVoice: false,
    mediaFilename: input.filename,
  });

  return { ok: true, messageId: result.messageId, mediaId: result.mediaId };
}
