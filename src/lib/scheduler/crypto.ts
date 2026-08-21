import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

export type TikTokTokenPayload = {
  accessToken: string;
  refreshToken: string;
  openId?: string;
  scope?: string;
  connectedAt?: string;
  tokenType?: string;
  expiresAt?: string;
  refreshExpiresAt?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

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
  const { version: _version, ...tokens } = payload;
  return tokens;
}
