import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffprobeStatic from "ffprobe-static";
import type { MediaValidationResult } from "./media";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const MIN_VIDEO_DIMENSION = 360;
const MAX_VIDEO_DIMENSION = 4096;
const MIN_VIDEO_FPS = 23;
const MAX_VIDEO_FPS = 60;
const DEFAULT_MAX_DURATION_SECONDS = 600;
const FFPROBE_OUTPUT_LIMIT = 5 * 1024 * 1024;

export const VIDEO_VALIDATION_VERSION = "tiktok-video-beta-v1";

export type VideoProbe = {
  formatName: string;
  codecName: string;
  width: number;
  height: number;
  frameRate: number;
  durationSeconds: number;
};

export class VideoProbeMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoProbeMediaError";
  }
}

type FFprobeOutput = {
  streams?: Array<{
    codec_type?: unknown;
    codec_name?: unknown;
    width?: unknown;
    height?: unknown;
    avg_frame_rate?: unknown;
    r_frame_rate?: unknown;
    duration?: unknown;
  }>;
  format?: {
    format_name?: unknown;
    duration?: unknown;
  };
};

function finiteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseFrameRate(value: unknown): number {
  if (typeof value !== "string") return finiteNumber(value);
  const [numerator, denominator] = value.split("/").map(Number);
  if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
    return numerator / denominator;
  }
  return finiteNumber(value);
}

function normalizeProbe(output: FFprobeOutput): VideoProbe {
  const stream = output.streams?.find((candidate) => candidate.codec_type === "video");
  if (!stream) throw new VideoProbeMediaError("Stored video has no decodable video stream.");
  const averageFrameRate = parseFrameRate(stream.avg_frame_rate);
  return {
    formatName: typeof output.format?.format_name === "string" ? output.format.format_name : "",
    codecName: typeof stream.codec_name === "string" ? stream.codec_name : "",
    width: finiteNumber(stream.width),
    height: finiteNumber(stream.height),
    frameRate: Number.isFinite(averageFrameRate) && averageFrameRate > 0
      ? averageFrameRate
      : parseFrameRate(stream.r_frame_rate),
    durationSeconds: finiteNumber(output.format?.duration ?? stream.duration),
  };
}

export async function probeVideo(path: string): Promise<VideoProbe> {
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      ffprobeStatic.path,
      ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", path],
      { encoding: "utf8", maxBuffer: FFPROBE_OUTPUT_LIMIT, shell: false, windowsHide: true },
      (error, output) => {
        if (!error) return resolve(output);
        const errorCode = (error as NodeJS.ErrnoException).code;
        return reject(typeof errorCode === "number"
          ? new VideoProbeMediaError("Stored video could not be decoded.")
          : error);
      },
    );
  });
  return normalizeProbe(JSON.parse(stdout) as FFprobeOutput);
}

export async function probeStoredVideo(
  source: ArrayBuffer | Uint8Array,
  dependencies: { probe(path: string): Promise<VideoProbe> } = { probe: probeVideo },
): Promise<VideoProbe> {
  const directory = await mkdtemp(join(tmpdir(), "scheduler-video-validation-"));
  const temporaryPath = join(directory, "stored-object.mp4");
  try {
    const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
    await writeFile(temporaryPath, bytes);
    return await dependencies.probe(temporaryPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function validateTikTokVideo(
  probe: VideoProbe,
  byteSize: number,
  creatorMaxDuration = DEFAULT_MAX_DURATION_SECONDS,
): MediaValidationResult {
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Video size must not exceed 500 MB." };
  }
  if (!probe.formatName.split(",").includes("mp4")) {
    return { ok: false, error: "Video must use the MP4 container." };
  }
  if (probe.codecName !== "h264") {
    return { ok: false, error: "Video codec must be H.264." };
  }
  if (
    !Number.isInteger(probe.width)
    || !Number.isInteger(probe.height)
    || probe.width < MIN_VIDEO_DIMENSION
    || probe.width > MAX_VIDEO_DIMENSION
    || probe.height < MIN_VIDEO_DIMENSION
    || probe.height > MAX_VIDEO_DIMENSION
  ) {
    return { ok: false, error: "Video dimensions must be between 360 and 4096 pixels." };
  }
  if (!Number.isFinite(probe.frameRate) || probe.frameRate < MIN_VIDEO_FPS || probe.frameRate > MAX_VIDEO_FPS) {
    return { ok: false, error: "Video frame rate must be between 23 and 60 FPS." };
  }
  const maximumDuration = Number.isFinite(creatorMaxDuration) && creatorMaxDuration > 0
    ? creatorMaxDuration
    : DEFAULT_MAX_DURATION_SECONDS;
  if (!Number.isFinite(probe.durationSeconds) || probe.durationSeconds <= 0) {
    return { ok: false, error: "Video duration is outside the allowed range." };
  }
  if (probe.durationSeconds > maximumDuration) {
    return { ok: false, error: "Video duration exceeds the allowed maximum." };
  }
  return { ok: true };
}
