import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encryptTikTokTokens } from "@/lib/scheduler/crypto";
import { readSchedulerOAuthState, schedulerRedirectUri, SCHEDULER_OAUTH_STATE_COOKIE } from "@/lib/scheduler/oauth";
import { createSchedulerSession, SCHEDULER_SESSION_COOKIE } from "@/lib/scheduler/session";
import { createSupabaseSchedulerStore } from "@/lib/scheduler/store";
import { exchangeTikTokCode } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const state = readSchedulerOAuthState(cookieStore.get(SCHEDULER_OAUTH_STATE_COOKIE)?.value);
  if (!state || state.state !== url.searchParams.get("state") || !url.searchParams.get("code")) {
    return NextResponse.redirect(new URL("/scheduler/sign-in/?error=oauth", url.origin));
  }
  const result = await exchangeTikTokCode(url.searchParams.get("code")!, schedulerRedirectUri());
  if (!result.ok) return NextResponse.redirect(new URL("/scheduler/sign-in/?error=exchange", url.origin));
  const store = await createSupabaseSchedulerStore();
  const user = await store.upsertUser({ tiktokOpenId: result.record.openId, displayName: null, avatarUrl: null });
  const userId = String(user.id);
  await store.saveConnection({
    userId,
    encryptedTokens: encryptTikTokTokens({ accessToken: result.record.accessToken, refreshToken: result.record.refreshToken }),
    scopes: result.record.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
    accessExpiresAt: result.record.expiresAt,
    refreshExpiresAt: result.record.refreshExpiresAt,
  });
  const response = NextResponse.redirect(new URL(state.returnTo, url.origin));
  response.cookies.delete(SCHEDULER_OAUTH_STATE_COOKIE);
  response.cookies.set(SCHEDULER_SESSION_COOKIE, createSchedulerSession(userId, result.record.openId), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/", maxAge: 12 * 60 * 60,
  });
  return response;
}
