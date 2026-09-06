import { NextResponse } from "next/server";

import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { readSignedJsonRequest } from "@/lib/socialAutomation/internalRequestServer";
import {
  parseAssetPrepareRequest,
  parseAssetRegistrationRequest,
} from "@/lib/socialAutomation/requestModel";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

function actionOf(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  return typeof (body as Record<string, unknown>).action === "string"
    ? String((body as Record<string, unknown>).action).trim().toLowerCase()
    : "";
}

export async function POST(request: Request) {
  const signed = await readSignedJsonRequest(request);
  if (!signed.ok) {
    return NextResponse.json({ ok: false, code: signed.code }, { status: signed.status });
  }

  const action = actionOf(signed.body);
  const store = createSocialAutomationStore();

  if (action === "prepare") {
    const input = parseAssetPrepareRequest(signed.body);
    if (!input) {
      return NextResponse.json({ ok: false, code: "INVALID_ASSET_PREPARE_REQUEST" }, { status: 400 });
    }
    const job = await store.getJob(input.jobId);
    if (!job) {
      return NextResponse.json({ ok: false, code: "JOB_NOT_FOUND" }, { status: 404 });
    }

    const supabase = createSchedulerSupabaseClient();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUploadUrl(input.storagePath, { upsert: true });
    if (error || !data) {
      return NextResponse.json({ ok: false, code: "SIGNED_UPLOAD_FAILED" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      bucket: input.bucket,
      storagePath: input.storagePath,
      filename: input.filename,
      signedUrl: data.signedUrl,
      token: data.token,
    });
  }

  if (action === "register") {
    const input = parseAssetRegistrationRequest(signed.body);
    if (!input) {
      return NextResponse.json({ ok: false, code: "INVALID_ASSET_REGISTER_REQUEST" }, { status: 400 });
    }
    const job = await store.getJob(input.jobId);
    if (!job) {
      return NextResponse.json({ ok: false, code: "JOB_NOT_FOUND" }, { status: 404 });
    }

    const asset = await store.registerAsset({
      jobId: input.jobId,
      profile: input.profile,
      storagePath: input.storagePath,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      width: input.width,
      height: input.height,
      durationSeconds: input.durationSeconds,
      checksum: input.checksum,
      retainedUntil: null,
    });

    const assets = await store.listAssets(input.jobId);
    if (assets.some((row) => row.profile === "META") && assets.some((row) => row.profile === "TIKTOK")) {
      await store.updateJob(input.jobId, { status: "WAITING_FOR_ARTICLE" });
    } else {
      await store.updateJob(input.jobId, { status: "UPLOADING" });
    }
    await store.audit({
      jobId: input.jobId,
      eventType: "ASSET_REGISTERED",
      metadata: { profile: input.profile, storagePath: input.storagePath },
    });

    return NextResponse.json({ ok: true, assetId: String(asset.id) });
  }

  return NextResponse.json({ ok: false, code: "UNSUPPORTED_ASSET_ACTION" }, { status: 400 });
}
