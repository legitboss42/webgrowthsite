import assert from "node:assert/strict";
import test from "node:test";
import { assertValidWhatsAppVoiceProbe, readOpusHeadInputSampleRate } from "./voiceTranscode";

test("accepts a real WhatsApp voice-note probe shape", () => {
  const result = assertValidWhatsAppVoiceProbe({
    streams: [{ codec_type: "audio", codec_name: "opus", channels: 1, sample_rate: "48000" }],
    format: { format_name: "ogg", duration: "6.42" },
  });

  assert.equal(result.codecName, "opus");
  assert.equal(result.channels, 1);
  assert.equal(result.sampleRate, 48_000);
  assert.equal(result.durationSeconds, 6.42);
});

test("reads the original 16 kHz input rate from an OpusHead", () => {
  const bytes = new Uint8Array(32);
  bytes.set(new TextEncoder().encode("OpusHead"), 4);
  const offset = 4;
  bytes[offset + 12] = 0x80;
  bytes[offset + 13] = 0x3e;
  bytes[offset + 14] = 0x00;
  bytes[offset + 15] = 0x00;
  assert.equal(readOpusHeadInputSampleRate(bytes), 16_000);
});

test("returns NaN when an OpusHead is absent or truncated", () => {
  assert.equal(Number.isNaN(readOpusHeadInputSampleRate(new Uint8Array([1, 2, 3]))), true);
  assert.equal(Number.isNaN(readOpusHeadInputSampleRate(new TextEncoder().encode("OpusHead"))), true);
});

test("rejects header-only, wrong-codec and stereo output before Meta sees it", () => {
  assert.throws(() => assertValidWhatsAppVoiceProbe({
    streams: [{ codec_type: "audio", codec_name: "opus", channels: 1, sample_rate: "48000" }],
    format: { format_name: "ogg", duration: "0" },
  }), /usable audio duration/);

  assert.throws(() => assertValidWhatsAppVoiceProbe({
    streams: [{ codec_type: "audio", codec_name: "vorbis", channels: 1, sample_rate: "48000" }],
    format: { format_name: "ogg", duration: "4.2" },
  }), /Opus/);

  assert.throws(() => assertValidWhatsAppVoiceProbe({
    streams: [{ codec_type: "audio", codec_name: "opus", channels: 2, sample_rate: "48000" }],
    format: { format_name: "ogg", duration: "4.2" },
  }), /mono/);
});
