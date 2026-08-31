import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const execFileAsync = promisify(execFile);
const WHATSAPP_VOICE_INPUT_SAMPLE_RATE = 16_000;

export type NormalizedWhatsAppVoiceNote = {
  file: File;
  mimeType: "audio/ogg; codecs=opus";
  filename: "webgrowth-voice-note.ogg";
};

type FFprobeVoiceOutput = {
  streams?: Array<{
    codec_type?: unknown;
    codec_name?: unknown;
    channels?: unknown;
    sample_rate?: unknown;
    duration?: unknown;
  }>;
  format?: {
    format_name?: unknown;
    duration?: unknown;
  };
};

function finiteNumber(value: unknown) {
  if ((typeof value !== "string" && typeof value !== "number") || value === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function readOpusHeadInputSampleRate(bytes: Uint8Array) {
  const signature = [79, 112, 117, 115, 72, 101, 97, 100]; // OpusHead
  let offset = -1;
  for (let index = 0; index <= bytes.length - signature.length; index += 1) {
    let matches = true;
    for (let signatureIndex = 0; signatureIndex < signature.length; signatureIndex += 1) {
      if (bytes[index + signatureIndex] !== signature[signatureIndex]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      offset = index;
      break;
    }
  }

  if (offset < 0 || offset + 16 > bytes.length) return Number.NaN;
  return (
    bytes[offset + 12]! |
    (bytes[offset + 13]! << 8) |
    (bytes[offset + 14]! << 16) |
    (bytes[offset + 15]! << 24)
  ) >>> 0;
}

export function assertValidWhatsAppVoiceProbe(raw: unknown) {
  const output = raw && typeof raw === "object" ? raw as FFprobeVoiceOutput : {};
  const stream = output.streams?.find((item) => item.codec_type === "audio");
  const codecName = typeof stream?.codec_name === "string" ? stream.codec_name.toLowerCase() : "";
  const channels = finiteNumber(stream?.channels);
  const sampleRate = finiteNumber(stream?.sample_rate);
  const streamDuration = finiteNumber(stream?.duration);
  const formatDuration = finiteNumber(output.format?.duration);
  const durationSeconds = Number.isFinite(streamDuration) ? streamDuration : formatDuration;
  const formatName = typeof output.format?.format_name === "string" ? output.format.format_name.toLowerCase() : "";
  const formats = new Set(formatName.split(",").map((item) => item.trim()).filter(Boolean));

  if (!formats.has("ogg")) throw new Error("Converted voice note is not an OGG container.");
  if (codecName !== "opus") throw new Error("Converted voice note is not encoded with Opus.");
  if (channels !== 1) throw new Error("Converted voice note is not mono.");
  // Opus is always decoded on a 48 kHz clock even when the OpusHead input sample rate is
  // 16 kHz. The WhatsApp-style 16 kHz source rate is checked separately from the bytes.
  if (sampleRate !== 48_000) throw new Error("Converted voice note does not use the Opus 48 kHz clock.");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0.05) {
    throw new Error("Converted voice note contains no usable audio duration.");
  }

  return { codecName, channels, sampleRate, durationSeconds };
}

/**
 * Converts browser MediaRecorder output into a WhatsApp-native voice-note profile:
 * OGG/Opus, mono, 16 kHz input rate, 32 kbps voice-oriented Opus frames. FFprobe validates
 * the container/codec/duration and the OpusHead bytes verify the source sample-rate field.
 */
export async function normalizeRecordedVoiceNote(audio: File): Promise<NormalizedWhatsAppVoiceNote> {
  if (!ffmpegPath) throw new Error("FFmpeg is unavailable on this deployment.");
  if (!ffprobeStatic?.path) throw new Error("FFprobe is unavailable on this deployment.");

  const workDir = await mkdtemp(join(tmpdir(), "webgrowth-wa-voice-"));
  const inputPath = join(workDir, `input${extensionForMime(audio.type)}`);
  const outputPath = join(workDir, "voice.ogg");

  try {
    await writeFile(inputPath, Buffer.from(await audio.arrayBuffer()));

    await execFileAsync(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-map_metadata",
        "-1",
        "-ac",
        "1",
        "-ar",
        String(WHATSAPP_VOICE_INPUT_SAMPLE_RATE),
        "-c:a",
        "libopus",
        "-b:a",
        "32k",
        "-vbr",
        "on",
        "-compression_level",
        "10",
        "-frame_duration",
        "60",
        "-application",
        "voip",
        "-packet_loss",
        "0",
        "-avoid_negative_ts",
        "make_zero",
        "-f",
        "ogg",
        outputPath,
      ],
      { timeout: 20_000, maxBuffer: 1024 * 1024 },
    );

    const bytes = await readFile(outputPath);
    if (bytes.length <= 0) throw new Error("FFmpeg produced an empty voice note.");
    const opusHeadInputSampleRate = readOpusHeadInputSampleRate(bytes);
    if (opusHeadInputSampleRate !== WHATSAPP_VOICE_INPUT_SAMPLE_RATE) {
      throw new Error("Converted voice note does not carry the WhatsApp voice input sample rate.");
    }

    const probeResult = await execFileAsync(
      ffprobeStatic.path,
      [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,channels,sample_rate,duration:format=format_name,duration",
        "-of",
        "json",
        outputPath,
      ],
      { timeout: 10_000, maxBuffer: 1024 * 1024, encoding: "utf8" },
    );
    const probeText = typeof probeResult.stdout === "string" ? probeResult.stdout : String(probeResult.stdout || "");
    assertValidWhatsAppVoiceProbe(JSON.parse(probeText));

    const mimeType = "audio/ogg; codecs=opus" as const;
    return {
      file: new File([bytes], "webgrowth-voice-note.ogg", {
        type: mimeType,
        lastModified: Date.now(),
      }),
      mimeType,
      filename: "webgrowth-voice-note.ogg",
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function extensionForMime(mimeType: string) {
  const base = mimeType.split(";")[0]?.trim().toLowerCase();
  if (base === "audio/webm") return ".webm";
  if (base === "audio/mp4") return ".m4a";
  if (base === "audio/ogg") return ".ogg";
  if (base === "audio/mpeg") return ".mp3";
  if (base === "audio/aac") return ".aac";
  if (base === "audio/amr") return ".amr";
  return ".audio";
}
