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
