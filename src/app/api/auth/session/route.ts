import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = readWebGrowthSessionFromCookieStore(cookieStore);
  const displayName = session ? session.fullName || session.email || "Web Growth account" : null;

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      displayName,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
