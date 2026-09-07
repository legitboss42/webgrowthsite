import "server-only";

import { getCurrentCreatorVideoLimit } from "./creatorVideoLimit";
import { saveRefreshedCreatorConnection } from "./creatorVideoLimitStore";
import { validateTikTokPhotoSource } from "./mediaDelivery";
import { downloadStoredVideoStream } from "./storageVideoDownload";
import { createSchedulerSupabaseClient } from "./supabase";
import { finalizeSchedulerUpload } from "./uploadFinalization";
import {
  probeStoredVideoStream,
  validateTikTokVideo,
  VideoProbeInfrastructureError,
  VideoProbeMediaError,
  VIDEO_VALIDATION_VERSION,
} from "./videoValidation";

export async function finalizeStoredSchedulerMedia(input: {
  userId: string;
  assetId: string;
  checksum: string;
}) {
  const supabase = createSchedulerSupabaseClient();

  return finalizeSchedulerUpload(input, {
    async findOwnedAsset(value) {
      const { data, error } = await supabase.from("media_assets")
        .select("id,storage_path,kind,mime_type,byte_size")
        .eq("id", value.assetId)
        .eq("user_id", value.userId)
        .maybeSingle();
      return {
        error: !!error,
        data: data ? {
          id: String(data.id),
          storagePath: String(data.storage_path),
          kind: data.kind as "PHOTO" | "VIDEO",
          mimeType: String(data.mime_type),
          byteSize: Number(data.byte_size),
        } : null,
      };
    },
    async inspectObject(value) {
      const parts = value.storagePath.split("/");
      const filename = parts.pop();
      if (!filename) return { data: null, error: false };
      const { data, error } = await supabase.storage.from("tiktok-scheduler-media")
        .list(parts.join("/"), { search: filename, limit: 1 });
      const object = data?.find((item) => item.name === filename);
      return {
        error: !!error,
        data: object ? {
          byteSize: Number(object.metadata?.size),
          mimeType: String(object.metadata?.mimetype || ""),
        } : null,
      };
    },
    async downloadPhoto(value) {
      const { data, error } = await supabase.storage.from("tiktok-scheduler-media").download(value.storagePath);
      return { error: !!error, data: data ? await data.arrayBuffer() : null };
    },
    async downloadVideo(value) {
      return downloadStoredVideoStream(supabase.storage.from("tiktok-scheduler-media"), value.storagePath);
    },
    async getCreatorMaxDuration(value) {
      return getCurrentCreatorVideoLimit(value.userId, {
        async readConnection(userId) {
          const { data, error } = await supabase.from("tiktok_connections")
            .select("encrypted_tokens,scopes,access_expires_at")
            .eq("user_id", userId)
            .maybeSingle();
          return {
            error: !!error,
            data: data ? {
              encryptedTokens: String(data.encrypted_tokens),
              scopes: Array.isArray(data.scopes) ? data.scopes.map(String) : [],
              accessExpiresAt: String(data.access_expires_at),
            } : null,
          };
        },
        async saveRefreshedConnection(refreshed) {
          return saveRefreshedCreatorConnection(supabase, refreshed);
        },
      });
    },
    validatePhoto: validateTikTokPhotoSource,
    async validateVideo(source, byteSize, creatorMaxDuration) {
      try {
        const probe = await probeStoredVideoStream(source, byteSize);
        const validation = validateTikTokVideo(probe, byteSize, creatorMaxDuration);
        if (!validation.ok) return validation;
        return { ok: true, probe, validationVersion: VIDEO_VALIDATION_VERSION };
      } catch (error) {
        if (error instanceof VideoProbeMediaError) {
          return { ok: false, error: error.publicMessage };
        }
        return {
          ok: false,
          infrastructureError: true,
          error: error instanceof VideoProbeInfrastructureError
            ? error.message
            : "Video validation infrastructure is unavailable.",
        };
      }
    },
    async markInvalid(value) {
      const { data, error } = await supabase.from("media_assets").update({ validation_status: "INVALID" })
        .eq("id", value.assetId)
        .eq("user_id", value.userId)
        .eq("validation_status", value.expectedValidationStatus)
        .select("id");
      return { error: !!error, updatedCount: data?.length ?? 0 };
    },
    async markValid(value) {
      const { data, error } = await supabase.from("media_assets").update({
        checksum: value.checksum,
        mime_type: value.mimeType,
        byte_size: value.byteSize,
        width: value.width,
        height: value.height,
        duration_seconds: value.durationSeconds,
        video_codec: value.videoCodec,
        frame_rate: value.frameRate,
        validation_version: value.validationVersion,
        probe_metadata: value.probeMetadata,
        validation_status: "VALID",
      }).eq("id", value.assetId)
        .eq("user_id", value.userId)
        .eq("validation_status", value.expectedValidationStatus)
        .select("id");
      return { error: !!error, updatedCount: data?.length ?? 0 };
    },
  });
}
