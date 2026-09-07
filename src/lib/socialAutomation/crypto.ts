import { openCookiePayload, sealCookiePayload } from "@/lib/secureCookie";

export type MetaTokenPayload = {
  userAccessToken: string;
  pageAccessToken?: string;
  connectedAt: string;
  expiresAt?: string;
};

function encryptionKey() {
  const key = process.env.META_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) throw new Error("Meta token encryption key is missing.");
  return key;
}

export function encryptMetaTokens(payload: MetaTokenPayload) {
  return sealCookiePayload(payload, encryptionKey());
}

export function decryptMetaTokens(ciphertext: string | undefined) {
  const key = process.env.META_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) return null;
  return openCookiePayload<MetaTokenPayload>(ciphertext, key);
}
