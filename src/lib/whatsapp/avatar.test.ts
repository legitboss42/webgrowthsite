import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_AVATAR_TONES,
  buildWhatsAppAvatar,
  getWhatsAppAvatarInitials,
  getWhatsAppAvatarName,
  hashWhatsAppIdentity,
} from "./avatar";

test("the examples from the brief produce the expected initials", () => {
  assert.equal(getWhatsAppAvatarInitials({ displayName: "Victor Chinukwue" }), "VC");
  assert.equal(getWhatsAppAvatarInitials({ displayName: "Victor" }), "V");
});

test("a business name is used when there is no display name", () => {
  assert.equal(
    getWhatsAppAvatarInitials({ displayName: null, businessName: "Web Growth Digital Services" }),
    "WG",
  );
});

test("with no name at all the last two digits of the number stand in", () => {
  assert.equal(getWhatsAppAvatarInitials({ waId: "2348066706336" }), "36");
  assert.equal(getWhatsAppAvatarInitials({ displayName: "   ", waId: "+234 806 670 6336" }), "36");
  assert.equal(getWhatsAppAvatarInitials({ waId: "7" }), "7");
  assert.equal(getWhatsAppAvatarInitials({}), "??");
});

test("names that are only punctuation or emoji fall through to the number", () => {
  assert.equal(getWhatsAppAvatarInitials({ displayName: "-- ***", waId: "2348066706336" }), "36");
  assert.equal(getWhatsAppAvatarInitials({ displayName: "🙂", waId: "2348066706336" }), "36");
});

test("non-latin names keep their own first characters", () => {
  assert.equal(getWhatsAppAvatarInitials({ displayName: "Chinedu Ọkonkwo" }), "CỌ");
  assert.equal(getWhatsAppAvatarInitials({ displayName: "أحمد" }), "أ");
});

test("leading punctuation inside a word is skipped, not emitted", () => {
  assert.equal(getWhatsAppAvatarInitials({ displayName: "(Victor) [Chinukwue]" }), "VC");
});

test("more than two words still yield two initials", () => {
  assert.equal(getWhatsAppAvatarInitials({ displayName: "Mary Jane Watson Parker" }), "MJ");
});

test("the same wa_id always resolves to the same tone", () => {
  const first = buildWhatsAppAvatar({ displayName: "Victor Chinukwue", waId: "2348066706336" });
  const second = buildWhatsAppAvatar({ displayName: "Victor Chinukwue", waId: "2348066706336" });

  assert.equal(first.toneIndex, second.toneIndex);
  assert.equal(first.tone, second.tone);
});

test("renaming a contact never reshuffles their colour", () => {
  const before = buildWhatsAppAvatar({ displayName: "Victor", waId: "2348066706336" });
  const after = buildWhatsAppAvatar({ displayName: "Victor Chinukwue Jr", waId: "2348066706336" });

  assert.equal(before.toneIndex, after.toneIndex);
  assert.notEqual(before.initials, after.initials);
});

test("every tone is a real entry in the palette", () => {
  for (let index = 0; index < 200; index += 1) {
    const avatar = buildWhatsAppAvatar({ waId: `23480667063${index}` });
    assert.ok(WHATSAPP_AVATAR_TONES.includes(avatar.tone));
    assert.ok(avatar.toneIndex >= 0 && avatar.toneIndex < WHATSAPP_AVATAR_TONES.length);
  }
});

test("the palette is actually spread across, not collapsed onto one tone", () => {
  const seen = new Set<number>();
  for (let index = 0; index < 400; index += 1) {
    seen.add(buildWhatsAppAvatar({ waId: `234806${index}` }).toneIndex);
  }

  assert.equal(seen.size, WHATSAPP_AVATAR_TONES.length);
});

test("the hash is unsigned and stable", () => {
  assert.equal(hashWhatsAppIdentity("2348066706336"), hashWhatsAppIdentity("2348066706336"));
  assert.ok(hashWhatsAppIdentity("2348066706336") >= 0);
  assert.notEqual(hashWhatsAppIdentity("a"), hashWhatsAppIdentity("b"));
  assert.equal(hashWhatsAppIdentity(""), 0x811c9dc5);
});

test("initials are never empty, so an avatar is never blank", () => {
  for (const identity of [{}, { displayName: "" }, { waId: "" }, { displayName: "!!!" }]) {
    assert.ok(buildWhatsAppAvatar(identity).initials.length > 0);
  }
});

test("the readable name falls back to the number and then to a neutral phrase", () => {
  assert.equal(getWhatsAppAvatarName({ displayName: "Victor" }), "Victor");
  assert.equal(getWhatsAppAvatarName({ businessName: "Web Growth" }), "Web Growth");
  assert.equal(getWhatsAppAvatarName({ waId: "2348066706336" }), "2348066706336");
  assert.equal(getWhatsAppAvatarName({}), "Unknown contact");
});
