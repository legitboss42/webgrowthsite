import { createHmac, timingSafeEqual } from "node:crypto";
import type { MediaKind } from "./types";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

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
