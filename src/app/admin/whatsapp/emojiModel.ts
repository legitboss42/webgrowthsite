/**
 * The emoji set and "frequently used" rule behind the composer's picker.
 *
 * A curated list rather than a package: a full emoji library is several hundred kilobytes
 * of data plus a component tree, and an inbox needs the emoji people actually send. Every
 * glyph here is a plain string, so there is nothing to load, nothing to hydrate, and no
 * dependency to keep current.
 */
export type WhatsAppEmojiCategory = {
  id: string;
  label: string;
  /** Shown on the category tab. An emoji, because that is what the tab is for. */
  tab: string;
  emoji: readonly string[];
};

export const WHATSAPP_EMOJI_CATEGORIES: readonly WhatsAppEmojiCategory[] = [
  {
    id: "smileys",
    label: "Smileys & people",
    tab: "😀",
    emoji: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤔", "🤨", "😐",
      "😑", "😶", "😏", "😒", "🙄", "😬", "😮", "😯", "😲", "🥺",
      "😢", "😭", "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱",
      "😴", "🤤", "😪", "😷", "🤒", "🤕", "🤠", "🥳", "😎", "🤓",
      "🫡", "🫠", "🥹", "😌", "😔", "😕", "🙁", "☹️", "😖", "😩",
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    tab: "👍",
    emoji: [
      "👍", "👎", "👌", "🤌", "✌️", "🤞", "🫰", "🤟", "🤘", "👏",
      "🙌", "🫶", "👐", "🤲", "🙏", "🤝", "💪", "✍️", "👋", "🖐️",
      "✋", "🖖", "👇", "👆", "👉", "👈", "☝️", "🫵", "🤙", "💅",
      "🧑‍💻", "👩‍💻", "👨‍💻", "🧑‍🍳", "👤", "👥", "🗣️", "👀", "🧠", "🫂",
    ],
  },
  {
    id: "hearts",
    label: "Hearts & symbols",
    tab: "❤️",
    emoji: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖",
      "💗", "💓", "💞", "💕", "💌", "💯", "✅", "☑️", "✔️", "❌",
      "⚠️", "❗", "❓", "‼️", "🔔", "🔕", "⭐", "🌟", "✨", "⚡",
      "🔥", "💥", "💫", "♻️", "🆗", "🆕", "🔒", "🔓", "🔗", "📌",
    ],
  },
  {
    id: "business",
    label: "Work & money",
    tab: "💼",
    emoji: [
      "💼", "📁", "📂", "🗂️", "📄", "📃", "📑", "🧾", "📊", "📈",
      "📉", "🗓️", "📅", "⏰", "⏳", "🕐", "📝", "✏️", "🖊️", "📋",
      "📎", "🖇️", "📐", "📏", "🔍", "🔎", "🏷️", "💰", "💵", "💳",
      "🧮", "🏦", "🤑", "💸", "🪙", "📦", "🚀", "🎯", "🏆", "🥇",
    ],
  },
  {
    id: "tech",
    label: "Tech & comms",
    tab: "📱",
    emoji: [
      "📱", "💻", "🖥️", "⌨️", "🖱️", "🖨️", "🌐", "📡", "🛰️", "🔌",
      "🔋", "💡", "🧩", "⚙️", "🛠️", "🔧", "🔨", "🧰", "🧪", "🔬",
      "📞", "☎️", "📲", "📧", "✉️", "📨", "📩", "📬", "📤", "📥",
      "💬", "🗨️", "💭", "🔊", "🔇", "🎙️", "🎧", "📹", "📷", "🖼️",
    ],
  },
  {
    id: "travel",
    label: "Places & travel",
    tab: "🌍",
    emoji: [
      "🌍", "🌎", "🌏", "🗺️", "🏠", "🏡", "🏢", "🏬", "🏭", "🏗️",
      "🏙️", "🌆", "🌃", "🌇", "🌉", "🚗", "🚕", "🚌", "🚚", "✈️",
      "🛫", "🛬", "🚆", "🚲", "🛵", "🚢", "⛽", "🗽", "🏝️", "⛰️",
      "☀️", "🌤️", "⛅", "🌧️", "⛈️", "🌈", "❄️", "🌙", "🌊", "🌱",
    ],
  },
  {
    id: "food",
    label: "Food & drink",
    tab: "☕",
    emoji: [
      "☕", "🍵", "🧉", "🥤", "🧊", "🍺", "🍻", "🥂", "🍷", "🥃",
      "🍽️", "🍕", "🍔", "🍟", "🌮", "🌯", "🥗", "🍜", "🍚", "🍲",
      "🍛", "🥘", "🍞", "🥐", "🧀", "🥚", "🍗", "🍖", "🐟", "🍤",
      "🍰", "🎂", "🍫", "🍪", "🍩", "🍿", "🍎", "🍌", "🍇", "🥑",
    ],
  },
  {
    id: "objects",
    label: "Activity & objects",
    tab: "🎉",
    emoji: [
      "🎉", "🎊", "🎈", "🎁", "🎀", "🏅", "🎵", "🎶", "🎨", "🎬",
      "🎤", "🎸", "🥁", "⚽", "🏀", "🏈", "🎾", "🏐", "🎮", "🕹️",
      "🎲", "♟️", "🧵", "🪄", "🔑", "🗝️", "🛎️", "🧹", "🪑", "🚪",
      "🕶️", "👕", "👟", "🎓", "💎", "🧿", "📚", "📖", "🗒️", "🖌️",
    ],
  },
];

/** Every glyph the picker offers, for validating what came out of storage. */
const KNOWN_EMOJI = new Set(WHATSAPP_EMOJI_CATEGORIES.flatMap((category) => [...category.emoji]));

export const WHATSAPP_EMOJI_RECENTS_KEY = "wg-whatsapp-composer-emoji-recents";
export const WHATSAPP_EMOJI_RECENTS_MAX = 20;

/**
 * The clock tab in the picker's tab strip. Deliberately not a category: its contents come
 * from what this operator has actually sent, so it has no fixed glyph list.
 */
export const WHATSAPP_EMOJI_RECENTS_TAB_ID = "recents";
export const WHATSAPP_EMOJI_RECENTS_TAB = "🕘";

/**
 * Reads the frequently-used row back out of storage.
 *
 * Defensive on purpose: this string is the only part of the composer a person can edit by
 * hand, so anything that is not a known glyph is dropped rather than rendered.
 */
export function parseStoredEmojiRecents(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const recents: string[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "string" || !KNOWN_EMOJI.has(entry) || seen.has(entry)) continue;
    seen.add(entry);
    recents.push(entry);
    if (recents.length >= WHATSAPP_EMOJI_RECENTS_MAX) break;
  }
  return recents;
}

/** Most recent first, no duplicates, oldest dropped past the cap. */
export function addEmojiRecent(recents: string[], emoji: string, max = WHATSAPP_EMOJI_RECENTS_MAX) {
  if (!KNOWN_EMOJI.has(emoji)) return recents;
  return [emoji, ...recents.filter((entry) => entry !== emoji)].slice(0, Math.max(1, max));
}

export function isKnownWhatsAppEmoji(value: string) {
  return KNOWN_EMOJI.has(value);
}
