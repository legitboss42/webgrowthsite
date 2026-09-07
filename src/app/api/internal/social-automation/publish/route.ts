import { NextResponse } from "next/server";

import { readSignedJsonRequest } from "@/lib/socialAutomation/internalRequestServer";
import { runSocialPublicationJob } from "@/lib/socialAutomation/publicationRunnerServer";
import { parsePublishRequest } from "@/lib/socialAutomation/requestModel";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signed = await readSignedJsonRequest(request);
  if (!signed.ok) {
    return NextResponse.json({ ok: false, code: signed.code }, { status: signed.status });
  }

  const input = parsePublishRequest(signed.body);
  if (!input) {
    return NextResponse.json({ ok: false, code: "INVALID_PUBLISH_REQUEST" }, { status: 400 });
  }

  try {
    const result = await runSocialPublicationJob(input.jobId);
    const pending = result.status === "WAITING_FOR_ARTICLE" || result.status === "PUBLISHING";
    const response = NextResponse.json({ ok: true, ...result }, { status: pending ? 202 : 200 });
    if (pending && result.retryAfterSeconds) {
      response.headers.set("Retry-After", String(result.retryAfterSeconds));
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";
    if (code === "JOB_NOT_FOUND") {
      return NextResponse.json({ ok: false, code }, { status: 404 });
    }
    console.error("[social-automation] publication runner failed", {
      jobId: input.jobId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      { ok: false, code: "PUBLICATION_RUNNER_FAILED", retryable: true },
      { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } }
    );
  }
}
