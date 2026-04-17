import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
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
