import "server-only";
import type { LoadResult, WhatsAppPhoneNumber } from "@/types/whatsapp";

/**
 * Reads the connected number's own metadata from the Meta Graph API.
 *
 * Every value here comes from Meta. Nothing is defaulted or guessed: if Meta
 * does not return a field, the field stays null and the interface prints a
 * placeholder instead of an invented quality rating or messaging tier.
 *
 * The access token is read from `process.env` inside this server-only module and
 * never returned to a caller, so it cannot reach a client component through a
 * prop.
 */

const GRAPH_HOST = "https://graph.facebook.com";

const PHONE_NUMBER_FIELDS = [
  "display_phone_number",
  "verified_name",
  "quality_rating",
  "messaging_limit_tier",
  "code_verification_status",
  "platform_type",
].join(",");

export function isWhatsAppApiConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

/** True when the webhook can verify a signature, which is what makes it safe. */
export function isWhatsAppWebhookConfigured() {
  return Boolean(process.env.META_APP_SECRET?.trim() && process.env.WHATSAPP_VERIFY_TOKEN?.trim());
}

function graphApiVersion() {
  return process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v25.0";
}

function readString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Meta's phone-number metadata changes rarely, so this is revalidated on a
 * five-minute window rather than fetched on every dashboard render. That keeps
 * the overview off the Graph API's rate limit without ever showing a stale
 * connection state for long.
 */
export async function loadConnectedPhoneNumber(): Promise<LoadResult<WhatsAppPhoneNumber>> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return { configured: false };

  try {
    const response = await fetch(
      `${GRAPH_HOST}/${graphApiVersion()}/${encodeURIComponent(phoneNumberId)}?fields=${PHONE_NUMBER_FIELDS}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      // Status only. A Graph error body can echo request parameters.
      console.error("[whatsapp-admin] phone number lookup failed", { status: response.status });
      if (response.status === 401 || response.status === 403) {
        return {
          configured: true,
          ok: false,
          error: "Meta rejected the access token. Refresh the WhatsApp credentials in the environment.",
        };
      }
      return {
        configured: true,
        ok: false,
        error: "Meta did not return the number's status. The connection may still be healthy.",
      };
    }

    const body = (await response.json()) as Record<string, unknown>;
    return {
      configured: true,
      ok: true,
      data: {
        id: phoneNumberId,
        displayPhoneNumber: readString(body, "display_phone_number"),
        verifiedName: readString(body, "verified_name"),
        qualityRating: readString(body, "quality_rating"),
        messagingLimitTier: readString(body, "messaging_limit_tier"),
        codeVerificationStatus: readString(body, "code_verification_status"),
        platformType: readString(body, "platform_type"),
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || null,
      },
    };
  } catch (error) {
    console.error("[whatsapp-admin] phone number lookup threw", {
      detail: error instanceof Error ? error.message : "unknown",
    });
    return {
      configured: true,
      ok: false,
      error: "Could not reach Meta. Check network access from the server.",
    };
  }
}
