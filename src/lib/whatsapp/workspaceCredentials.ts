import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getDefaultWhatsAppWorkspace, getWhatsAppWorkspaceConnection, readRequestedWhatsAppWorkspaceIdFromRequest } from "./workspaces";
import { isWhatsAppWorkspaceId } from "./workspaceModel";

export type WhatsAppMetaConfig = {
  workspaceId: string | null;
  token: string;
  phoneNumberId: string;
  wabaId?: string;
  apiVersion: string;
};

function credentialSecret(env: Record<string, string | undefined>) {
  return env.WHATSAPP_WORKSPACE_CREDENTIAL_SECRET?.trim()
    || env.INTERNAL_TOOL_SESSION_SECRET?.trim()
    || env.GOOGLE_AUTH_SESSION_SECRET?.trim()
    || "";
}

function encryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptWhatsAppWorkspaceAccessToken(token: string, env: Record<string, string | undefined> = process.env) {
  const secret = credentialSecret(env);
  const value = token.trim();
  if (!secret || !value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptWhatsAppWorkspaceAccessToken(value: string, env: Record<string, string | undefined> = process.env) {
  const secret = credentialSecret(env);
  if (!secret || !value.startsWith("v1.")) return null;
  try {
    const [, ivText, tagText, cipherText] = value.split(".");
    if (!ivText || !tagText || !cipherText) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(cipherText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function configFromExplicitEnv(env: Record<string, string | undefined>): WhatsAppMetaConfig | null {
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return null;
  return {
    workspaceId: null,
    token,
    phoneNumberId,
    wabaId: env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim(),
    apiVersion: env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0",
  };
}

export async function resolveWhatsAppMetaConfig(options: {
  workspaceId?: string | null;
  env?: Record<string, string | undefined>;
} = {}): Promise<WhatsAppMetaConfig | null> {
  // Unit tests and explicit integrations can still inject an isolated env object and
  // never touch Supabase. Production callers omit env and resolve the active tenant.
  if (options.env) return configFromExplicitEnv(options.env);

  const env = process.env;
  let workspaceId = isWhatsAppWorkspaceId(options.workspaceId) ? options.workspaceId : null;
  if (!workspaceId) workspaceId = await readRequestedWhatsAppWorkspaceIdFromRequest();
  if (!workspaceId) workspaceId = (await getDefaultWhatsAppWorkspace())?.id || null;
  if (!workspaceId) return configFromExplicitEnv(env);

  const connection = await getWhatsAppWorkspaceConnection(workspaceId);
  if (!connection || connection.status === "DISABLED") return null;

  if (connection.credentialSource === "ENV") {
    const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
    const phoneNumberId = connection.phoneNumberId?.trim() || env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!token || !phoneNumberId) return null;
    return {
      workspaceId,
      token,
      phoneNumberId,
      wabaId: connection.wabaId?.trim() || env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim(),
      apiVersion: connection.apiVersion || env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0",
    };
  }

  const token = connection.encryptedAccessToken ? decryptWhatsAppWorkspaceAccessToken(connection.encryptedAccessToken, env) : null;
  const phoneNumberId = connection.phoneNumberId?.trim();
  if (!token || !phoneNumberId) return null;
  return {
    workspaceId,
    token,
    phoneNumberId,
    wabaId: connection.wabaId?.trim() || undefined,
    apiVersion: connection.apiVersion || "v26.0",
  };
}
