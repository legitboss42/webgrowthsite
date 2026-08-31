import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);
const OGG_CAPTURE = Buffer.from("OggS", "ascii");
const OPUS_HEAD = Buffer.from("OpusHead", "ascii");
const UNKNOWN_GRANULE_POSITION = BigInt("18446744073709551615");
const OPUS_SAMPLE_RATE = 48_000;

export type NormalizedWhatsAppVoiceNote = {
  file: File;
  mimeType: "audio/ogg; codecs=opus";
  filename: "webgrowth-voice-note.ogg";
};

/**
 * Reads enough of an Ogg/Opus file to prove that it is not merely an `.ogg` filename
 * wrapped around some other format. The final Ogg granule position is the number of
 * decoded Opus samples at 48 kHz, so it also catches the tiny header-only files that
 * browsers can produce when a recorder is stopped before any real audio was flushed.
 */
function inspectOggOpusVoiceNote(bytes: Buffer) {
  if (bytes.length < 64 || !bytes.subarray(0, 4).equals(OGG_CAPTURE)) {
    throw new Error("Converted voice note is not an Ogg container.");
  }

  const opusHeadOffset = bytes.indexOf(OPUS_HEAD);
  if (opusHeadOffset < 0 || opusHeadOffset + 12 > bytes.length) {
    throw new Error("Converted voice note does not contain an Opus stream.");
  }
  const preSkip = bytes.readUInt16LE(opusHeadOffset + 10);

  let offset = 0;
  let lastGranule = BigInt(-1);
  while (offset + 27 <= bytes.length) {
    if (!bytes.subarray(offset, offset + 4).equals(OGG_CAPTURE)) {
      throw new Error("Converted voice note contains a malformed Ogg page.");
    }

    const segmentCount = bytes[offset + 26] || 0;
    const segmentTableEnd = offset + 27 + segmentCount;
    if (segmentTableEnd > bytes.length) {
      throw new Error("Converted voice note has a truncated Ogg segment table.");
    }

    let pageBodyBytes = 0;
    for (let index = offset + 27; index < segmentTableEnd; index += 1) {
      pageBodyBytes += bytes[index] || 0;
    }
    const pageEnd = segmentTableEnd + pageBodyBytes;
    if (pageEnd > bytes.length) {
      throw new Error("Converted voice note has a truncated Ogg page.");
    }

    const granulePosition = bytes.readBigUInt64LE(offset + 6);
    if (granulePosition !== UNKNOWN_GRANULE_POSITION && granulePosition > lastGranule) {
      lastGranule = granulePosition;
    }
    offset = pageEnd;
  }

  if (offset !== bytes.length || lastGranule <= BigInt(preSkip)) {
    throw new Error("Converted voice note contains no playable audio duration.");
  }

  const durationSeconds = Number(lastGranule - BigInt(preSkip)) / OPUS_SAMPLE_RATE;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0.25) {
    throw new Error("Converted voice note is too short to contain playable audio.");
  }
}

/**
 * Converts browser MediaRecorder output into Meta's native voice-note format:
 * an OGG container carrying a mono Opus stream. Meta explicitly requires the Opus
 * codec for OGG audio, so the multipart media upload keeps the codec declaration
 * instead of degrading the file to the unsupported bare `audio/ogg` media type.
 */
export async function normalizeRecordedVoiceNote(audio: File): Promise<NormalizedWhatsAppVoiceNote> {
  if (!ffmpegPath) throw new Error("FFmpeg is unavailable on this deployment.");

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
        "-map",
        "0:a:0",
        "-vn",
        "-map_metadata",
        "-1",
        "-ac",
        "1",
        "-ar",
        "48000",
        "-c:a",
        "libopus",
        "-b:a",
        "32k",
        "-vbr",
        "on",
        "-application",
        "voip",
        "-f",
        "ogg",
        outputPath,
      ],
      { timeout: 20_000, maxBuffer: 1024 * 1024 },
    );

    const bytes = await readFile(outputPath);
    inspectOggOpusVoiceNote(bytes);

    // A second pass actually decodes the completed output. Container/header inspection
    // alone cannot catch damaged Opus packets, and Meta performs exactly this sort of
    // media scrutiny after accepting the message request.
    await execFileAsync(
      ffmpegPath,
      ["-hide_banner", "-loglevel", "error", "-i", outputPath, "-map", "0:a:0", "-f", "null", "-"],
      { timeout: 20_000, maxBuffer: 1024 * 1024 },
    );

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
