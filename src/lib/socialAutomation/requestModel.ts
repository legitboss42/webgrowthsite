import type { SocialRenderProfile } from "./types";

const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_COMMIT = /^[a-f0-9]{7,64}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function finitePositive(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export type CreateJobRequest = {
  slug: string;
  sourceCommitSha: string;
  automationVersion: string;
};

export function parseCreateJobRequest(value: unknown): CreateJobRequest | null {
  const input = record(value);
  if (!input) return null;
  const slug = text(input.slug);
  const sourceCommitSha = text(input.sourceCommitSha);
  const automationVersion = text(input.automationVersion) || "v1";
  if (!SAFE_SLUG.test(slug) || !SAFE_COMMIT.test(sourceCommitSha)) return null;
  if (!/^[a-z0-9._-]{1,32}$/i.test(automationVersion)) return null;
  return { slug, sourceCommitSha, automationVersion };
}

export type AssetPrepareRequest = {
  jobId: string;
  profile: SocialRenderProfile;
  bucket: "social-automation" | "tiktok-scheduler-media";
  storagePath: string;
  filename: "meta.mp4" | "tiktok.mp4";
};

export function parseAssetPrepareRequest(value: unknown): AssetPrepareRequest | null {
  const input = record(value);
  if (!input) return null;
  const jobId = text(input.jobId);
  const profile = text(input.profile).toUpperCase();
  if (!UUID.test(jobId) || (profile !== "META" && profile !== "TIKTOK")) return null;
  const filename = profile === "META" ? "meta.mp4" : "tiktok.mp4";
  return {
    jobId,
    profile: profile as SocialRenderProfile,
    bucket: profile === "META" ? "social-automation" : "tiktok-scheduler-media",
    storagePath: `social/${jobId}/${filename}`,
    filename,
  };
}

export type AssetRegistrationRequest = {
  jobId: string;
  profile: SocialRenderProfile;
  storagePath: string;
  originalFilename: string;
  mimeType: "video/mp4";
  byteSize: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  checksum: string;
};

export function parseAssetRegistrationRequest(value: unknown): AssetRegistrationRequest | null {
  const input = record(value);
  if (!input) return null;
  const jobId = text(input.jobId);
  const profile = text(input.profile).toUpperCase();
  const storagePath = text(input.storagePath);
  const originalFilename = text(input.originalFilename);
  const mimeType = text(input.mimeType).toLowerCase();
  const byteSize = finitePositive(input.byteSize);
  const checksum = text(input.checksum).toLowerCase();
  const expectedFilename = profile === "META" ? "meta.mp4" : profile === "TIKTOK" ? "tiktok.mp4" : "";
  const expectedPath = expectedFilename ? `social/${jobId}/${expectedFilename}` : "";

  if (!UUID.test(jobId)) return null;
  if (profile !== "META" && profile !== "TIKTOK") return null;
  if (storagePath !== expectedPath) return null;
  if (originalFilename !== expectedFilename) return null;
  if (mimeType !== "video/mp4" || byteSize === null || !SHA256.test(checksum)) return null;

  const width = input.width == null ? null : finitePositive(input.width);
  const height = input.height == null ? null : finitePositive(input.height);
  const durationSeconds = input.durationSeconds == null ? null : finitePositive(input.durationSeconds);
  if (input.width != null && width === null) return null;
  if (input.height != null && height === null) return null;
  if (input.durationSeconds != null && durationSeconds === null) return null;

  return {
    jobId,
    profile: profile as SocialRenderProfile,
    storagePath,
    originalFilename,
    mimeType: "video/mp4",
    byteSize,
    width,
    height,
    durationSeconds,
    checksum,
  };
}

export function parsePublishRequest(value: unknown): { jobId: string } | null {
  const input = record(value);
  if (!input) return null;
  const jobId = text(input.jobId);
  return UUID.test(jobId) ? { jobId } : null;
}
