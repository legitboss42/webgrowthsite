export type WhatsAppQuickReplyScope = "TEAM" | "PERSONAL";

export type WhatsAppQuickReply = {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  scope: WhatsAppQuickReplyScope;
  category: string;
  owner_member_id?: string;
  created_by_member_id?: string;
  created_at?: string;
  updated_at?: string;
};

export const WHATSAPP_QUICK_REPLY_LIMITS = {
  shortcutMax: 32,
  titleMax: 80,
  bodyMax: 1024,
  categoryMax: 50,
} as const;

export const WHATSAPP_QUICK_REPLY_DEFAULT_CATEGORIES = [
  "General",
  "Greetings",
  "Sales",
  "Pricing",
  "Support",
  "Follow-up",
  "Appointments",
  "Payments",
  "Documents",
] as const;

const SHORTCUT_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export type WhatsAppQuickReplyInput = {
  shortcut: string;
  title: string;
  body: string;
  scope: WhatsAppQuickReplyScope;
  category: string;
};

export type WhatsAppQuickReplyValidation =
  | { ok: true; value: WhatsAppQuickReplyInput }
  | { ok: false; error: string };

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

export function normalizeWhatsAppQuickReplyScope(input: unknown): WhatsAppQuickReplyScope | null {
  if (input === "TEAM" || input === "PERSONAL") return input;
  return null;
}

export function normalizeWhatsAppQuickReplyCategory(input: unknown) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ").slice(0, WHATSAPP_QUICK_REPLY_LIMITS.categoryMax);
}

export function validateWhatsAppQuickReplyInput(input: {
  shortcut?: unknown;
  title?: unknown;
  body?: unknown;
  scope?: unknown;
  category?: unknown;
}): WhatsAppQuickReplyValidation {
  if (typeof input.shortcut !== "string" || typeof input.title !== "string" || typeof input.body !== "string") {
    return { ok: false, error: "A shortcut, title, and message are all required." };
  }

  const shortcut = normalizeWhatsAppQuickReplyShortcut(input.shortcut);
  const title = input.title.trim();
  const body = input.body.trim();
  const scope = normalizeWhatsAppQuickReplyScope(input.scope ?? "TEAM");
  const category = normalizeWhatsAppQuickReplyCategory(input.category ?? "General");

  if (!shortcut || !SHORTCUT_PATTERN.test(shortcut)) {
    return { ok: false, error: "Use a shortcut of letters, numbers, or hyphens — for example \"pricing\"." };
  }
  if (!title) return { ok: false, error: "Give this saved reply a short title." };
  if (title.length > WHATSAPP_QUICK_REPLY_LIMITS.titleMax) {
    return { ok: false, error: `Keep the title under ${WHATSAPP_QUICK_REPLY_LIMITS.titleMax} characters.` };
  }
  if (!body) return { ok: false, error: "Write the message this saved reply should insert." };
  if (body.length > WHATSAPP_QUICK_REPLY_LIMITS.bodyMax) {
    return { ok: false, error: `Keep the message under ${WHATSAPP_QUICK_REPLY_LIMITS.bodyMax} characters.` };
  }
  if (!scope) return { ok: false, error: "Choose Team or Personal for this saved reply." };
  if (!category) return { ok: false, error: "Give this saved reply a category." };
  if (category.length > WHATSAPP_QUICK_REPLY_LIMITS.categoryMax) {
    return { ok: false, error: `Keep the category under ${WHATSAPP_QUICK_REPLY_LIMITS.categoryMax} characters.` };
  }

  return { ok: true, value: { shortcut, title, body, scope, category } };
}

export function normalizeWhatsAppQuickReplyRow(row: Record<string, unknown>): WhatsAppQuickReply {
  return {
    id: String(row.id),
    shortcut: String(row.shortcut || ""),
    title: String(row.title || ""),
    body: String(row.body || ""),
    scope: row.scope === "PERSONAL" ? "PERSONAL" : "TEAM",
    category: typeof row.category === "string" && row.category.trim() ? row.category.trim() : "General",
    owner_member_id: typeof row.owner_member_id === "string" ? row.owner_member_id : undefined,
    created_by_member_id: typeof row.created_by_member_id === "string" ? row.created_by_member_id : undefined,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export function sortWhatsAppQuickReplies(replies: WhatsAppQuickReply[]) {
  return [...replies].sort((left, right) => {
    if (left.scope !== right.scope) return left.scope === "TEAM" ? -1 : 1;
    const category = left.category.localeCompare(right.category);
    if (category !== 0) return category;
    return left.shortcut.localeCompare(right.shortcut);
  });
}

export function canUseWhatsAppQuickReply(reply: WhatsAppQuickReply, memberId: string | null) {
  return reply.scope === "TEAM" || Boolean(memberId && reply.owner_member_id === memberId);
}
