import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_QUICK_REPLY_LIMITS,
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
  assert.equal(normalizeWhatsAppQuickReplyShortcut("  spaced  out  "), "spaced-out");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("a--b"), "a-b");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("-lead-"), "lead");
  assert.equal(normalizeWhatsAppQuickReplyShortcut(undefined), "");
});

test("shortcuts drop characters the database constraint would reject", () => {
  assert.equal(normalizeWhatsAppQuickReplyShortcut("price!@#$%"), "price");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("prix€"), "prix");
  assert.equal(normalizeWhatsAppQuickReplyShortcut("!!!"), "");
});

test("shortcuts are capped at the column limit", () => {
  const long = normalizeWhatsAppQuickReplyShortcut("a".repeat(100));
  assert.equal(long.length, WHATSAPP_QUICK_REPLY_LIMITS.shortcutMax);
});

test("valid input is accepted and returned trimmed", () => {
  const result = validateWhatsAppQuickReplyInput({
    shortcut: " /Pricing ",
    title: "  Pricing overview  ",
    body: "  Our growth plan starts at ...  ",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    shortcut: "pricing",
    title: "Pricing overview",
    body: "Our growth plan starts at ...",
  });
});

test("every field is required", () => {
  for (const payload of [
    { shortcut: "", title: "T", body: "B" },
    { shortcut: "ok", title: "  ", body: "B" },
    { shortcut: "ok", title: "T", body: "   " },
    { shortcut: "!!!", title: "T", body: "B" },
  ]) {
    const result = validateWhatsAppQuickReplyInput(payload);
    assert.equal(result.ok, false, `expected ${JSON.stringify(payload)} to be rejected`);
  }
});

test("non-string payloads are rejected rather than coerced", () => {
  const result = validateWhatsAppQuickReplyInput({ shortcut: 12, title: null, body: [] });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /required/i);
});

test("titles and bodies are length checked against the column limits", () => {
  const longTitle = validateWhatsAppQuickReplyInput({
    shortcut: "ok",
    title: "t".repeat(WHATSAPP_QUICK_REPLY_LIMITS.titleMax + 1),
    body: "B",
  });
  const longBody = validateWhatsAppQuickReplyInput({
    shortcut: "ok",
    title: "T",
    body: "b".repeat(WHATSAPP_QUICK_REPLY_LIMITS.bodyMax + 1),
  });

  assert.equal(longTitle.ok, false);
  assert.equal(longBody.ok, false);

  const atLimit = validateWhatsAppQuickReplyInput({
    shortcut: "ok",
    title: "t".repeat(WHATSAPP_QUICK_REPLY_LIMITS.titleMax),
    body: "b".repeat(WHATSAPP_QUICK_REPLY_LIMITS.bodyMax),
  });
  assert.equal(atLimit.ok, true);
});

test("rows normalize with missing optional timestamps", () => {
  const reply = normalizeWhatsAppQuickReplyRow({
    id: "q1",
    shortcut: "pricing",
    title: "Pricing overview",
    body: "Hello",
  });

  assert.deepEqual(reply, {
    id: "q1",
    shortcut: "pricing",
    title: "Pricing overview",
    body: "Hello",
    created_at: undefined,
    updated_at: undefined,
  });
});

test("quick replies sort by shortcut without mutating the input", () => {
  const input = [
    normalizeWhatsAppQuickReplyRow({ id: "2", shortcut: "pricing", title: "P", body: "b" }),
    normalizeWhatsAppQuickReplyRow({ id: "1", shortcut: "hours", title: "H", body: "b" }),
  ];
  const sorted = sortWhatsAppQuickReplies(input);

  assert.deepEqual(sorted.map((item) => item.shortcut), ["hours", "pricing"]);
  assert.deepEqual(input.map((item) => item.shortcut), ["pricing", "hours"]);
});
