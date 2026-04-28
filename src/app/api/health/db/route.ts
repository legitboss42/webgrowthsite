import { NextResponse } from "next/server";
import { buildLowCpuJsonResponse, LOW_CPU_EMERGENCY_MODE } from "@/lib/emergency";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (LOW_CPU_EMERGENCY_MODE) {
    const response = buildLowCpuJsonResponse();
    return NextResponse.json(response.body, response.init);
  }

  const token = process.env.HEALTHCHECK_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Health check is not configured." },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-health-token");
  if (provided !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ status: "ok" });
}
