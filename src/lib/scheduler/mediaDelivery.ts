import sharp from "sharp";
import { validatePhotoMetadata, type MediaValidationResult } from "./media";

export function normalizeTikTokMediaPath(segments: string[]) {
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\/\0]/.test(segment))) {
    throw new Error("Invalid TikTok media path.");
  }
  return segments.join("/");
}

export function getTikTokMediaHeaders(contentType: string, contentLength: number) {
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600, immutable",
    "Content-Length": String(contentLength),
    "Content-Type": contentType || "application/octet-stream",
  };
}

export async function normalizeTikTokPhoto(source: ArrayBuffer | Uint8Array) {
  return sharp(source)
    .rotate()
    .resize({ width: 1080, height: 1080, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

export type TikTokPhotoSourceValidationResult = MediaValidationResult & {
  width?: number;
  height?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
};

export async function validateTikTokPhotoSource(
  source: ArrayBuffer | Uint8Array,
  mimeType: string,
  byteSize: number,
): Promise<TikTokPhotoSourceValidationResult> {
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(source, { failOn: "error" }).metadata();
    await sharp(source, { failOn: "error" })
      .rotate()
      .resize({ width: 1080, height: 1080, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  } catch {
    return { ok: false, error: "Photo could not be decoded." };
  }

  const validation = validatePhotoMetadata({
    mimeType,
    byteSize,
    decodedFormat: metadata.format,
    width: metadata.width,
    height: metadata.height,
  });
  if (!validation.ok) return validation;
  if (source.byteLength !== byteSize) return { ok: false, error: "Photo size is outside the allowed range." };

  return {
    ok: true,
    width: metadata.width,
    height: metadata.height,
    mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
  };
}
