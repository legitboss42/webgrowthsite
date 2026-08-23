import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canMutateSchedulerContent, validateMediaMetadata } from "@/lib/scheduler/media";
import { validateTikTokPhotoSource } from "@/lib/scheduler/mediaDelivery";
import { assertVideoUploadEnabled, getSchedulerLaunchState } from "@/lib/scheduler/launch";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import type { MediaKind } from "@/lib/scheduler/types";
import { finalizeSchedulerUpload } from "@/lib/scheduler/uploadFinalization";
import {
  probeStoredVideo,
  validateTikTokVideo,
  VideoProbeMediaError,
  VIDEO_VALIDATION_VERSION,
} from "@/lib/scheduler/videoValidation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const supabase = createSchedulerSupabaseClient();
  if (body?.action === "create" || body?.action === "finalize") {
    const { data: user, error: userError } = await supabase.from("scheduler_users")
      .select("status,suspended_at,deletion_requested_at,terms_version,privacy_version")
      .eq("id", session.userId)
      .maybeSingle();
    if (userError) {
      return NextResponse.json({ error: "Unable to verify scheduler access." }, { status: 502 });
    }
    const canMutate = !userError && !!user && canMutateSchedulerContent({
      status: typeof user.status === "string" ? user.status : null,
      suspendedAt: typeof user.suspended_at === "string" ? user.suspended_at : null,
      deletionRequestedAt: typeof user.deletion_requested_at === "string" ? user.deletion_requested_at : null,
      termsVersion: typeof user.terms_version === "string" ? user.terms_version : null,
      privacyVersion: typeof user.privacy_version === "string" ? user.privacy_version : null,
    });
    if (!canMutate) {
      return NextResponse.json({ error: "Active scheduler access and current legal acceptance are required." }, { status: 403 });
    }
  }

  if (body?.action === "create") {
    const kind: MediaKind = body.kind === "VIDEO" ? "VIDEO" : "PHOTO";
    try {
      assertVideoUploadEnabled(kind, getSchedulerLaunchState());
    } catch {
      return NextResponse.json({ error: "Video uploads are unavailable." }, { status: 503 });
    }
    const mimeType = String(body.mimeType || "");
    const byteSize = Number(body.byteSize);
    const validation = validateMediaMetadata({ kind, mimeType, byteSize });
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    const assetId = crypto.randomUUID();
    const extension = String(body.filename || "").toLowerCase().match(/\.(mp4|mov|webm|jpe?g|png|webp)$/)?.[0] || "";
    const storagePath = `${session.userId}/${assetId}/upload${extension}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("tiktok-scheduler-media")
      .createSignedUploadUrl(storagePath);
    if (uploadError) return NextResponse.json({ error: "Unable to create upload target." }, { status: 502 });
    const { error: insertError } = await supabase.from("media_assets").insert({
      id: assetId, user_id: session.userId, kind, storage_path: storagePath,
      original_filename: String(body.filename || "upload"), mime_type: mimeType,
      byte_size: byteSize, checksum: `pending:${assetId}`, validation_status: "PENDING",
    });
    if (insertError) return NextResponse.json({ error: "Unable to reserve media asset." }, { status: 502 });
    return NextResponse.json({ assetId, path: upload.path, token: upload.token });
  }

  if (body?.action === "finalize") {
    const assetId = String(body.assetId || "");
    const checksum = String(body.checksum || "");
    const result = await finalizeSchedulerUpload({ userId: session.userId, assetId, checksum }, {
      async findOwnedAsset(input) {
        const { data, error } = await supabase.from("media_assets")
          .select("id,storage_path,kind,mime_type,byte_size")
          .eq("id", input.assetId)
          .eq("user_id", input.userId)
          .maybeSingle();
        return {
          error: !!error,
          data: data ? {
            id: String(data.id),
            storagePath: String(data.storage_path),
            kind: data.kind as MediaKind,
            mimeType: String(data.mime_type),
            byteSize: Number(data.byte_size),
          } : null,
        };
      },
      async inspectObject(input) {
        const parts = input.storagePath.split("/");
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
      async downloadObject(input) {
        const { data, error } = await supabase.storage.from("tiktok-scheduler-media").download(input.storagePath);
        return { error: !!error, data: data ? await data.arrayBuffer() : null };
      },
      validatePhoto: validateTikTokPhotoSource,
      async validateVideo(source, byteSize) {
        try {
          const probe = await probeStoredVideo(source);
          const validation = validateTikTokVideo(probe, byteSize);
          if (!validation.ok) return validation;
          return { ok: true, probe, validationVersion: VIDEO_VALIDATION_VERSION };
        } catch (error) {
          if (error instanceof VideoProbeMediaError) {
            return { ok: false, error: "Stored video could not be decoded." };
          }
          return {
            ok: false,
            infrastructureError: true,
            error: "Video validation infrastructure is unavailable.",
          };
        }
      },
      async markInvalid(input) {
        const { data, error } = await supabase.from("media_assets").update({ validation_status: "INVALID" })
          .eq("id", input.assetId).eq("user_id", input.userId)
          .eq("validation_status", input.expectedValidationStatus).select("id");
        return { error: !!error, updatedCount: data?.length ?? 0 };
      },
      async markValid(input) {
        const { data, error } = await supabase.from("media_assets").update({
          checksum: input.checksum,
          mime_type: input.mimeType,
          byte_size: input.byteSize,
          width: input.width,
          height: input.height,
          duration_seconds: input.durationSeconds,
          video_codec: input.videoCodec,
          frame_rate: input.frameRate,
          validation_version: input.validationVersion,
          probe_metadata: input.probeMetadata,
          validation_status: "VALID",
        }).eq("id", input.assetId).eq("user_id", input.userId)
          .eq("validation_status", input.expectedValidationStatus).select("id");
        return { error: !!error, updatedCount: data?.length ?? 0 };
      },
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ assetId: result.assetId, status: result.validationStatus });
  }

  return NextResponse.json({ error: "Unsupported upload action." }, { status: 400 });
}
