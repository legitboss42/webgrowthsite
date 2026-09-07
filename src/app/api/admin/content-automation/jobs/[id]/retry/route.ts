import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasContentAutomationAdminAccess } from "@/app/admin/content-automation/auth";
import { isSameOriginMutation } from "@/lib/scheduler/policy";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { canRetryPublicationStatus } from "@/lib/socialAutomation/adminModel";
import { runSocialPublicationJob } from "@/lib/socialAutomation/publicationRunnerServer";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return NextResponse.json({ ok: false, code: "ADMIN_AUTH_REQUIRED" }, { status: 401 });
  }
  if (!isSameOriginMutation(request.headers.get("origin"), request.url)) {
    return NextResponse.json({ ok: false, code: "INVALID_ORIGIN" }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ ok: false, code: "INVALID_JOB_ID" }, { status: 400 });
  }

  const supabase = createSchedulerSupabaseClient();
  const { data: job, error: jobError } = await supabase
    .from("social_automation_jobs")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (jobError) {
    return NextResponse.json({ ok: false, code: "JOB_READ_FAILED" }, { status: 503 });
  }
  if (!job) {
    return NextResponse.json({ ok: false, code: "JOB_NOT_FOUND" }, { status: 404 });
  }

  const { data: publications, error: publicationError } = await supabase
    .from("social_publications")
    .select("id,platform,status")
    .eq("job_id", id);
  if (publicationError) {
    return NextResponse.json({ ok: false, code: "PUBLICATION_READ_FAILED" }, { status: 503 });
  }

  const retryable = (publications ?? []).filter((row) => canRetryPublicationStatus(String(row.status)));
  if (retryable.length === 0) {
    return NextResponse.json({ ok: false, code: "NOTHING_TO_RETRY" }, { status: 409 });
  }

  for (const row of retryable) {
    const patch: Record<string, unknown> = {
      status: "PENDING",
      last_error_code: null,
      last_error_message: null,
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    };
    if (row.platform === "INSTAGRAM" && row.status === "NEEDS_ATTENTION") {
      patch.external_publication_id = null;
      patch.provider_state = {};
    }
    const { error } = await supabase
      .from("social_publications")
      .update(patch)
      .eq("id", row.id);
    if (error) {
      return NextResponse.json({ ok: false, code: "RETRY_RESET_FAILED" }, { status: 503 });
    }
  }

  const { error: resetError } = await supabase
    .from("social_automation_jobs")
    .update({
      status: "PUBLISHING",
      completed_at: null,
      last_error_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (resetError) {
    return NextResponse.json({ ok: false, code: "JOB_RESET_FAILED" }, { status: 503 });
  }

  try {
    await createSocialAutomationStore().audit({
      jobId: id,
      eventType: "MANUAL_RETRY_REQUESTED",
      actor: "ADMIN",
      metadata: { platforms: retryable.map((row) => row.platform) },
    });
    const result = await runSocialPublicationJob(id);
    return NextResponse.json({ ok: true, result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[social-automation] manual retry runner failed", {
      jobId: id,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, code: "RETRY_RUNNER_FAILED", retryable: true },
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }
}
