/** Read-only access to phone numbers on the active workspace's WhatsApp Business Account. */
import { resolveWhatsAppMetaConfig } from "./workspaceCredentials";

export type WhatsAppQualityRating = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
export type WhatsAppPhoneNumber = {
  id: string; displayPhoneNumber?: string; verifiedName?: string; qualityRating: WhatsAppQualityRating;
  codeVerificationStatus?: string; nameStatus?: string; platformType?: string; throughputLevel?: string;
  messagingLimitTier?: string; isOfficialBusinessAccount?: boolean; accountMode?: string; webhookUrl?: string;
};
export type WhatsAppPhoneNumbersResult = { ok: true; phoneNumbers: WhatsAppPhoneNumber[] } | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR" };

const PHONE_NUMBER_FIELDS = ["id","display_phone_number","verified_name","quality_rating","code_verification_status","name_status","platform_type","throughput","whatsapp_business_manager_messaging_limit","messaging_limit_tier","is_official_business_account","account_mode","webhook_configuration"].join(",");
const QUALITY_RATINGS: WhatsAppQualityRating[] = ["GREEN", "YELLOW", "RED"];
const MESSAGING_TIERS: Record<string, string> = {
  TIER_50: "50 business-initiated conversations / 24h", TIER_250: "250 business-initiated conversations / 24h", TIER_1K: "1,000 business-initiated conversations / 24h", TIER_2K: "2,000 business-initiated conversations / 24h", TIER_10K: "10,000 business-initiated conversations / 24h", TIER_100K: "100,000 business-initiated conversations / 24h", TIER_UNLIMITED: "Unlimited business-initiated conversations", UNTIERED: "Not tiered",
};
function readText(value: unknown) { return typeof value === "string" && value.trim() ? value : undefined; }
export function normalizeWhatsAppPhoneNumber(raw: Record<string, unknown>): WhatsAppPhoneNumber {
  const rawQuality = typeof raw.quality_rating === "string" ? raw.quality_rating.toUpperCase() : "";
  const throughput = raw.throughput as Record<string, unknown> | undefined;
  const webhook = raw.webhook_configuration as Record<string, unknown> | undefined;
  return {
    id: String(raw.id || ""), displayPhoneNumber: readText(raw.display_phone_number), verifiedName: readText(raw.verified_name),
    qualityRating: (QUALITY_RATINGS as string[]).includes(rawQuality) ? rawQuality as WhatsAppQualityRating : "UNKNOWN",
    codeVerificationStatus: readText(raw.code_verification_status), nameStatus: readText(raw.name_status), platformType: readText(raw.platform_type), throughputLevel: readText(throughput?.level),
    messagingLimitTier: readText(raw.whatsapp_business_manager_messaging_limit) || readText(raw.messaging_limit_tier),
    isOfficialBusinessAccount: typeof raw.is_official_business_account === "boolean" ? raw.is_official_business_account : undefined,
    accountMode: readText(raw.account_mode), webhookUrl: readText(webhook?.application),
  };
}
export function describeWhatsAppQuality(rating: WhatsAppQualityRating) { if (rating === "GREEN") return "High"; if (rating === "YELLOW") return "Medium"; if (rating === "RED") return "Low"; return "Not rated yet"; }
export function describeWhatsAppMessagingTier(tier: string | undefined) { if (!tier) return undefined; return MESSAGING_TIERS[tier.toUpperCase()] || tier; }
export function humanizeWhatsAppEnum(value: string | undefined) { if (!value) return undefined; return value.toLowerCase().split("_").filter(Boolean).map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(" "); }

type FetchOptions = { env?: Record<string, string | undefined>; workspaceId?: string | null; fetch?: typeof globalThis.fetch; revalidateSeconds?: number };
export async function fetchWhatsAppPhoneNumbers(options: FetchOptions = {}): Promise<WhatsAppPhoneNumbersResult> {
  const meta = await resolveWhatsAppMetaConfig({ workspaceId: options.workspaceId, env: options.env });
  if (!meta?.token || !meta.wabaId) return { ok: false, reason: "NOT_CONFIGURED" };
  try {
    const response = await (options.fetch || globalThis.fetch)(`https://graph.facebook.com/${meta.apiVersion}/${meta.wabaId}/phone_numbers?fields=${PHONE_NUMBER_FIELDS}`, {
      headers: { Authorization: `Bearer ${meta.token}` },
      ...(options.revalidateSeconds ? { next: { revalidate: options.revalidateSeconds } } : { cache: "no-store" }),
    } as RequestInit);
    if (!response.ok) {
      const detail = await response.text().catch(() => ""); console.error("WhatsApp phone number fetch failed", response.status, detail.slice(0, 400));
      if (response.status === 401 || response.status === 403) return { ok: false, reason: "PERMISSION_DENIED" };
      return { ok: false, reason: "API_ERROR" };
    }
    const payload = await response.json().catch(() => null) as { data?: unknown } | null;
    const rows = Array.isArray(payload?.data) ? payload!.data as Array<Record<string, unknown>> : [];
    return { ok: true, phoneNumbers: rows.map(normalizeWhatsAppPhoneNumber) };
  } catch (error) { console.error("Unable to reach Meta for WhatsApp phone numbers", error); return { ok: false, reason: "API_ERROR" }; }
}

export function findConfiguredWhatsAppSender(phoneNumbers: WhatsAppPhoneNumber[], source: Record<string, string | undefined> | string = process.env) {
  const configuredId = typeof source === "string" ? source.trim() : source.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!configuredId) return null;
  return phoneNumbers.find((number) => number.id === configuredId) || null;
}
