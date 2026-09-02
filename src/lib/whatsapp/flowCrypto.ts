import { createCipheriv, createDecipheriv, createPrivateKey, createPublicKey, privateDecrypt } from "node:crypto";

export type WhatsAppFlowEncryptedRequest = {
  encrypted_aes_key: string;
  encrypted_flow_data: string;
  initial_vector: string;
};

function privateKeyPem(env: Record<string, string | undefined> = process.env) {
  return env.WHATSAPP_FLOW_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || "";
}
function passphrase(env: Record<string, string | undefined> = process.env) {
  return env.WHATSAPP_FLOW_PRIVATE_KEY_PASSPHRASE?.trim() || undefined;
}
export function isWhatsAppFlowEncryptionConfigured(env: Record<string, string | undefined> = process.env) {
  return Boolean(privateKeyPem(env));
}
export function getWhatsAppFlowPublicKey(env: Record<string, string | undefined> = process.env) {
  const pem = privateKeyPem(env); if (!pem) return null;
  const privateKey = createPrivateKey({ key: pem, format: "pem", passphrase: passphrase(env) });
  return createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
}

export function decryptWhatsAppFlowRequest(input: WhatsAppFlowEncryptedRequest, env: Record<string, string | undefined> = process.env) {
  const pem = privateKeyPem(env); if (!pem) throw new Error("WhatsApp Flow private key is not configured.");
  const key = createPrivateKey({ key: pem, format: "pem", passphrase: passphrase(env) });
  const aesKey = privateDecrypt({ key, oaepHash: "sha256" }, Buffer.from(input.encrypted_aes_key, "base64"));
  const iv = Buffer.from(input.initial_vector, "base64");
  const encrypted = Buffer.from(input.encrypted_flow_data, "base64");
  if (encrypted.length <= 16) throw new Error("Encrypted Flow payload is invalid.");
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const authTag = encrypted.subarray(encrypted.length - 16);
  const decipher = createDecipheriv("aes-128-gcm", aesKey, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  const data = JSON.parse(plaintext) as Record<string, unknown>;
  return { data, aesKey, iv };
}

export function encryptWhatsAppFlowResponse(data: Record<string, unknown>, aesKey: Buffer, requestIv: Buffer) {
  const iv = Buffer.from(requestIv.map((byte) => byte ^ 0xff));
  const cipher = createCipheriv("aes-128-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final(), cipher.getAuthTag()]);
  return encrypted.toString("base64");
}
