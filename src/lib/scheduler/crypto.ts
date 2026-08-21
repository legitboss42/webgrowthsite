import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

export type TikTokTokenPayload = { accessToken: string; refreshToken: string };

function secret() {
  const value = process.env.TIKTOK_TOKEN_ENCRYPTION_KEY?.trim() || "";
  if (!value) throw new Error("TikTok token encryption key is missing.");
  return value;
}

export function encryptTikTokTokens(tokens: TikTokTokenPayload) {
  return sealCookiePayload({ version: 1, ...tokens }, secret());
}

export function decryptTikTokTokens(value: string) {
  const payload = openCookiePayload<TikTokTokenPayload & { version: number }>(value, secret());
  if (!payload || payload.version !== 1) return null;
  return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
}
