import { createClient } from "@supabase/supabase-js";

export const WHATSAPP_SAVED_REPLY_MEDIA_BUCKET = "whatsapp-saved-replies";

function getStorageClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeFilename(value: string) {
  const clean = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean.slice(0, 120) || "attachment";
}

export async function uploadWhatsAppSavedReplyMedia(input: {
  replyId: string;
  file: File;
}) {
  const client = getStorageClient();
  if (!client) return { ok: false as const, error: "WhatsApp storage is not configured." };

  const filename = safeFilename(input.file.name || "attachment");
  const path = `${input.replyId}/${crypto.randomUUID()}-${filename}`;
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const { error } = await client.storage
    .from(WHATSAPP_SAVED_REPLY_MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: input.file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Saved reply media upload failed", error.message);
    return { ok: false as const, error: "The saved-reply attachment could not be stored." };
  }
  return { ok: true as const, path };
}

export async function downloadWhatsAppSavedReplyMedia(path: string) {
  const client = getStorageClient();
  if (!client) return { ok: false as const, error: "WhatsApp storage is not configured." };
  const { data, error } = await client.storage.from(WHATSAPP_SAVED_REPLY_MEDIA_BUCKET).download(path);
  if (error || !data) {
    if (error) console.error("Saved reply media download failed", error.message);
    return { ok: false as const, error: "The saved-reply attachment could not be loaded." };
  }
  return { ok: true as const, blob: data };
}

export async function deleteWhatsAppSavedReplyMedia(path: string | undefined | null) {
  if (!path) return { ok: true as const };
  const client = getStorageClient();
  if (!client) return { ok: false as const, error: "WhatsApp storage is not configured." };
  const { error } = await client.storage.from(WHATSAPP_SAVED_REPLY_MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("Saved reply media delete failed", error.message);
    return { ok: false as const, error: "The old saved-reply attachment could not be removed." };
  }
  return { ok: true as const };
}
