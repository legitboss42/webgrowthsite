type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type RequestResponse = { ok: boolean; json(): Promise<unknown> };

type Dependencies = {
  request(url: string, init: { method: "POST"; headers: Record<string, string>; body: string }): Promise<RequestResponse>;
  uploadSigned(input: { path: string; token: string; file: UploadFile; contentType: string }): Promise<{ error: { message?: string } | null }>;
  sha256(source: ArrayBuffer): Promise<Uint8Array>;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

function safeReason(payload: unknown, fallback: string) {
  const reason = record(payload).error;
  if (typeof reason !== "string") return fallback;
  const clean = reason.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return clean && clean.length <= 240 ? clean : fallback;
}

export function createSchedulerMediaUploadAdapter(dependencies: Dependencies) {
  return async function uploadFile(file: UploadFile): Promise<string> {
    const reserveResponse = await dependencies.request("/api/scheduler/uploads/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        kind: file.type.startsWith("video/") ? "VIDEO" : "PHOTO",
        filename: file.name,
        mimeType: file.type,
        byteSize: file.size,
      }),
    });
    const reserve = record(await reserveResponse.json());
    if (!reserveResponse.ok) throw new Error(safeReason(reserve, "Unable to reserve the media file."));
    if (typeof reserve.assetId !== "string" || typeof reserve.path !== "string" || typeof reserve.token !== "string") {
      throw new Error("Unable to reserve the media file.");
    }

    const uploaded = await dependencies.uploadSigned({
      path: reserve.path,
      token: reserve.token,
      file,
      contentType: file.type,
    });
    if (uploaded.error) throw new Error(uploaded.error.message || "Storage upload failed.");

    const digest = await dependencies.sha256(await file.arrayBuffer());
    const checksum = Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
    const finalizeResponse = await dependencies.request("/api/scheduler/uploads/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "finalize", assetId: reserve.assetId, checksum }),
    });
    const finalized = await finalizeResponse.json();
    if (!finalizeResponse.ok) throw new Error(safeReason(finalized, "Media validation failed."));
    return reserve.assetId;
  };
}
