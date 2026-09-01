export type WhatsAppQuickReplyScope = "TEAM" | "PERSONAL";
export type WhatsAppQuickReplyMediaKind = "image" | "video" | "document" | "audio";

export type WhatsAppQuickReply = {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  scope: WhatsAppQuickReplyScope;
  category: string;
  owner_member_id?: string;
  created_by_member_id?: string;
  media_kind?: WhatsAppQuickReplyMediaKind;
  media_path?: string;
  media_filename?: string;
  media_mime_type?: string;
  media_size?: number;
  created_at?: string;
  updated_at?: string;
};

export type WhatsAppQuickReplyVariableContext = {
  fullName?: string;
  company?: string;
  phone?: string;
  email?: string;
  agentName?: string;
  customFields?: Record<string, string>;
};

export type WhatsAppQuickReplyResolution = {
  text: string;
  missing: string[];
  used: string[];
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

export const WHATSAPP_QUICK_REPLY_VARIABLES = [
  "first_name",
  "full_name",
  "company",
  "phone",
  "email",
  "agent_name",
] as const;

const SHORTCUT_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;
const VARIABLE_PATTERN = /{{\s*([^{}]+?)\s*}}/g;

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

  return { ok: true, value: { shortcut, title, body, scope, category } };
}

function normalizeMediaKind(value: unknown): WhatsAppQuickReplyMediaKind | undefined {
  return value === "image" || value === "video" || value === "document" || value === "audio"
    ? value
    : undefined;
}

export function normalizeWhatsAppQuickReplyRow(row: Record<string, unknown>): WhatsAppQuickReply {
  const mediaKind = normalizeMediaKind(row.media_kind);
  const mediaPath = typeof row.media_path === "string" && row.media_path.trim() ? row.media_path.trim() : undefined;
  const mediaFilename = typeof row.media_filename === "string" && row.media_filename.trim() ? row.media_filename.trim() : undefined;
  const mediaMimeType = typeof row.media_mime_type === "string" && row.media_mime_type.trim() ? row.media_mime_type.trim() : undefined;
  const mediaSize = Number(row.media_size);

  return {
    id: String(row.id),
    shortcut: String(row.shortcut || ""),
    title: String(row.title || ""),
    body: String(row.body || ""),
    scope: row.scope === "PERSONAL" ? "PERSONAL" : "TEAM",
    category: typeof row.category === "string" && row.category.trim() ? row.category.trim() : "General",
    owner_member_id: typeof row.owner_member_id === "string" ? row.owner_member_id : undefined,
    created_by_member_id: typeof row.created_by_member_id === "string" ? row.created_by_member_id : undefined,
    media_kind: mediaKind,
    media_path: mediaKind && mediaPath ? mediaPath : undefined,
    media_filename: mediaKind && mediaFilename ? mediaFilename : undefined,
    media_mime_type: mediaKind && mediaMimeType ? mediaMimeType : undefined,
    media_size: mediaKind && Number.isFinite(mediaSize) && mediaSize > 0 ? mediaSize : undefined,
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

export function extractWhatsAppQuickReplyVariables(body: string) {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    const key = match[1]?.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    found.push(key);
  }
  return found;
}

function findCustomField(fields: Record<string, string> | undefined, key: string) {
  if (!fields) return "";
  if (typeof fields[key] === "string") return fields[key].trim();
  const wanted = key.toLowerCase();
  const match = Object.entries(fields).find(([field]) => field.toLowerCase() === wanted);
  return match?.[1]?.trim() || "";
}

function valueForVariable(key: string, context: WhatsAppQuickReplyVariableContext) {
  const normalized = key.toLowerCase();
  const fullName = context.fullName?.trim() || "";
  if (normalized === "first_name") return fullName.split(/\s+/)[0] || "";
  if (normalized === "full_name") return fullName;
  if (normalized === "company") return context.company?.trim() || "";
  if (normalized === "phone") return context.phone?.trim() || "";
  if (normalized === "email") return context.email?.trim() || "";
  if (normalized === "agent_name") return context.agentName?.trim() || "";
  if (normalized.startsWith("custom.")) return findCustomField(context.customFields, key.slice(key.indexOf(".") + 1));
  return "";
}

export function resolveWhatsAppQuickReplyVariables(
  body: string,
  context: WhatsAppQuickReplyVariableContext = {},
): WhatsAppQuickReplyResolution {
  const missing: string[] = [];
  const used: string[] = [];
  const missingSet = new Set<string>();
  const usedSet = new Set<string>();

  const text = body.replace(VARIABLE_PATTERN, (token, rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return token;
    if (!usedSet.has(key)) {
      usedSet.add(key);
      used.push(key);
    }
    const value = valueForVariable(key, context);
    if (value) return value;
    if (!missingSet.has(key)) {
      missingSet.add(key);
      missing.push(key);
    }
    return token;
  });

  return { text, missing, used };
}
