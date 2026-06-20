import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;

function base64UrlEncode(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function deriveKey(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function sealCookiePayload(payload: object, secret: string) {
  if (!secret.trim()) {
    throw new Error("Secure cookie secret is missing.");
  }

  const key = deriveKey(secret);
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext].map(base64UrlEncode).join(".");
}

export function openCookiePayload<T>(value: string | undefined, secret: string) {
  if (!value || !secret.trim()) return null;

  const [ivPart, tagPart, ciphertextPart] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) return null;

  try {
    const key = deriveKey(secret);
    const decipher = createDecipheriv(ALGORITHM, key, base64UrlDecode(ivPart));
    decipher.setAuthTag(base64UrlDecode(tagPart));
    const plaintext = Buffer.concat([
      decipher.update(base64UrlDecode(ciphertextPart)),
      decipher.final(),
    ]);

    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    return null;
  }
}
