import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_QUICK_REPLY_LIMITS,
  canUseWhatsAppQuickReply,
  normalizeWhatsAppQuickReplyCategory,
  normalizeWhatsAppQuickReplyRow,
  normalizeWhatsAppQuickReplyShortcut,
  sortWhatsAppQuickReplies,
  validateWhatsAppQuickReplyInput,
} from "./quickRepliesModel";

test("shortcuts normalize to the stored slug form", () => {
  assert.equal(normalizeWhatsAppQuickReplyShortcut("Pricing"), "pricing");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("/pricing"), "pricing");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("Send pricing"), "send-pricing");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("send_pricing"), "send-pricing");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("a--b"), "a-b");
  assert.equal(normalizeWhatsAppQuickReplyShortcut(undefined), "");
});

test("categories are trimmed and normalized", () => {
  assert.equal(normalizeWhatsAppQuickReplyCategory("  Follow   up  "), "Follow up");
  assert.equal(normalizeWhatsAppQuickReplyCategory(null), "");
});

test("valid Stage 4 input is accepted and trimmed", () => {
  const result = validateWhatsAppQuickReplyInput({
    shortcut: " /Pricing ",
    title: "  Pricing overview  ",
    body: "  Our growth plan starts at ...  ",
    scope: "PERSONAL",
    category: "  Sales  ",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    shortcut: "pricing",
    title: "Pricing overview",
    body: "Our growth plan starts at ...",
    scope: "PERSONAL",
    category: "Sales",
  });
});

test("legacy input defaults to Team and General", () => {
  const result = validateWhatsAppQuickReplyInput({ shortcut: "hello", title: "Hello", body: "Hi" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.scope, "TEAM");
  assert.equal(result.value.category, "General");
});

test("invalid scope and empty category are rejected", () => {
  assert.equal(validateWhatsAppQuickReplyInput({ shortcut: "x", title: "X", body: "X", scope: "OTHER", category: "General" }).ok, false);
  assert.equal(validateWhatsAppQuickReplyInput({ shortcut: "x", title: "X", body: "X", scope: "TEAM", category: "   " }).ok, false);
});

test("titles, bodies and categories respect limits", () => {
  assert.equal(validateWhatsAppQuickReplyInput({ shortcut: "ok", title: "t".repeat(WHATSAPP_QUICK_REPLY_LIMITS.titleMax + 1), body: "B", scope: "TEAM", category: "General" }).ok, false);
  assert.equal(validateWhatsAppQuickReplyInput({ shortcut: "ok", title: "T", body: "b".repeat(WHATSAPP_QUICK_REPLY_LIMITS.bodyMax + 1), scope: "TEAM", category: "General" }).ok, false);
  assert.equal(validateWhatsAppQuickReplyInput({ shortcut: "ok", title: "T", body: "B", scope: "TEAM", category: "c".repeat(WHATSAPP_QUICK_REPLY_LIMITS.categoryMax + 1) }).ok, true);
});

test("rows normalize legacy records as Team General replies", () => {
  const reply = normalizeWhatsAppQuickReplyRow({ id: "q1", shortcut: "pricing", title: "Pricing", body: "Hello" });
  assert.equal(reply.scope, "TEAM");
  assert.equal(reply.category, "General");
  assert.equal(reply.owner_member_id, undefined);
});

test("personal row ownership is preserved", () => {
  const reply = normalizeWhatsAppQuickReplyRow({ id: "q2", shortcut: "followup", title: "Follow up", body: "Hi", scope: "PERSONAL", category: "Follow-up", owner_member_id: "m1" });
  assert.equal(reply.scope, "PERSONAL");
  assert.equal(reply.owner_member_id, "m1");
  assert.equal(canUseWhatsAppQuickReply(reply, "m1"), true);
  assert.equal(canUseWhatsAppQuickReply(reply, "m2"), false);
});

test("team replies are usable by every workspace member", () => {
  const reply = normalizeWhatsAppQuickReplyRow({ id: "q1", shortcut: "hours", title: "Hours", body: "Hi", scope: "TEAM" });
  assert.equal(canUseWhatsAppQuickReply(reply, null), true);
  assert.equal(canUseWhatsAppQuickReply(reply, "m1"), true);
});

test("saved replies sort by scope, category and shortcut without mutating input", () => {
  const input = [
    normalizeWhatsAppQuickReplyRow({ id: "3", shortcut: "mine", title: "Mine", body: "b", scope: "PERSONAL", category: "General", owner_member_id: "m1" }),
    normalizeWhatsAppQuickReplyRow({ id: "2", shortcut: "pricing", title: "P", body: "b", scope: "TEAM", category: "Sales" }),
    normalizeWhatsAppQuickReplyRow({ id: "1", shortcut: "hours", title: "H", body: "b", scope: "TEAM", category: "General" }),
  ];
  const sorted = sortWhatsAppQuickReplies(input);
  assert.deepEqual(sorted.map((item) => item.id), ["1", "2", "3"]);
  assert.deepEqual(input.map((item) => item.id), ["3", "2", "1"]);
});
