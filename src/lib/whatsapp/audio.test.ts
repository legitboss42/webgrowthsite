import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseWhatsAppRecordingMimeType,
  getWhatsAppAudioFilename,
  isSupportedWhatsAppAudioMimeType,
  isSupportedWhatsAppRecordingMimeType,
} from "./audio";

test("accepts Meta-supported WhatsApp audio MIME types", () => {
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/ogg; codecs=opus"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/mp4"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/mpeg"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/webm"), false);
});

test("allows browser WebM recording because the server transcodes it to OGG Opus", () => {
  assert.equal(isSupportedWhatsAppRecordingMimeType("audio/webm; codecs=opus"), true);
  assert.equal(
    chooseWhatsAppRecordingMimeType((type) => type === "audio/mp4"),
    "audio/mp4",
  );
  assert.equal(
    chooseWhatsAppRecordingMimeType((type) => type === "audio/webm"),
    "audio/webm",
  );
});

test("uses safe extensions for WhatsApp audio uploads", () => {
  assert.equal(getWhatsAppAudioFilename("audio/ogg; codecs=opus"), "webgrowth-voice-note.ogg");
  assert.equal(getWhatsAppAudioFilename("audio/webm; codecs=opus"), "webgrowth-voice-note.webm");
  assert.equal(getWhatsAppAudioFilename("audio/mp4"), "webgrowth-voice-note.m4a");
  assert.equal(getWhatsAppAudioFilename("audio/mpeg"), "webgrowth-voice-note.mp3");
});
