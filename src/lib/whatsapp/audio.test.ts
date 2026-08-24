import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseWhatsAppRecordingMimeType,
  getWhatsAppAudioFilename,
  isSupportedWhatsAppAudioMimeType,
} from "./audio";

test("accepts Meta-supported WhatsApp audio MIME types", () => {
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/ogg; codecs=opus"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/mp4"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/mpeg"), true);
  assert.equal(isSupportedWhatsAppAudioMimeType("audio/webm"), false);
});

test("chooses the first browser-supported Meta-compatible recorder type", () => {
  assert.equal(
    chooseWhatsAppRecordingMimeType((type) => type === "audio/mp4"),
    "audio/mp4",
  );
  assert.equal(
    chooseWhatsAppRecordingMimeType((type) => type === "audio/webm"),
    null,
  );
});

test("uses safe extensions for WhatsApp audio uploads", () => {
  assert.equal(getWhatsAppAudioFilename("audio/ogg; codecs=opus"), "webgrowth-voice-note.ogg");
  assert.equal(getWhatsAppAudioFilename("audio/mp4"), "webgrowth-voice-note.m4a");
  assert.equal(getWhatsAppAudioFilename("audio/mpeg"), "webgrowth-voice-note.mp3");
});
