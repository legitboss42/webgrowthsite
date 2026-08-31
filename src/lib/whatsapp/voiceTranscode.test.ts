import assert from "node:assert/strict";
import test from "node:test";
import { assertValidWhatsAppVoiceProbe } from "./voiceTranscode";

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
