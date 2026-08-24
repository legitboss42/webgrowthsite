import { NextResponse } from "next/server";
import { runSupabaseRetentionCleanup } from "@/lib/scheduler/retention";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return NextResponse.json(await runSupabaseRetentionCleanup());
}
