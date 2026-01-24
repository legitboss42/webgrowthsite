import { NextResponse } from "next/server";

export async function GET() {
  const conn =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!conn) {
    return NextResponse.json(
      {
        ok: false,
        error: "No database env var found. Set POSTGRES_URL or DATABASE_URL.",
      },
      { status: 500 }
    );
  }

  // We won't connect yet—just confirm env is readable on the server
  return NextResponse.json({
    ok: true,
    hasDbEnv: true,
    envUsed: process.env.POSTGRES_URL
      ? "POSTGRES_URL"
      : process.env.DATABASE_URL
      ? "DATABASE_URL"
      : "POSTGRES_PRISMA_URL",
  });
}