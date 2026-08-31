import { createECDH } from "node:crypto";
import * as webPush from "web-push";

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type VapidKeys = { publicKey: string; privateKey: string };

function config() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function generateVapidKeys(): VapidKeys {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey().toString("base64url"),
    privateKey: ecdh.getPrivateKey().toString("base64url"),
  };
}

async function readVapidKeys(resolved: NonNullable<ReturnType<typeof config>>): Promise<VapidKeys | null> {
  const response = await fetch(
    `${resolved.url}/rest/v1/whatsapp_push_config?select=public_key,private_key&id=eq.default&limit=1`,
    { headers: headers(resolved.key), cache: "no-store" },
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ public_key?: string; private_key?: string }>;
  const row = rows[0];
  if (!row?.public_key || !row.private_key) return null;
  return { publicKey: row.public_key, privateKey: row.private_key };
}

export async function ensureWhatsAppVapidKeys(): Promise<VapidKeys | null> {
  const resolved = config();
  if (!resolved) return null;
  const existing = await readVapidKeys(resolved);
  if (existing) return existing;

  const generated = generateVapidKeys();
  const response = await fetch(`${resolved.url}/rest/v1/whatsapp_push_config?on_conflict=id`, {
    method: "POST",
    headers: {
      ...headers(resolved.key),
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: "default",
      public_key: generated.publicKey,
      private_key: generated.privateKey,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await readVapidKeys(resolved)) || generated;
}

export async function saveWhatsAppPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  const resolved = config();
  if (!resolved) return { ok: false as const, error: "WhatsApp storage is not configured." };
  const response = await fetch(`${resolved.url}/rest/v1/whatsapp_push_subscriptions?on_conflict=endpoint`, {
    method: "POST",
    headers: {
      ...headers(resolved.key),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent?.slice(0, 500) || null,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  return response.ok
    ? { ok: true as const }
    : { ok: false as const, error: "Push subscription could not be saved." };
}

export async function deleteWhatsAppPushSubscription(endpoint: string) {
  const resolved = config();
  if (!resolved) return;
  await fetch(
    `${resolved.url}/rest/v1/whatsapp_push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    { method: "DELETE", headers: headers(resolved.key), cache: "no-store" },
  ).catch(() => undefined);
}

async function listSubscriptions(): Promise<StoredSubscription[]> {
  const resolved = config();
  if (!resolved) return [];
  const response = await fetch(
    `${resolved.url}/rest/v1/whatsapp_push_subscriptions?select=endpoint,p256dh,auth`,
    { headers: headers(resolved.key), cache: "no-store" },
  );
  if (!response.ok) return [];
  return (await response.json()) as StoredSubscription[];
}

export async function claimWhatsAppPushDelivery(messageId: string): Promise<boolean> {
  const resolved = config();
  if (!resolved || !messageId) return false;
  const response = await fetch(`${resolved.url}/rest/v1/whatsapp_push_deliveries?on_conflict=message_id`, {
    method: "POST",
    headers: {
      ...headers(resolved.key),
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify({ message_id: messageId }),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ message_id?: string }>;
  return rows.some((row) => row.message_id === messageId);
}

export async function sendWhatsAppPushNotification(input: {
  id: string;
  title: string;
  body: string;
  url?: string;
}) {
  const keys = await ensureWhatsAppVapidKeys();
  if (!keys) return { sent: 0, failed: 0 };

  const subscriptions = await listSubscriptions();
  if (!subscriptions.length) return { sent: 0, failed: 0 };

  webPush.setVapidDetails("mailto:admin@webgrowth.info", keys.publicKey, keys.privateKey);
  const payload = JSON.stringify({
    id: input.id,
    title: input.title,
    body: input.body,
    url: input.url || "/admin/whatsapp/conversations/",
    icon: "/images/logo.webp",
    badge: "/favicon.ico",
  });

  let sent = 0;
  let failed = 0;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
          { TTL: 300, urgency: "high" },
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await deleteWhatsAppPushSubscription(subscription.endpoint);
        } else {
          console.error("WhatsApp push delivery failed", { statusCode });
        }
      }
    }),
  );
  return { sent, failed };
}
