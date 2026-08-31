/**
 * Read-only access to the phone numbers on the connected WhatsApp Business Account.
 *
 * These facts (quality rating, messaging limit, verification state, webhook URL) live
 * at Meta, not in our database, so this calls the Graph API server-side with the
 * existing token. Never import this into a client component — the browser must not
 * hold Meta credentials.
 */
export type WhatsAppQualityRating = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

export type WhatsAppPhoneNumber = {
  id: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating: WhatsAppQualityRating;
  codeVerificationStatus?: string;
  nameStatus?: string;
  platformType?: string;
  throughputLevel?: string;
  messagingLimitTier?: string;
  isOfficialBusinessAccount?: boolean;
  accountMode?: string;
  webhookUrl?: string;
};

export type WhatsAppPhoneNumbersResult =
  | { ok: true; phoneNumbers: WhatsAppPhoneNumber[] }
  | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR" };

const PHONE_NUMBER_FIELDS = [
  "id",
  "display_phone_number",
  "verified_name",
  "quality_rating",
  "code_verification_status",
  "name_status",
  "platform_type",
  "throughput",
  // Meta moved messaging limits to the business-portfolio level in 2025. This field
  // is current and may be requested through the phone-number resource. Keep the old
  // field as a fallback while accounts and API versions finish migrating.
  "whatsapp_business_manager_messaging_limit",
  "messaging_limit_tier",
  "is_official_business_account",
  "account_mode",
  "webhook_configuration",
].join(",");

const QUALITY_RATINGS: WhatsAppQualityRating[] = ["GREEN", "YELLOW", "RED"];

const MESSAGING_TIERS: Record<string, string> = {
  TIER_50: "50 business-initiated conversations / 24h",
  TIER_250: "250 business-initiated conversations / 24h",
  TIER_1K: "1,000 business-initiated conversations / 24h",
  TIER_2K: "2,000 business-initiated conversations / 24h",
  TIER_10K: "10,000 business-initiated conversations / 24h",
  TIER_100K: "100,000 business-initiated conversations / 24h",
  TIER_UNLIMITED: "Unlimited business-initiated conversations",
  UNTIERED: "Not tiered",
};

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function normalizeWhatsAppPhoneNumber(raw: Record<string, unknown>): WhatsAppPhoneNumber {
  const rawQuality = typeof raw.quality_rating === "string" ? raw.quality_rating.toUpperCase() : "";
  const throughput = raw.throughput as Record<string, unknown> | undefined;
  const webhook = raw.webhook_configuration as Record<string, unknown> | undefined;

  return {
    id: String(raw.id || ""),
    displayPhoneNumber: readText(raw.display_phone_number),
    verifiedName: readText(raw.verified_name),
    qualityRating: (QUALITY_RATINGS as string[]).includes(rawQuality)
      ? (rawQuality as WhatsAppQualityRating)
      : "UNKNOWN",
    codeVerificationStatus: readText(raw.code_verification_status),
    nameStatus: readText(raw.name_status),
    platformType: readText(raw.platform_type),
    throughputLevel: readText(throughput?.level),
    messagingLimitTier:
      readText(raw.whatsapp_business_manager_messaging_limit) || readText(raw.messaging_limit_tier),
    isOfficialBusinessAccount:
      typeof raw.is_official_business_account === "boolean" ? raw.is_official_business_account : undefined,
    accountMode: readText(raw.account_mode),
    webhookUrl: readText(webhook?.application),
  };
}

export function describeWhatsAppQuality(rating: WhatsAppQualityRating) {
  if (rating === "GREEN") return "High";
  if (rating === "YELLOW") return "Medium";
  if (rating === "RED") return "Low";
  return "Not rated yet";
}

export function describeWhatsAppMessagingTier(tier: string | undefined) {
  if (!tier) return undefined;
  return MESSAGING_TIERS[tier.toUpperCase()] || tier;
}

export function humanizeWhatsAppEnum(value: string | undefined) {
  if (!value) return undefined;
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

type FetchOptions = {
  env?: Record<string, string | undefined>;
  fetch?: typeof globalThis.fetch;
  revalidateSeconds?: number;
};

export async function fetchWhatsAppPhoneNumbers(
  options: FetchOptions = {},
): Promise<WhatsAppPhoneNumbersResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  if (!token || !businessAccountId) return { ok: false, reason: "NOT_CONFIGURED" };

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${businessAccountId}/phone_numbers?fields=${PHONE_NUMBER_FIELDS}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        ...(options.revalidateSeconds
          ? { next: { revalidate: options.revalidateSeconds } }
          : { cache: "no-store" }),
      } as RequestInit,
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("WhatsApp phone number fetch failed", response.status, detail.slice(0, 400));
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "PERMISSION_DENIED" };
      }
      return { ok: false, reason: "API_ERROR" };
    }

    const payload = (await response.json().catch(() => null)) as { data?: unknown } | null;
    const rows = Array.isArray(payload?.data) ? (payload.data as Array<Record<string, unknown>>) : [];
    return { ok: true, phoneNumbers: rows.map(normalizeWhatsAppPhoneNumber) };
  } catch (error) {
    console.error("Unable to reach Meta for WhatsApp phone numbers", error);
    return { ok: false, reason: "API_ERROR" };
  }
}

export function findConfiguredWhatsAppSender(
  phoneNumbers: WhatsAppPhoneNumber[],
  env: Record<string, string | undefined> = process.env,
) {
  const configuredId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!configuredId) return null;
  return phoneNumbers.find((number) => number.id === configuredId) || null;
}
