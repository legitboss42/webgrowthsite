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
import sharp from "sharp";
