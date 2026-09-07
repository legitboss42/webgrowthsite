import { NextResponse } from "next/server";

import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { readSignedJsonRequest } from "@/lib/socialAutomation/internalRequestServer";
import { isRetentionCleanupEligible } from "@/lib/socialAutomation/retention";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanupLimit(value: unknown) {
  const input = record(value);
  const requested = Number(input?.limit ?? DEFAULT_LIMIT);
  return Number.isInteger(requested) && requested >= 1 && requested <= MAX_LIMIT
    ? requested
    : DEFAULT_LIMIT;
}

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function effectiveTikTokStatus(status: string | undefined) {
  if (status === "PUBLISHED") return "PUBLISHED";
  if (status === "CANCELLED") return "SKIPPED";
  return status ? "PROCESSING" : null;
}

export async function POST(request: Request) {
  const signed = await readSignedJsonRequest(request);
  if (!signed.ok) {
    return NextResponse.json({ ok: false, code: signed.code }, { status: signed.status });
  }

  const supabase = createSchedulerSupabaseClient();
  const nowIso = new Date().toISOString();
  const limit = cleanupLimit(signed.body);

  const { data: assets, error: assetError } = await supabase
    .from("social_media_assets")
    .select("id,job_id,profile,storage_path,retained_until,deleted_at")
    .is("deleted_at", null)
    .lte("retained_until", nowIso)
    .order("retained_until", { ascending: true })
    .limit(limit);

  if (assetError) {
    return NextResponse.json({ ok: false, code: "CLEANUP_ASSET_READ_FAILED" }, { status: 502 });
  }

  const rows = assets ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, scanned: 0, deleted: 0, failed: 0, protected: 0 });
  }

  const jobIds = [...new Set(rows.map((row) => String(row.job_id || "")).filter(Boolean))];
  const { data: publications, error: publicationError } = await supabase
    .from("social_publications")
    .select("job_id,platform,status,external_publication_id")
    .in("job_id", jobIds);

  if (publicationError) {
    return NextResponse.json(
      { ok: false, code: "CLEANUP_PUBLICATION_READ_FAILED" },
      { status: 502 }
    );
  }

  const byJob = new Map<string, Array<Record<string, unknown>>>();
  for (const raw of publications ?? []) {
    const row = raw as Record<string, unknown>;
    const jobId = safeText(row.job_id);
    if (!jobId) continue;
    const current = byJob.get(jobId) ?? [];
    current.push(row);
    byJob.set(jobId, current);
  }

  const tiktokPostIds = [
    ...new Set(
      (publications ?? [])
        .filter((row) => row.platform === "TIKTOK")
        .map((row) => safeText(row.external_publication_id))
        .filter(Boolean)
    ),
  ];
  const schedulerState = new Map<string, { status: string; terminalAt: string | null }>();
  if (tiktokPostIds.length > 0) {
    const { data: posts, error: postError } = await supabase
      .from("scheduled_posts")
      .select("id,status,terminal_at")
      .in("id", tiktokPostIds);
    if (postError) {
      return NextResponse.json(
        { ok: false, code: "CLEANUP_TIKTOK_STATE_READ_FAILED" },
        { status: 502 }
      );
    }
    for (const post of posts ?? []) {
      schedulerState.set(String(post.id), {
        status: String(post.status),
        terminalAt: post.terminal_at ? String(post.terminal_at) : null,
      });
    }
  }

  let deleted = 0;
  let failed = 0;
  let protectedCount = 0;

  for (const asset of rows) {
    const profile = asset.profile === "TIKTOK" ? "TIKTOK" : "META";
    const jobPublications = byJob.get(String(asset.job_id)) ?? [];
    let publicationStatuses: string[];
    let schedulerTerminalAt: string | null = null;

    if (profile === "META") {
      publicationStatuses = jobPublications
        .filter((row) => row.platform === "INSTAGRAM" || row.platform === "FACEBOOK")
        .map((row) => safeText(row.status))
        .filter(Boolean);
    } else {
      const tiktok = jobPublications.find((row) => row.platform === "TIKTOK");
      const postId = safeText(tiktok?.external_publication_id);
      const scheduler = postId ? schedulerState.get(postId) : undefined;
      const liveSchedulerStatus = effectiveTikTokStatus(scheduler?.status);
      schedulerTerminalAt = scheduler?.terminalAt ?? null;
      publicationStatuses = [liveSchedulerStatus || safeText(tiktok?.status)].filter(Boolean);
    }

    const eligible = isRetentionCleanupEligible(
      {
        profile,
        retainedUntil: asset.retained_until ? String(asset.retained_until) : null,
        deletedAt: asset.deleted_at ? String(asset.deleted_at) : null,
        publicationStatuses,
        schedulerTerminalAt,
      },
      Date.now()
    );

    if (!eligible) {
      protectedCount += 1;
      continue;
    }

    const storagePath = safeText(asset.storage_path);
    const bucket = profile === "META" ? "social-automation" : "tiktok-scheduler-media";
    const { error: removeError } = await supabase.storage.from(bucket).remove([storagePath]);

    if (removeError) {
      failed += 1;
      if (profile === "TIKTOK") {
        await supabase
          .from("media_assets")
          .update({
            cleanup_state: "NEEDS_ATTENTION",
            cleanup_last_error_code: "STORAGE_REMOVE_FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("storage_path", storagePath);
      }
      await supabase.from("social_automation_audit_log").insert({
        job_id: asset.job_id,
        event_type: "ASSET_CLEANUP_FAILED",
        actor: "SYSTEM",
        metadata: { profile, storagePath, code: "STORAGE_REMOVE_FAILED" },
      });
      continue;
    }

    const deletedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("social_media_assets")
      .update({ deleted_at: deletedAt, updated_at: deletedAt })
      .eq("id", asset.id)
      .is("deleted_at", null);

    if (updateError) {
      failed += 1;
      await supabase.from("social_automation_audit_log").insert({
        job_id: asset.job_id,
        event_type: "ASSET_CLEANUP_FAILED",
        actor: "SYSTEM",
        metadata: { profile, storagePath, code: "DB_MARK_DELETED_FAILED" },
      });
      continue;
    }

    if (profile === "TIKTOK") {
      await supabase
        .from("media_assets")
        .update({
          storage_deleted_at: deletedAt,
          cleanup_state: "COMPLETE",
          cleanup_last_error_code: null,
          updated_at: deletedAt,
        })
        .eq("storage_path", storagePath);
    }

    await supabase.from("social_automation_audit_log").insert({
      job_id: asset.job_id,
      event_type: "ASSET_CLEANED",
      actor: "SYSTEM",
      metadata: { profile, storagePath },
    });
    deleted += 1;
  }

  return NextResponse.json({
    ok: failed === 0,
    scanned: rows.length,
    deleted,
    failed,
    protected: protectedCount,
  });
}
