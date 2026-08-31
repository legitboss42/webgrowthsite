import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export type NormalizedWhatsAppVoiceNote = {
  file: File;
  mimeType: "audio/ogg";
  filename: "webgrowth-voice-note.ogg";
};

/**
 * Converts browser MediaRecorder output into Meta's native voice-note format:
 * an OGG container carrying a mono Opus stream. The upload MIME stays the canonical
 * `audio/ogg`; `codecs=opus` describes the stream but is not part of the media type
 * Meta expects in the multipart upload.
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
    if (bytes.length <= 0) throw new Error("FFmpeg produced an empty voice note.");

    return {
      file: new File([bytes], "webgrowth-voice-note.ogg", {
        type: "audio/ogg",
        lastModified: Date.now(),
      }),
      mimeType: "audio/ogg",
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
