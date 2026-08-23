import { validateMediaMetadata } from "./media";
import type { TikTokPhotoSourceValidationResult } from "./mediaDelivery";
import type { MediaKind } from "./types";

type AdapterReadResult<T> = { data: T | null; error: boolean };
type AdapterWriteResult = { error: boolean };

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
  downloadObject(input: { storagePath: string }): Promise<AdapterReadResult<ArrayBuffer | Uint8Array>>;
  validatePhoto(source: ArrayBuffer | Uint8Array, mimeType: string, byteSize: number): Promise<TikTokPhotoSourceValidationResult>;
  markInvalid(input: { userId: string; assetId: string }): Promise<AdapterWriteResult>;
  markValid(input: {
    userId: string;
    assetId: string;
    checksum: string;
    mimeType: string;
    byteSize: number;
    width?: number;
    height?: number;
  }): Promise<AdapterWriteResult>;
};

async function invalidMedia(
  adapter: UploadFinalizationAdapter,
  input: { userId: string; assetId: string },
) {
  const invalidated = await adapter.markInvalid(input);
  if (invalidated.error) return { ok: false as const, status: 502, error: "Unable to record invalid media." };
  return { ok: false as const, status: 400, error: "Stored media did not pass validation." };
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

    const metadataValidation = validateMediaMetadata({ kind: asset.kind, mimeType: stored.mimeType, byteSize: stored.byteSize });
    if (!metadataValidation.ok || stored.byteSize !== asset.byteSize) {
      return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId });
    }

    let photoMetadata: { width?: number; height?: number; mimeType?: string } = {};
    if (asset.kind === "PHOTO") {
      const downloadResult = await adapter.downloadObject({ storagePath: asset.storagePath });
      if (downloadResult.error || !downloadResult.data) {
        return { ok: false as const, status: 502, error: "Unable to download stored media for validation." };
      }
      const photoValidation = await adapter.validatePhoto(downloadResult.data, stored.mimeType, stored.byteSize);
      if (!photoValidation.ok) return invalidMedia(adapter, { userId: input.userId, assetId: input.assetId });
      photoMetadata = photoValidation;
    }

    const updated = await adapter.markValid({
      userId: input.userId,
      assetId: input.assetId,
      checksum: input.checksum,
      mimeType: photoMetadata.mimeType || stored.mimeType,
      byteSize: stored.byteSize,
      width: photoMetadata.width,
      height: photoMetadata.height,
    });
    if (updated.error) return { ok: false as const, status: 502, error: "Unable to finalize media asset." };
    return { ok: true as const, status: 200, assetId: input.assetId, validationStatus: "VALID" as const };
  } catch {
    return { ok: false as const, status: 502, error: "Unable to finalize media asset." };
  }
}
