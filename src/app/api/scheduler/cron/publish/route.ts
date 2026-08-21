import { NextResponse } from "next/server";
import { runPublishingWorker } from "@/lib/scheduler/runWorker";
import { reconcilePublishingAttempts } from "@/lib/scheduler/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [publishing, reconciliation] = await Promise.all([
    runPublishingWorker(),
    reconcilePublishingAttempts(),
  ]);
  return NextResponse.json({ publishing, reconciliation });
}
