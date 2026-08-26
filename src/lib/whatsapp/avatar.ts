/**
 * Deterministic fallback avatars for WhatsApp customers.
 *
 * The Cloud API does not hand us a customer's WhatsApp profile photo. A webhook
 * contact carries a profile name and a wa_id and nothing else, and there is no Graph
 * endpoint that returns a customer picture. So the console never attempts to fetch
 * one — repeatedly asking for something the API does not expose would just add
 * latency and noise. Instead the appearance is derived from what we already store.
 *
 * The colour is keyed on the wa_id alone, so one person keeps the same avatar in the
 * conversation list, the chat header, the contact panel and the contacts table, and
 * keeps it even after their display name changes. Initials come from the name,
 * because a name is what an operator actually recognises.
 */

/**
 * Background and foreground pairs, written as literal class strings so Tailwind's
 * scanner sees them. Every entry is on the Growth Ledger green ramp (plus brass) and
 * every pair clears 4.5:1, so the initials stay readable in each tone.
 */
export const WHATSAPP_AVATAR_TONES = [
  "bg-ledger-deep text-white",
  "bg-ledger text-white",
  "bg-[#17683f] text-white",
  "bg-ledger-bright text-white",
  "bg-[#3f9d70] text-ledger-deep",
  "bg-brass text-ink",
] as const;

export type WhatsAppAvatarTone = (typeof WHATSAPP_AVATAR_TONES)[number];

export type WhatsAppAvatarIdentity = {
  displayName?: string | null;
  businessName?: string | null;
  waId?: string | null;
};

export type WhatsAppAvatar = {
  /** One or two characters. Never empty. */
  initials: string;
  /** Index behind the tone. Exposed so a test can assert stability directly. */
  toneIndex: number;
  /** Tailwind background/foreground pair for this identity. */
  tone: WhatsAppAvatarTone;
  /** Readable name, or a neutral stand-in. Used for tooltips and aria labels. */
  name: string;
};

/**
 * FNV-1a, 32-bit. Dependency free and defined purely by arithmetic, so the same
 * wa_id maps to the same tone on every runtime, every render and every deploy.
 */
export function hashWhatsAppIdentity(identity: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * "Victor Chinukwue" becomes VC, "Victor" becomes V. With no usable name it falls
 * back to the last two digits of the number, which is what an operator reads off the
 * conversation list anyway.
 */
export function getWhatsAppAvatarInitials(identity: WhatsAppAvatarIdentity): string {
  const name = (identity.displayName || identity.businessName || "").trim();
  if (name) {
    const initials = name
      .split(/\s+/)
      .filter((word) => LETTER_OR_DIGIT.test(word))
      .slice(0, 2)
      .map((word) => [...word].find((character) => LETTER_OR_DIGIT.test(character)) || "")
      .join("");
    if (initials) return initials.toLocaleUpperCase();
  }

  const digits = (identity.waId || "").replace(/\D/g, "");
  if (digits.length >= 2) return digits.slice(-2);
  if (digits.length === 1) return digits;
  return "??";
}

/** The readable name behind an avatar, or a neutral stand-in when there is none. */
export function getWhatsAppAvatarName(identity: WhatsAppAvatarIdentity): string {
  const name = (identity.displayName || identity.businessName || "").trim();
  if (name) return name;
  const waId = (identity.waId || "").trim();
  return waId || "Unknown contact";
}

export function buildWhatsAppAvatar(identity: WhatsAppAvatarIdentity): WhatsAppAvatar {
  const initials = getWhatsAppAvatarInitials(identity);
  // Keyed on the wa_id so renaming a contact never reshuffles their colour. With no
  // wa_id the initials are the only stable thing left to key on.
  const key = (identity.waId || "").trim() || initials;
  const toneIndex = hashWhatsAppIdentity(key) % WHATSAPP_AVATAR_TONES.length;

  return {
    initials,
    toneIndex,
    tone: WHATSAPP_AVATAR_TONES[toneIndex],
    name: getWhatsAppAvatarName(identity),
  };
}
