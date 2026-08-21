import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSchedulerConfig } from "@/lib/scheduler/config";
import { decryptTikTokTokens } from "@/lib/scheduler/crypto";
import { readSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createTikTokSchedulerClient } from "@/lib/scheduler/tiktokClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = readSchedulerSession(cookieStore.get(SCHEDULER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const supabase = createSchedulerSupabaseClient();
  const { data: connection } = await supabase.from("tiktok_connections").select("encrypted_tokens,scopes")
    .eq("user_id", session.userId).single();
  const tokens = connection ? decryptTikTokTokens(connection.encrypted_tokens) : null;
  if (!tokens || !connection?.scopes.includes("video.publish")) {
    return NextResponse.json({ error: "Connect TikTok Direct Post first." }, { status: 409 });
  }
  try {
    const creator = await createTikTokSchedulerClient().queryCreatorInfo(tokens.accessToken);
    const config = getSchedulerConfig();
    return NextResponse.json({
      ...creator,
      privacyLevelOptions: config.publicPostingEnabled
        ? creator.privacyLevelOptions
        : creator.privacyLevelOptions.filter((option) => option === "SELF_ONLY"),
      publicPostingEnabled: config.publicPostingEnabled,
    });
  } catch {
    return NextResponse.json({ error: "TikTok creator information is unavailable. Reconnect and try again." }, { status: 502 });
  }
}
