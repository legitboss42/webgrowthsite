import { createHmac, timingSafeEqual } from "node:crypto";
import { hasCurrentLegalAcceptance, isActiveSchedulerUser } from "./legal";
import type { MediaKind } from "./types";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const PHOTO_FORMAT_MIME = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export const MAX_MEDIA_PER_POST = 10;

export type MediaValidationResult =
  | { ok: true }
  | { ok: false; error: string };

type SchedulerContentMutationUser = {
  status: string | null;
  suspendedAt: string | null;
  deletionRequestedAt: string | null;
  termsVersion: string | null;
  privacyVersion: string | null;
};

type PostMediaRow = { id: string; kind: MediaKind };

export function canMutateSchedulerContent(user: SchedulerContentMutationUser): boolean {
  return isActiveSchedulerUser(user) && hasCurrentLegalAcceptance(user);
}

export function validatePostMediaSelection(mediaIds: string[], media: PostMediaRow[]) {
  if (!mediaIds.length || mediaIds.length > MAX_MEDIA_PER_POST) {
    return { ok: false as const, error: "Select between 1 and 10 media files.", ownershipFailure: false };
  }

  const distinctIds = new Set(mediaIds);
  if (distinctIds.size !== mediaIds.length) {
    return { ok: false as const, error: "Select distinct media files.", ownershipFailure: false };
  }

  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  if (media.length !== distinctIds.size || mediaById.size !== distinctIds.size || mediaIds.some((id) => !mediaById.has(id))) {
    return { ok: false as const, error: "Media ownership check failed.", ownershipFailure: true };
  }

  const orderedMedia = mediaIds.map((id) => mediaById.get(id)!);
  const kind = orderedMedia[0]!.kind;
  if (orderedMedia.some((asset) => asset.kind !== kind) || (kind === "VIDEO" && orderedMedia.length !== 1)) {
    return { ok: false as const, error: "Post media cannot be mixed.", ownershipFailure: false };
  }

  return { ok: true as const, kind, orderedMedia };
}

export function validatePhotoMetadata(input: {
  mimeType: string;
  byteSize: number;
  decodedFormat: string | undefined;
  width: number | undefined;
  height: number | undefined;
}): MediaValidationResult {
  if (!Number.isSafeInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > 20 * 1024 * 1024) {
    return { ok: false, error: "Photo size is outside the allowed range." };
  }
  if (!PHOTO_TYPES.has(input.mimeType)) {
    return { ok: false, error: "Unsupported photo type." };
  }

  const decodedMime = PHOTO_FORMAT_MIME[input.decodedFormat as keyof typeof PHOTO_FORMAT_MIME];
  if (!decodedMime || decodedMime !== input.mimeType) {
    return { ok: false, error: "Photo content does not match its MIME type." };
  }
  if (!Number.isSafeInteger(input.width) || !Number.isSafeInteger(input.height) || input.width! <= 0 || input.height! <= 0) {
    return { ok: false, error: "Photo could not be decoded." };
  }

  return { ok: true };
}

export function buildStagingObjectPath(
  attemptId: string,
  originalFilename: string,
  randomId: () => string = () => crypto.randomUUID()
) {
  const extension = originalFilename.toLowerCase().match(/\.(mp4|mov|webm|jpe?g|png|webp)$/)?.[0] || "";
  return `${attemptId}/${randomId()}${extension}`;
}

export function validateMediaMetadata(input: { kind: MediaKind; mimeType: string; byteSize: number }) {
  const allowed = input.kind === "PHOTO" ? PHOTO_TYPES : VIDEO_TYPES;
  const maximum = (input.kind === "PHOTO" ? 20 : 500) * 1024 * 1024;
  if (!allowed.has(input.mimeType)) return { ok: false as const, error: "Unsupported media type." };
  if (!Number.isSafeInteger(input.byteSize) || input.byteSize <= 0 || input.byteSize > maximum) {
    return { ok: false as const, error: "Media size is outside the allowed range." };
  }
  return { ok: true as const };
}

function signingSecret() {
  const value = process.env.SCHEDULER_MEDIA_SIGNING_SECRET?.trim() || "";
  if (!value) throw new Error("Scheduler media signing secret is missing.");
  return value;
}

export function createMediaRetrievalSignature(mediaId: string, attemptId: string, expiresAt: number) {
  return createHmac("sha256", signingSecret()).update(`${mediaId}.${attemptId}.${expiresAt}`).digest("base64url");
}

export function verifyMediaRetrievalSignature(
  mediaId: string,
  attemptId: string,
  expiresAt: number,
  supplied: string,
  now = Date.now()
) {
  if (!supplied || now >= expiresAt) return false;
  const expected = createMediaRetrievalSignature(mediaId, attemptId, expiresAt);
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}
