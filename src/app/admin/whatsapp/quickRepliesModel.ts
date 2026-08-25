/**
 * Pure model for WhatsApp quick replies — saved snippets the team inserts into an
 * inbox reply.
 *
 * The validation here mirrors the CHECK constraints in
 * `supabase/migrations/202608250001_whatsapp_quick_replies.sql` exactly, so the UI
 * rejects bad input with a readable message instead of surfacing a database error.
 * If you change one, change the other.
 */
export type WhatsAppQuickReply = {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  created_at?: string;
  updated_at?: string;
};

export const WHATSAPP_QUICK_REPLY_LIMITS = {
  shortcutMax: 32,
  titleMax: 80,
  bodyMax: 1024,
} as const;

const SHORTCUT_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export type WhatsAppQuickReplyInput = {
  shortcut: string;
  title: string;
  body: string;
};

export type WhatsAppQuickReplyValidation =
  | { ok: true; value: WhatsAppQuickReplyInput }
  | { ok: false; error: string };

/**
 * Normalises a shortcut into the stored form: lowercase, spaces and underscores
 * become hyphens, and anything else is dropped. A leading "/" is accepted because
 * that is how people naturally type one.
 */
export function normalizeWhatsAppQuickReplyShortcut(input: string | undefined | null) {
  if (!input) return "";
  return input
    .trim()
    .replace(/^\/+/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, WHATSAPP_QUICK_REPLY_LIMITS.shortcutMax);
}

export function validateWhatsAppQuickReplyInput(input: {
  shortcut?: unknown;
  title?: unknown;
  body?: unknown;
}): WhatsAppQuickReplyValidation {
  if (typeof input.shortcut !== "string" || typeof input.title !== "string" || typeof input.body !== "string") {
    return { ok: false, error: "A shortcut, title, and message are all required." };
  }

  const shortcut = normalizeWhatsAppQuickReplyShortcut(input.shortcut);
  const title = input.title.trim();
  const body = input.body.trim();

  if (!shortcut) {
    return { ok: false, error: "Use a shortcut of letters, numbers, or hyphens — for example \"pricing\"." };
  }
  if (!SHORTCUT_PATTERN.test(shortcut)) {
    return { ok: false, error: "Use a shortcut of letters, numbers, or hyphens — for example \"pricing\"." };
  }
  if (!title) {
    return { ok: false, error: "Give this quick reply a short title." };
  }
  if (title.length > WHATSAPP_QUICK_REPLY_LIMITS.titleMax) {
    return { ok: false, error: `Keep the title under ${WHATSAPP_QUICK_REPLY_LIMITS.titleMax} characters.` };
  }
  if (!body) {
    return { ok: false, error: "Write the message this quick reply should insert." };
  }
  if (body.length > WHATSAPP_QUICK_REPLY_LIMITS.bodyMax) {
    return { ok: false, error: `Keep the message under ${WHATSAPP_QUICK_REPLY_LIMITS.bodyMax} characters.` };
  }

  return { ok: true, value: { shortcut, title, body } };
}

export function normalizeWhatsAppQuickReplyRow(row: Record<string, unknown>): WhatsAppQuickReply {
  return {
    id: String(row.id),
    shortcut: String(row.shortcut || ""),
    title: String(row.title || ""),
    body: String(row.body || ""),
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function sortWhatsAppQuickReplies(replies: WhatsAppQuickReply[]) {
  return [...replies].sort((left, right) => left.shortcut.localeCompare(right.shortcut));
}
