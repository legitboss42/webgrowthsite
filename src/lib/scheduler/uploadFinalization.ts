import { validateMediaMetadata } from "./media";
import type { TikTokPhotoSourceValidationResult } from "./mediaDelivery";
import type { MediaKind } from "./types";
import type { VideoProbe } from "./videoValidation";

type AdapterReadResult<T> = { data: T | null; error: boolean };
type AdapterWriteResult = { error: boolean; updatedCount: number };

export type UploadFinalizationAsset = {
  id: string;
  storagePath: string;
  kind: MediaKind;
  mimeType: string;
  byteSize: number;
};

export type UploadFinalizationAdapter = {
  findOwnedAsset(input: { userId: string; assetId: string }): Promise<AdapterReadResult<UploadFinalizationAsset>>;
  inspectObject(input: { storagePath: string }): Promise<AdapterReadResult<{ byteSize: number; mimeType: string }>>;
  downloadPhoto(input: { storagePath: string }): Promise<AdapterReadResult<ArrayBuffer | Uint8Array>>;
  downloadVideo(input: { storagePath: string }): Promise<AdapterReadResult<ReadableStream<Uint8Array>>>;
  getCreatorMaxDuration(input: { userId: string }): Promise<
    | { ok: true; maxDurationSeconds: number }
    | { ok: false; error: string }
  >;
  validatePhoto(source: ArrayBuffer | Uint8Array, mimeType: string, byteSize: number): Promise<TikTokPhotoSourceValidationResult>;
  validateVideo: (source: ReadableStream<Uint8Array>, byteSize: number, creatorMaxDuration: number) => Promise<
    | { ok: true; probe: VideoProbe; validationVersion: string }
    | { ok: false; error: string; infrastructureError?: boolean }
  >;
  markInvalid(input: { userId: string; assetId: string; expectedValidationStatus: "PENDING" }): Promise<AdapterWriteResult>;
  markValid(input: {
    userId: string;
    assetId: string;
    checksum: string;
    mimeType: string;
    byteSize: number;
    width?: number;
    height?: number;
    durationSeconds?: number;
    videoCodec?: string;
    frameRate?: number;
    validationVersion?: string;
    probeMetadata?: VideoProbe;
    expectedValidationStatus: "PENDING";
  }): Promise<AdapterWriteResult>;
};

async function invalidMedia(
  adapter: UploadFinalizationAdapter,
  input: { userId: string; assetId: string },
  validationError?: string,
) {
  const invalidated = await adapter.markInvalid({ ...input, expectedValidationStatus: "PENDING" });
  if (invalidated.error || invalidated.updatedCount !== 1) return { ok: false as const, status: 502, error: "Unable to record invalid media." };
  const allowed = new Set([
    "Video size must not exceed 500 MB.",
    "Stored video byte size does not match the reserved upload.",
    "Video container must be MP4, MOV, or WebM.",
    "Video codec must be H.264, H.265, VP8, or VP9.",
    "Video dimensions must be between 360 and 4096 pixels.",
    "Video frame rate must be between 23 and 60 FPS.",
    "Video duration is outside the allowed range.",
    "Video duration exceeds the current TikTok creator limit.",
    "Stored video could not be decoded.",
  ]);
  return {
    ok: false as const,
    status: 400,
    error: validationError && allowed.has(validationError)
      ? validationError
      : "Stored media did not pass validation.",
  };
}

export async function finalizeSchedulerUpload(
  input: { userId: string; assetId: string; checksum: string },
  adapter: UploadFinalizationAdapter,
) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.assetId) || !input.checksum) {
      return { ok: false as const, status: 400, error: "Invalid finalization request." };
    }

    const assetResult = await adapter.findOwnedAsset({ userId: input.userId, assetId: input.assetId });
    if (assetResult.error) return { ok: false as const, status: 502, error: "Unable to read media asset." };
    if (!assetResult.data) return { ok: false as const, status: 404, error: "Media asset not found." };
    const asset = assetResult.data;

    const objectResult = await adapter.inspectObject({ storagePath: asset.storagePath });
    if (objectResult.error) return { ok: false as const, status: 502, error: "Unable to inspect stored media." };
    if (!objectResult.data) return { ok: false as const, status: 404, error: "Stored media was not found." };
    const stored = objectResult.data;

    if (asset.kind === "PHOTO") {
      const metadataValidation = validateMediaMetadata({ kind: asset.kind, mimeType: stored.mimeType, byteSize: stored.byteSize });
      if (!metadataValidation.ok || stored.byteSize !== asset.byteSize) {
        return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId });
      }
    } else {
      if (!Number.isSafeInteger(stored.byteSize) || stored.byteSize <= 0 || stored.byteSize > 500 * 1024 * 1024) {
        return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId }, "Video size must not exceed 500 MB.");
      }
      if (stored.byteSize !== asset.byteSize) {
        return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId }, "Stored video byte size does not match the reserved upload.");
      }
    }

    let validatedMetadata: {
      width?: number;
      height?: number;
      mimeType?: string;
      durationSeconds?: number;
      videoCodec?: string;
      frameRate?: number;
      validationVersion?: string;
      probeMetadata?: VideoProbe;
    } = {};
    if (asset.kind === "PHOTO") {
      const downloadResult = await adapter.downloadPhoto({ storagePath: asset.storagePath });
      if (downloadResult.error || !downloadResult.data) {
        return { ok: false as const, status: 502, error: "Unable to download stored media for validation." };
      }
      const photoValidation = await adapter.validatePhoto(downloadResult.data, stored.mimeType, stored.byteSize);
      if (!photoValidation.ok) return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId });
      validatedMetadata = {
        width: photoValidation.width,
        height: photoValidation.height,
        mimeType: photoValidation.mimeType,
      };
    } else {
      const creatorLimit = await adapter.getCreatorMaxDuration({ userId: input.userId });
      if (!creatorLimit.ok || !Number.isFinite(creatorLimit.maxDurationSeconds) || creatorLimit.maxDurationSeconds <= 0) {
        return { ok: false as const, status: 502, error: "Current TikTok video duration limit is unavailable." };
      }
      const downloadResult = await adapter.downloadVideo({ storagePath: asset.storagePath });
      if (downloadResult.error || !downloadResult.data) {
        return { ok: false as const, status: 502, error: "Unable to download stored media for validation." };
      }
      const videoValidation = await adapter.validateVideo(
        downloadResult.data,
        stored.byteSize,
        creatorLimit.maxDurationSeconds,
      );
      if (!videoValidation.ok) {
        if (videoValidation.infrastructureError) {
          return { ok: false as const, status: 502, error: "Unable to probe stored video." };
        }
        return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId }, videoValidation.error);
      }
      validatedMetadata = {
        mimeType: videoValidation.probe.mimeType,
        width: videoValidation.probe.width,
        height: videoValidation.probe.height,
        durationSeconds: videoValidation.probe.durationSeconds,
        videoCodec: videoValidation.probe.codecName,
        frameRate: videoValidation.probe.frameRate,
        validationVersion: videoValidation.validationVersion,
        probeMetadata: videoValidation.probe,
      };
    }

    const updated = await adapter.markValid({
      userId: input.userId,
      assetId: input.assetId,
      checksum: input.checksum,
      mimeType: validatedMetadata.mimeType || stored.mimeType,
      byteSize: stored.byteSize,
      ...validatedMetadata,
      expectedValidationStatus: "PENDING",
    });
    if (updated.error || updated.updatedCount !== 1) return { ok: false as const, status: 502, error: "Unable to finalize media asset." };
    return { ok: true as const, status: 200, assetId: input.assetId, validationStatus: "VALID" as const };
  } catch {
    return { ok: false as const, status: 502, error: "Unable to finalize media asset." };
  }
}
