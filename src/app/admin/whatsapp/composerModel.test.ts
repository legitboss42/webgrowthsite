import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPOSER_MAX_HEIGHT,
  COMPOSER_MIN_HEIGHT,
  WAVEFORM_BAR_COUNT,
  WHATSAPP_REPLY_QUOTE_MAX,
  applyQuickReply,
  buildWhatsAppReplyQuote,
  clampComposerHeight,
  createWaveformHistory,
  filterQuickReplies,
  formatRecordingDuration,
  getQuickReplyQuery,
  insertIntoDraft,
  isComposerScrolling,
  measureWaveformLevel,
  pushWaveformLevel,
  shouldSendOnKey,
  truncateQuoteExcerpt,
} from "./composerModel";
import type { WhatsAppQuickReply } from "./quickRepliesModel";

function reply(shortcut: string, title: string, body = "Body", category = "General"): WhatsAppQuickReply {
  return { id: shortcut, shortcut, title, body, category, scope: "TEAM" };
}

test("insertIntoDraft drops an emoji at the caret", () => {
  const result = insertIntoDraft({ value: "Hi there", start: 2, end: 2, insert: "👋" });
  assert.equal(result.value, "Hi👋 there");
  assert.equal(result.cursor, 4);
});

test("insertIntoDraft replaces a selection", () => {
  const result = insertIntoDraft({ value: "Hi there", start: 3, end: 8, insert: "you" });
  assert.equal(result.value, "Hi you");
  assert.equal(result.cursor, 6);
});

test("insertIntoDraft appends when the caret is unknown", () => {
  const result = insertIntoDraft({ value: "Hi", start: Number.NaN, end: Number.NaN, insert: "!" });
  assert.equal(result.value, "Hi!");
  assert.equal(result.cursor, 3);
});

test("insertIntoDraft clamps a caret past the end of the draft", () => {
  const result = insertIntoDraft({ value: "Hi", start: 99, end: 120, insert: "!" });
  assert.equal(result.value, "Hi!");
  assert.equal(result.cursor, 3);
});

test("getQuickReplyQuery only fires on a lone slash token", () => {
  assert.equal(getQuickReplyQuery("/"), "");
  assert.equal(getQuickReplyQuery("/pric"), "pric");
  assert.equal(getQuickReplyQuery("/PRIC"), "pric");
  assert.equal(getQuickReplyQuery(""), null);
  assert.equal(getQuickReplyQuery("Rates are 20/hour"), null);
  assert.equal(getQuickReplyQuery("https://webgrowth.info/pricing"), null);
  assert.equal(getQuickReplyQuery("/pricing please"), null);
});

test("filterQuickReplies prefers shortcut prefixes then searches title, body and category", () => {
  const replies = [
    reply("pricing", "Pricing", "Our rates", "Sales"),
    reply("proposal", "Send proposal", "Attached proposal", "Documents"),
    reply("call", "Book a call", "Choose an appointment", "Appointments"),
  ];
  assert.deepEqual(filterQuickReplies(replies, "pr").map((entry) => entry.shortcut), ["pricing", "proposal"]);
  assert.deepEqual(filterQuickReplies(replies, "book").map((entry) => entry.shortcut), ["call"]);
  assert.deepEqual(filterQuickReplies(replies, "rates").map((entry) => entry.shortcut), ["pricing"]);
  assert.deepEqual(filterQuickReplies(replies, "documents").map((entry) => entry.shortcut), ["proposal"]);
  assert.equal(filterQuickReplies(replies, "").length, 3);
  assert.equal(filterQuickReplies(replies, "zzz").length, 0);
});

test("applyQuickReply replaces the slash token but appends to real prose", () => {
  assert.equal(applyQuickReply("/pric", "Our rates start at R5 000."), "Our rates start at R5 000.");
  assert.equal(applyQuickReply("", "Body"), "Body");
  assert.equal(applyQuickReply("Hello there  ", "Body"), "Hello there\n\nBody");
});

test("shouldSendOnKey honours Shift and never steals an IME commit", () => {
  assert.equal(shouldSendOnKey({ key: "Enter" }), true);
  assert.equal(shouldSendOnKey({ key: "Enter", shiftKey: true }), false);
  assert.equal(shouldSendOnKey({ key: "Enter", isComposing: true }), false);
  assert.equal(shouldSendOnKey({ key: "a" }), false);
});

test("clampComposerHeight holds the editor between one and four lines", () => {
  assert.equal(clampComposerHeight(0), COMPOSER_MIN_HEIGHT);
  assert.equal(clampComposerHeight(24), 24);
  assert.equal(clampComposerHeight(48), 48);
  assert.equal(clampComposerHeight(400), COMPOSER_MAX_HEIGHT);
  assert.equal(clampComposerHeight(Number.NaN), COMPOSER_MIN_HEIGHT);
  assert.equal(clampComposerHeight(30.2), 31);
});

test("isComposerScrolling only past the maximum height", () => {
  assert.equal(isComposerScrolling(COMPOSER_MAX_HEIGHT), false);
  assert.equal(isComposerScrolling(COMPOSER_MAX_HEIGHT + 1), true);
});

test("formatRecordingDuration reads as a clock", () => {
  assert.equal(formatRecordingDuration(0), "00:00");
  assert.equal(formatRecordingDuration(8), "00:08");
  assert.equal(formatRecordingDuration(65), "01:05");
  assert.equal(formatRecordingDuration(600), "10:00");
  assert.equal(formatRecordingDuration(-4), "00:00");
  assert.equal(formatRecordingDuration(Number.NaN), "00:00");
});

test("the waveform history is a fixed-width rolling window", () => {
  const history = createWaveformHistory();
  assert.equal(history.length, WAVEFORM_BAR_COUNT);
  let rolling = history;
  for (let index = 0; index < WAVEFORM_BAR_COUNT * 2; index += 1) rolling = pushWaveformLevel(rolling, 0.5);
  assert.equal(rolling.length, WAVEFORM_BAR_COUNT);
  assert.ok(rolling.every((level) => level === 0.5));
  const clamped = pushWaveformLevel(createWaveformHistory(4), 9, 4);
  assert.equal(clamped[clamped.length - 1], 1);
  assert.equal(pushWaveformLevel(createWaveformHistory(4), 0, 4).at(-1), 0.04);
});

test("measureWaveformLevel reads silence as flat and speech as loud", () => {
  const silence = new Uint8Array(128).fill(128);
  assert.equal(measureWaveformLevel(silence), 0);
  const loud = new Uint8Array(128).fill(255);
  assert.equal(measureWaveformLevel(loud), 1);
  const quiet = Uint8Array.from({ length: 128 }, (_, index) => (index % 2 ? 132 : 124));
  const level = measureWaveformLevel(quiet);
  assert.ok(level > 0 && level < 1, `expected a mid-range level, got ${level}`);
  assert.equal(measureWaveformLevel(new Uint8Array(0)), 0);
});

test("buildWhatsAppReplyQuote labels who wrote the message it will quote", () => {
  const inbound = buildWhatsAppReplyQuote(
    { whatsapp_message_id: "wamid.in", direction: "inbound", message_text: "Thanks for sending over the details!" },
    "Sarah Johnson",
  );
  assert.deepEqual(inbound, { messageId: "wamid.in", authorLabel: "Sarah Johnson", excerpt: "Thanks for sending over the details!" });
  const outbound = buildWhatsAppReplyQuote(
    { whatsapp_message_id: "wamid.out", direction: "outbound", message_text: "Here is the proposal." },
    "Sarah Johnson",
  );
  assert.equal(outbound?.authorLabel, "You");
});

test("buildWhatsAppReplyQuote refuses a message Meta has no id for", () => {
  assert.equal(buildWhatsAppReplyQuote({ direction: "inbound", message_text: "Hi" }, "Sarah"), null);
  assert.equal(buildWhatsAppReplyQuote({ whatsapp_message_id: "   ", direction: "inbound", message_text: "Hi" }, "Sarah"), null);
});

test("buildWhatsAppReplyQuote describes media that carries no caption", () => {
  const voice = buildWhatsAppReplyQuote({ whatsapp_message_id: "wamid.voice", direction: "inbound", message_type: "audio" }, "Sarah");
  assert.equal(voice?.excerpt, "Voice note");
  const document = buildWhatsAppReplyQuote({ whatsapp_message_id: "wamid.doc", direction: "outbound", message_type: "document", media_filename: "Proposal.pdf" }, "Sarah");
  assert.equal(document?.excerpt, "Document");
  const unknown = buildWhatsAppReplyQuote({ whatsapp_message_id: "wamid.other", direction: "inbound", message_type: "reaction" }, "Sarah");
  assert.equal(unknown?.excerpt, "Message");
  const named = buildWhatsAppReplyQuote({ whatsapp_message_id: "wamid.file", direction: "inbound", message_type: "unsupported", media_filename: "scan.pdf" }, "Sarah");
  assert.equal(named?.excerpt, "scan.pdf");
});

test("buildWhatsAppReplyQuote falls back to a neutral name when the contact has none", () => {
  const quote = buildWhatsAppReplyQuote({ whatsapp_message_id: "wamid.in", direction: "inbound", message_text: "Hello" }, "   ");
  assert.equal(quote?.authorLabel, "Customer");
});

test("truncateQuoteExcerpt keeps the strip to one line", () => {
  assert.equal(truncateQuoteExcerpt("  Two   lines\nof text  "), "Two lines of text");
  assert.equal(truncateQuoteExcerpt("exactly", 7), "exactly");
  const long = "word ".repeat(60).trim();
  const cut = truncateQuoteExcerpt(long);
  assert.ok(cut.length <= WHATSAPP_REPLY_QUOTE_MAX + 1, "excerpt is longer than the cap");
  assert.ok(cut.endsWith("…"));
  assert.ok(!cut.includes("wor…"));
  assert.equal(truncateQuoteExcerpt("abcdefghij", 4), "abcd…");
});
