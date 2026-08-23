import { execFile } from "node:child_process";
import { mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffprobeStatic from "ffprobe-static";
import type { MediaValidationResult } from "./media";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const MIN_VIDEO_DIMENSION = 360;
const MAX_VIDEO_DIMENSION = 4096;
const MIN_VIDEO_FPS = 23;
const MAX_VIDEO_FPS = 60;
const MAX_VIDEO_DURATION_SECONDS = 600;
const FFPROBE_OUTPUT_LIMIT = 5 * 1024 * 1024;
const FFPROBE_TIMEOUT_MS = 30_000;
const NON_MP4_ISO_BMFF_BRANDS = new Set([
  "avif", "avis", "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs",
  "mif1", "msf1", "miaf", "mihb", "miha", "mif2", "msf2", "mjp2", "mj2s",
]);
const PROVEN_DECODE_ERRORS = [
  "invalid data found when processing input",
  "moov atom not found",
  "ebml header parsing failed",
  "end of file",
];

export const VIDEO_VALIDATION_VERSION = "tiktok-video-beta-v2";

export type VideoContainer = "MP4" | "MOV" | "WEBM" | "UNKNOWN";
export type VideoContainerEvidence = {
  container: Exclude<VideoContainer, "UNKNOWN">;
  mimeType: "video/mp4" | "video/quicktime" | "video/webm";
  majorBrand: string | null;
};

export type VideoProbe = {
  container: VideoContainer;
  mimeType: string;
  formatName: string;
  majorBrand: string | null;
  codecName: string;
  width: number;
  height: number;
  frameRate: number;
  durationSeconds: number;
};

export class VideoProbeMediaError extends Error {
  readonly publicMessage: string;

  constructor(publicMessage = "Stored video could not be decoded.") {
    super(publicMessage);
    this.name = "VideoProbeMediaError";
    this.publicMessage = publicMessage;
  }
}

export class VideoProbeInfrastructureError extends Error {
  constructor() {
    super("Video validation infrastructure is unavailable.");
    this.name = "VideoProbeInfrastructureError";
  }
}

type FFprobeStream = {
  index?: unknown;
  codec_type?: unknown;
  codec_name?: unknown;
  width?: unknown;
  height?: unknown;
  avg_frame_rate?: unknown;
  r_frame_rate?: unknown;
  duration?: unknown;
  disposition?: { default?: unknown; attached_pic?: unknown };
};

type FFprobeOutput = {
  streams?: FFprobeStream[];
  format?: { format_name?: unknown; duration?: unknown; tags?: { major_brand?: unknown } };
};

type ExecFileDependency = (
  file: string,
  args: string[],
  options: Record<string, unknown>,
  callback: (error: (Error & { code?: string | number; killed?: boolean; signal?: string | null }) | null, stdout: string, stderr: string) => void,
) => unknown;

function finiteNumber(value: unknown): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseFrameRate(value: unknown): number {
  if (typeof value !== "string") return finiteNumber(value);
  if (!/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(value)) return Number.NaN;
  const [numerator, denominator] = value.split("/").map(Number);
  return numerator! > 0 && denominator! > 0 ? numerator! / denominator! : Number.NaN;
}

function normalizeCodec(value: unknown): string {
  if (value === "hevc" || value === "h265") return "h265";
  return typeof value === "string" ? value.toLowerCase() : "";
}

function compatibleContainer(formatName: string, evidence: VideoContainerEvidence): boolean {
  const names = new Set(formatName.split(",").map((name) => name.trim().toLowerCase()));
  return evidence.container === "WEBM"
    ? names.has("webm")
    : names.has("mov") || names.has("mp4");
}

export function parseFFprobeOutput(raw: unknown, evidence: VideoContainerEvidence): VideoProbe {
  const output = raw && typeof raw === "object" ? raw as FFprobeOutput : {};
  const formatName = typeof output.format?.format_name === "string" ? output.format.format_name : "";
  if (!compatibleContainer(formatName, evidence)) {
    throw new VideoProbeMediaError("Video container must be MP4, MOV, or WebM.");
  }

  const substantive = (output.streams || []).filter((stream) =>
    stream.codec_type === "video" && Number(stream.disposition?.attached_pic || 0) !== 1
  );
  const defaults = substantive.filter((stream) => Number(stream.disposition?.default || 0) === 1);
  const selected = substantive.length === 1
    ? substantive[0]
    : defaults.length === 1
      ? defaults[0]
      : null;
  if (!selected) throw new VideoProbeMediaError();

  const averageFrameRate = parseFrameRate(selected.avg_frame_rate);
  const formatDuration = finiteNumber(output.format?.duration);
  return {
    container: evidence.container,
    mimeType: evidence.mimeType,
    formatName,
    majorBrand: evidence.majorBrand,
    codecName: normalizeCodec(selected.codec_name),
    width: finiteNumber(selected.width),
    height: finiteNumber(selected.height),
    frameRate: Number.isFinite(averageFrameRate) ? averageFrameRate : parseFrameRate(selected.r_frame_rate),
    durationSeconds: Number.isFinite(formatDuration) ? formatDuration : finiteNumber(selected.duration),
  };
}

export function parseVideoContainerSignature(source: Uint8Array): VideoContainerEvidence {
  const header = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  if (header.length >= 12 && header.subarray(4, 8).toString("ascii") === "ftyp") {
    const majorBrand = header.subarray(8, 12).toString("ascii");
    if (majorBrand === "qt  ") return { container: "MOV", mimeType: "video/quicktime", majorBrand };
    const normalizedBrand = majorBrand.toLowerCase();
    if (!normalizedBrand.startsWith("3gp") && !normalizedBrand.startsWith("3g2") && !NON_MP4_ISO_BMFF_BRANDS.has(normalizedBrand)) {
      return { container: "MP4", mimeType: "video/mp4", majorBrand };
    }
    throw new VideoProbeMediaError("Video container must be MP4, MOV, or WebM.");
  }
  if (
    header.length >= 4
    && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3
    && header.toString("latin1").toLowerCase().includes("webm")
  ) {
    return { container: "WEBM", mimeType: "video/webm", majorBrand: null };
  }
  throw new VideoProbeMediaError("Video container must be MP4, MOV, or WebM.");
}

export async function detectVideoContainer(path: string): Promise<VideoContainerEvidence> {
  const handle = await open(path, "r");
  try {
    const buffer = Buffer.allocUnsafe(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, 0);
    return parseVideoContainerSignature(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

function isProvenDecodeFailure(error: { code?: string | number; killed?: boolean; signal?: string | null }, stderr: string): boolean {
  if (error.killed || error.signal || typeof error.code !== "number") return false;
  const normalized = stderr.toLowerCase();
  return PROVEN_DECODE_ERRORS.some((message) => normalized.includes(message));
}

export async function probeVideo(
  path: string,
  dependencies: { execFile?: ExecFileDependency; detectContainer?: (path: string) => Promise<VideoContainerEvidence> } = {},
): Promise<VideoProbe> {
  let evidence: VideoContainerEvidence;
  try {
    evidence = await (dependencies.detectContainer || detectVideoContainer)(path);
  } catch (error) {
    if (error instanceof VideoProbeMediaError) throw error;
    throw new VideoProbeInfrastructureError();
  }

  const stdout = await new Promise<string>((resolve, reject) => {
    const run = dependencies.execFile || execFile as unknown as ExecFileDependency;
    run(
      ffprobeStatic.path,
      ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", path],
      {
        encoding: "utf8",
        maxBuffer: FFPROBE_OUTPUT_LIMIT,
        shell: false,
        windowsHide: true,
        timeout: FFPROBE_TIMEOUT_MS,
        killSignal: "SIGKILL",
      },
      (error, output, stderr) => {
        if (!error) return resolve(output);
        return reject(isProvenDecodeFailure(error, stderr)
          ? new VideoProbeMediaError()
          : new VideoProbeInfrastructureError());
      },
    );
  });

  try {
    return parseFFprobeOutput(JSON.parse(stdout) as FFprobeOutput, evidence);
  } catch (error) {
    if (error instanceof VideoProbeMediaError) throw error;
    throw new VideoProbeInfrastructureError();
  }
}

export async function probeStoredVideoStream(
  source: AsyncIterable<Uint8Array>,
  expectedByteSize: number,
  dependencies: { probe?: (path: string) => Promise<VideoProbe>; maximumBytes?: number } = {},
): Promise<VideoProbe> {
  const maximumBytes = dependencies.maximumBytes ?? MAX_VIDEO_BYTES;
  const directory = await mkdtemp(join(tmpdir(), "scheduler-video-validation-"));
  const temporaryPath = join(directory, `${crypto.randomUUID()}.media`);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(temporaryPath, "wx");
    let byteSize = 0;
    for await (const chunk of source) {
      if (!(chunk instanceof Uint8Array)) throw new VideoProbeInfrastructureError();
      byteSize += chunk.byteLength;
      if (byteSize > maximumBytes) throw new VideoProbeMediaError("Video size must not exceed 500 MB.");
      await handle.writeFile(chunk);
    }
    await handle.close();
    handle = null;
    if (byteSize !== expectedByteSize) {
      throw new VideoProbeMediaError("Stored video byte size does not match the reserved upload.");
    }
    return await (dependencies.probe || probeVideo)(temporaryPath);
  } finally {
    await handle?.close().catch(() => undefined);
    await rm(directory, { recursive: true, force: true });
  }
}

export function validateTikTokVideo(
  probe: VideoProbe,
  byteSize: number,
  creatorMaxDuration?: number,
): MediaValidationResult {
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Video size must not exceed 500 MB." };
  }
  const expectedMime = probe.container === "MP4" ? "video/mp4"
    : probe.container === "MOV" ? "video/quicktime"
      : probe.container === "WEBM" ? "video/webm"
        : null;
  if (!expectedMime || probe.mimeType !== expectedMime) {
    return { ok: false, error: "Video container must be MP4, MOV, or WebM." };
  }
  if (!new Set(["h264", "h265", "vp8", "vp9"]).has(probe.codecName)) {
    return { ok: false, error: "Video codec must be H.264, H.265, VP8, or VP9." };
  }
  if (
    !Number.isInteger(probe.width) || !Number.isInteger(probe.height)
    || probe.width < MIN_VIDEO_DIMENSION || probe.width > MAX_VIDEO_DIMENSION
    || probe.height < MIN_VIDEO_DIMENSION || probe.height > MAX_VIDEO_DIMENSION
  ) return { ok: false, error: "Video dimensions must be between 360 and 4096 pixels." };
  if (!Number.isFinite(probe.frameRate) || probe.frameRate < MIN_VIDEO_FPS || probe.frameRate > MAX_VIDEO_FPS) {
    return { ok: false, error: "Video frame rate must be between 23 and 60 FPS." };
  }
  if (!Number.isFinite(creatorMaxDuration) || creatorMaxDuration! <= 0) {
    return { ok: false, error: "Current TikTok video duration limit is unavailable." };
  }
  if (!Number.isFinite(probe.durationSeconds) || probe.durationSeconds <= 0) {
    return { ok: false, error: "Video duration is outside the allowed range." };
  }
  if (probe.durationSeconds > Math.min(creatorMaxDuration!, MAX_VIDEO_DURATION_SECONDS)) {
    return { ok: false, error: "Video duration exceeds the current TikTok creator limit." };
  }
  return { ok: true };
}
