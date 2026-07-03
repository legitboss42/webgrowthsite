import { EdgeTTS, createSRT, createVTT } from "edge-tts-universal";

export const INTERNAL_TTS_VOICES = [
  "en-US-BrianMultilingualNeural",
  "en-US-AndrewNeural",
  "en-US-GuyNeural",
  "en-US-ChristopherNeural",
] as const;

export type InternalTtsVoice = (typeof INTERNAL_TTS_VOICES)[number];

export const DEFAULT_INTERNAL_TTS_VOICE: InternalTtsVoice =
  "en-US-BrianMultilingualNeural";

export const INTERNAL_TTS_CHAR_LIMIT = 900;

function clampRate(value: string | undefined) {
  const fallback = "-4%";
  if (!value) return fallback;
  const match = /^([+-]?\d{1,2})%$/.exec(value.trim());
  if (!match) return fallback;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return fallback;
  const bounded = Math.max(-25, Math.min(25, numeric));
  return `${bounded >= 0 ? "+" : ""}${bounded}%`;
}

export function isAllowedTtsVoice(value: string): value is InternalTtsVoice {
  return INTERNAL_TTS_VOICES.includes(value as InternalTtsVoice);
}

export async function synthesizeInternalTts(options: {
  text: string;
  voice?: string;
  rate?: string;
}) {
  const voice = isAllowedTtsVoice(options.voice || "")
    ? options.voice
    : DEFAULT_INTERNAL_TTS_VOICE;
  const rate = clampRate(options.rate);

  const tts = new EdgeTTS(options.text, voice, {
    rate,
    volume: "+0%",
    pitch: "+0Hz",
  });

  const result = await tts.synthesize();
  const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filenameStem = `webgrowth-tts-${timestamp}`;

  return {
    voice,
    rate,
    audioBuffer,
    mimeType: "audio/mpeg",
    srt: createSRT(result.subtitle),
    vtt: createVTT(result.subtitle),
    filenameStem,
  };
}
