import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_EMOJI_CATEGORIES,
  WHATSAPP_EMOJI_RECENTS_MAX,
  WHATSAPP_EMOJI_RECENTS_TAB,
  WHATSAPP_EMOJI_RECENTS_TAB_ID,
  addEmojiRecent,
  isKnownWhatsAppEmoji,
  parseStoredEmojiRecents,
} from "./emojiModel";

test("every category is populated and has a tab glyph", () => {
  assert.ok(WHATSAPP_EMOJI_CATEGORIES.length >= 4);
  for (const category of WHATSAPP_EMOJI_CATEGORIES) {
    assert.ok(category.id, "category needs an id");
    assert.ok(category.label, `${category.id} needs a label`);
    assert.ok(category.tab, `${category.id} needs a tab glyph`);
    assert.ok(category.emoji.length >= 20, `${category.id} is too thin to browse`);
  }
});

test("category ids are unique so the tab strip cannot collide", () => {
  const ids = WHATSAPP_EMOJI_CATEGORIES.map((category) => category.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the frequently-used tab cannot be shadowed by a real category", () => {
  assert.ok(WHATSAPP_EMOJI_RECENTS_TAB);
  const ids = WHATSAPP_EMOJI_CATEGORIES.map((category) => category.id);
  assert.ok(!ids.includes(WHATSAPP_EMOJI_RECENTS_TAB_ID));
});

test("no glyph is listed in two categories", () => {
  const seen = new Set<string>();
  for (const category of WHATSAPP_EMOJI_CATEGORIES) {
    for (const emoji of category.emoji) {
      assert.ok(!seen.has(emoji), `${emoji} appears twice`);
      seen.add(emoji);
    }
  }
});

test("isKnownWhatsAppEmoji recognises the list and nothing else", () => {
  assert.equal(isKnownWhatsAppEmoji("👍"), true);
  assert.equal(isKnownWhatsAppEmoji("not-an-emoji"), false);
});

test("parseStoredEmojiRecents survives anything a person can put in storage", () => {
  assert.deepEqual(parseStoredEmojiRecents(null), []);
  assert.deepEqual(parseStoredEmojiRecents(""), []);
  assert.deepEqual(parseStoredEmojiRecents("{not json"), []);
  assert.deepEqual(parseStoredEmojiRecents('{"a":1}'), []);
  assert.deepEqual(parseStoredEmojiRecents('["👍", 7, null, "nope", "👍", "❤️"]'), ["👍", "❤️"]);
});

test("parseStoredEmojiRecents caps the frequently-used row", () => {
  const many = WHATSAPP_EMOJI_CATEGORIES[0].emoji.slice(0, WHATSAPP_EMOJI_RECENTS_MAX + 6);
  assert.equal(parseStoredEmojiRecents(JSON.stringify(many)).length, WHATSAPP_EMOJI_RECENTS_MAX);
});

test("addEmojiRecent promotes the newest pick without duplicating it", () => {
  assert.deepEqual(addEmojiRecent(["❤️", "👍"], "👍"), ["👍", "❤️"]);
  assert.deepEqual(addEmojiRecent([], "👍"), ["👍"]);
  // An unknown glyph cannot get in, so a stale storage value cannot poison the row.
  assert.deepEqual(addEmojiRecent(["👍"], "not-an-emoji"), ["👍"]);
  assert.deepEqual(addEmojiRecent(["❤️", "😀"], "👍", 2), ["👍", "❤️"]);
});
