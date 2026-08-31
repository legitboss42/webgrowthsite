export const WHATSAPP_AUDIO_MIME_TYPES = [
  // Chromium / Firefox desktop + Android commonly prefer Opus in OGG.
  "audio/ogg;codecs=opus",
  "audio/ogg; codecs=opus",
  "audio/ogg",
  // Safari/iOS commonly reports the AAC codec-qualified MP4 form rather than bare audio/mp4.
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4; codecs=mp4a.40.2",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/amr",
] as const;

const supportedAudioMimeTypes = new Set(WHATSAPP_AUDIO_MIME_TYPES.map((type) => type.toLowerCase()));

export function normalizeWhatsAppAudioMimeType(value: string) {
  return value.trim().toLowerCase().replace(/\s*;\s*/g, "; ");
}

export function isSupportedWhatsAppAudioMimeType(value: string) {
  const normalized = normalizeWhatsAppAudioMimeType(value);
  return supportedAudioMimeTypes.has(normalized) || supportedAudioMimeTypes.has(normalized.replace("; ", ";"));
}

export function chooseWhatsAppRecordingMimeType(isTypeSupported: (type: string) => boolean) {
  return WHATSAPP_AUDIO_MIME_TYPES.find((type) => isTypeSupported(type)) || null;
}

export function getWhatsAppAudioFilename(mimeType: string) {
  const normalized = normalizeWhatsAppAudioMimeType(mimeType);
  if (normalized.startsWith("audio/ogg")) return "webgrowth-voice-note.ogg";
  if (normalized.startsWith("audio/mp4")) return "webgrowth-voice-note.m4a";
  if (normalized === "audio/mpeg") return "webgrowth-voice-note.mp3";
  if (normalized === "audio/aac") return "webgrowth-voice-note.aac";
  if (normalized === "audio/amr") return "webgrowth-voice-note.amr";
  return "webgrowth-voice-note.audio";
}
