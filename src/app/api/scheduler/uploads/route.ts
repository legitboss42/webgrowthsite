import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateMediaMetadata } from "@/lib/scheduler/media";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import type { MediaKind } from "@/lib/scheduler/types";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const supabase = createSchedulerSupabaseClient();

  if (body?.action === "create") {
    const kind: MediaKind = body.kind === "VIDEO" ? "VIDEO" : "PHOTO";
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
    const { data: asset } = await supabase.from("media_assets")
      .select("id,storage_path,kind,mime_type,byte_size").eq("id", assetId)
      .eq("user_id", session.userId).single();
    if (!asset || !checksum) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
    const parts = asset.storage_path.split("/");
    const filename = parts.pop()!;
    const { data: objects } = await supabase.storage.from("tiktok-scheduler-media")
      .list(parts.join("/"), { search: filename, limit: 1 });
    const object = objects?.find((item) => item.name === filename);
    const storedSize = Number(object?.metadata?.size);
    const storedMime = String(object?.metadata?.mimetype || asset.mime_type);
    const validation = validateMediaMetadata({ kind: asset.kind as MediaKind, mimeType: storedMime, byteSize: storedSize });
    if (!object || !validation.ok || storedSize !== Number(asset.byte_size)) {
      await supabase.from("media_assets").update({ validation_status: "INVALID" }).eq("id", assetId);
      return NextResponse.json({ error: "Stored media did not pass validation." }, { status: 400 });
    }
    await supabase.from("media_assets").update({
      checksum, mime_type: storedMime, byte_size: storedSize, validation_status: "VALID",
    }).eq("id", assetId).eq("user_id", session.userId);
    return NextResponse.json({ assetId, status: "VALID" });
  }

  return NextResponse.json({ error: "Unsupported upload action." }, { status: 400 });
}
