/**
 * Pure model behind the message composer.
 *
 * Everything here is text and numbers: cursor arithmetic for emoji insertion, the `/`
 * saved-reply trigger, the recording clock, the auto-resize clamp, and the rolling
 * waveform history. It lives apart from `ReplyComposer.tsx` so each rule can be tested
 * without a DOM, matching the other `*Model` modules in this console.
 */
import type { WhatsAppQuickReply } from "./quickRepliesModel";

/** Replaces the current selection (or inserts at the caret) and reports the new caret. */
export function insertIntoDraft(input: {
  value: string;
  start: number;
  end: number;
  insert: string;
}): { value: string; cursor: number } {
  const length = input.value.length;
  const rawStart = Number.isFinite(input.start) ? input.start : length;
  const rawEnd = Number.isFinite(input.end) ? input.end : rawStart;
  const start = Math.min(Math.max(rawStart, 0), length);
  const end = Math.min(Math.max(Math.max(rawEnd, start), 0), length);

  const value = `${input.value.slice(0, start)}${input.insert}${input.value.slice(end)}`;
  return { value, cursor: start + input.insert.length };
}

/**
 * The `/` saved-reply trigger.
 *
 * Only fires while the whole draft is one slash token, which is how the operator types a
 * shortcut in practice and keeps a "/" inside a sentence — "20/hour", a URL — from
 * hijacking the composer.
 */
export function getQuickReplyQuery(draft: string): string | null {
  const match = /^\/([A-Za-z0-9-]*)$/.exec(draft);
  return match ? match[1].toLowerCase() : null;
}

export function filterQuickReplies(replies: WhatsAppQuickReply[], query: string) {
  if (!query) return replies;
  const needle = query.toLowerCase();
  const starts = replies.filter((reply) => reply.shortcut.toLowerCase().startsWith(needle));
  if (starts.length) return starts;
  return replies.filter((reply) =>
    [reply.shortcut, reply.title, reply.body, reply.category].some((value) => value.toLowerCase().includes(needle)),
  );
}

/**
 * Applies a saved reply to the draft: the slash token is replaced outright, anything else
 * gets the body appended a blank line down, which is how the previous chip row behaved.
 */
export function applyQuickReply(draft: string, body: string) {
  if (getQuickReplyQuery(draft) !== null) return body;
  const trimmed = draft.trimEnd();
  return trimmed ? `${trimmed}\n\n${body}` : body;
}

/**
 * Enter sends, Shift+Enter makes a newline — and an Enter that is committing an IME
 * composition (Japanese, Chinese, Korean, or a mobile suggestion strip) does neither,
 * because that keystroke belongs to the input method, not to us.
 */
export function shouldSendOnKey(event: { key: string; shiftKey?: boolean; isComposing?: boolean }) {
  if (event.isComposing) return false;
  return event.key === "Enter" && event.shiftKey !== true;
}

export const COMPOSER_MIN_HEIGHT = 24;
/** Four lines at the composer's 24px line height, then it scrolls instead of growing. */
export const COMPOSER_MAX_HEIGHT = 96;

export function clampComposerHeight(
  scrollHeight: number,
  bounds: { min?: number; max?: number } = {},
) {
  const min = bounds.min ?? COMPOSER_MIN_HEIGHT;
  const max = bounds.max ?? COMPOSER_MAX_HEIGHT;
  if (!Number.isFinite(scrollHeight)) return min;
  return Math.min(Math.max(Math.ceil(scrollHeight), min), max);
}

export function isComposerScrolling(scrollHeight: number, max = COMPOSER_MAX_HEIGHT) {
  return Number.isFinite(scrollHeight) && scrollHeight > max;
}

/** `00:08`, and `12:05` past a minute. Minutes are not capped: a long note still reads. */
export function formatRecordingDuration(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export const WAVEFORM_BAR_COUNT = 28;

/**
 * Appends one measured input level to the rolling waveform, oldest dropped.
 *
 * Levels are real microphone amplitude, not decoration — a silent room draws a flat line,
 * which is exactly the feedback an operator needs before sending a note nobody can hear.
 * The floor keeps a bar visible so the strip does not look broken while it is working.
 */
export function pushWaveformLevel(history: number[], level: number, size = WAVEFORM_BAR_COUNT) {
  const safe = Number.isFinite(level) ? Math.min(Math.max(level, 0), 1) : 0;
  const next = [...history, Math.max(safe, 0.04)];
  return next.length > size ? next.slice(next.length - size) : next;
}

export function createWaveformHistory(size = WAVEFORM_BAR_COUNT) {
  return Array.from({ length: size }, () => 0.04);
}

/** Root-mean-square of a byte-domain sample, scaled so speech lands near the top. */
export function measureWaveformLevel(samples: ArrayLike<number>) {
  if (!samples.length) return 0;
  let total = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const centred = (samples[index] - 128) / 128;
    total += centred * centred;
  }
  const rms = Math.sqrt(total / samples.length);
  return Math.min(1, rms * 3.2);
}

/**
 * The quoted-message panel above the editor.
 *
 * Structural input rather than the page's row type, so this stays a pure module: anything
 * importing the icon set cannot be loaded by the test runner.
 */
export type WhatsAppQuotableMessage = {
  whatsapp_message_id?: string;
  direction: "inbound" | "outbound";
  message_type?: string;
  message_text?: string;
  media_filename?: string;
};

export type WhatsAppReplyQuote = {
  /** The wamid Meta will be asked to quote. Validated again server-side before it is used. */
  messageId: string;
  /** "You" for our own messages, the contact's name for theirs. */
  authorLabel: string;
  excerpt: string;
};

export const WHATSAPP_REPLY_QUOTE_MAX = 140;

/** What a media message reads as in the quote strip when it carries no caption. */
const QUOTED_MEDIA_LABELS: Record<string, string> = {
  audio: "Voice note",
  image: "Photo",
  video: "Video",
  document: "Document",
  sticker: "Sticker",
  location: "Location",
  contacts: "Contact",
};

/**
 * Builds the quote strip for one message, or null when it cannot be quoted.
 *
 * A message with no WhatsApp id has never reached Meta, so there is nothing for `context`
 * to point at — offering Reply on it would be a button that always fails.
 */
export function buildWhatsAppReplyQuote(
  message: WhatsAppQuotableMessage,
  contactLabel: string,
): WhatsAppReplyQuote | null {
  const messageId = message.whatsapp_message_id?.trim();
  if (!messageId) return null;

  const text = message.message_text?.trim();
  const fallback =
    QUOTED_MEDIA_LABELS[String(message.message_type)] || message.media_filename?.trim() || "Message";

  return {
    messageId,
    authorLabel: message.direction === "outbound" ? "You" : contactLabel.trim() || "Customer",
    excerpt: truncateQuoteExcerpt(text || fallback),
  };
}

/** One line, collapsed whitespace, ellipsis on a word boundary where there is one. */
export function truncateQuoteExcerpt(value: string, max = WHATSAPP_REPLY_QUOTE_MAX) {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
