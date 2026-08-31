export const WHATSAPP_AUDIO_MIME_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/ogg; codecs=opus",
  "audio/ogg",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4; codecs=mp4a.40.2",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/amr",
] as const;

// Browser-only recording formats. Chromium commonly records Opus in WebM even though
// WhatsApp itself does not accept WebM. The server transcodes every recorded voice note
// to OGG/Opus before upload, so accepting WebM here is safe and more reliable.
export const WHATSAPP_RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm; codecs=opus",
  "audio/webm",
  ...WHATSAPP_AUDIO_MIME_TYPES,
] as const;

const supportedAudioMimeTypes = new Set(WHATSAPP_AUDIO_MIME_TYPES.map((type) => type.toLowerCase()));
const supportedRecordingMimeTypes = new Set(WHATSAPP_RECORDING_MIME_TYPES.map((type) => type.toLowerCase()));

export function normalizeWhatsAppAudioMimeType(value: string) {
  return value.trim().toLowerCase().replace(/\s*;\s*/g, "; ");
}

export function getWhatsAppAudioBaseMimeType(value: string) {
  return normalizeWhatsAppAudioMimeType(value).split(";")[0]?.trim() || "audio/ogg";
}

export function isSupportedWhatsAppAudioMimeType(value: string) {
  const normalized = normalizeWhatsAppAudioMimeType(value);
  return supportedAudioMimeTypes.has(normalized) || supportedAudioMimeTypes.has(normalized.replace("; ", ";"));
}

export function isSupportedWhatsAppRecordingMimeType(value: string) {
  const normalized = normalizeWhatsAppAudioMimeType(value);
  return supportedRecordingMimeTypes.has(normalized) || supportedRecordingMimeTypes.has(normalized.replace("; ", ";"));
}

export function chooseWhatsAppRecordingMimeType(isTypeSupported: (type: string) => boolean) {
  return WHATSAPP_RECORDING_MIME_TYPES.find((type) => isTypeSupported(type)) || null;
}

export function getWhatsAppAudioFilename(mimeType: string) {
  const normalized = getWhatsAppAudioBaseMimeType(mimeType);
  if (normalized === "audio/webm") return "webgrowth-voice-note.webm";
  if (normalized === "audio/ogg") return "webgrowth-voice-note.ogg";
  if (normalized === "audio/mp4") return "webgrowth-voice-note.m4a";
  if (normalized === "audio/mpeg") return "webgrowth-voice-note.mp3";
  if (normalized === "audio/aac") return "webgrowth-voice-note.aac";
  if (normalized === "audio/amr") return "webgrowth-voice-note.amr";
  return "webgrowth-voice-note.audio";
}
