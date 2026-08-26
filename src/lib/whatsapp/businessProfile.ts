/**
 * Read-only access to the WhatsApp Business profile customers actually see.
 *
 * This is a different thing from the Web Growth logo the console renders. The logo is
 * ours and lives in `public/images/brand/`; the profile picture below is registered
 * at Meta against a specific phone number, is served from WhatsApp's own CDN, and is
 * what appears in a customer's chat list. A console that showed the local logo and
 * called that "verified" would be proving nothing, so this reads the real record.
 *
 * Verified against the live account: `GET /{phone-number-id}/whatsapp_business_profile`
 * answers with `{ data: [ { ...fields, messaging_product: "whatsapp" } ] }`, and a
 * field that has never been set is omitted from the response rather than returned
 * empty — which is how "not configured" is distinguished from "blank".
 *
 * Never import this into a client component — the browser must not hold the token.
 */

export type WhatsAppBusinessProfile = {
  /** Signed WhatsApp CDN URL. Short-lived, so it is proxied rather than embedded. */
  profilePictureUrl?: string;
  about?: string;
  description?: string;
  email?: string;
  address?: string;
  vertical?: string;
  websites: string[];
};

export type WhatsAppBusinessProfileResult =
  | { ok: true; profile: WhatsAppBusinessProfile }
  | { ok: false; reason: "NOT_CONFIGURED" | "PERMISSION_DENIED" | "API_ERROR" };

const PROFILE_FIELDS = [
  "about",
  "address",
  "description",
  "email",
  "profile_picture_url",
  "websites",
  "vertical",
].join(",");

/** Every field the profile can carry, in the order the console reports them. */
export const WHATSAPP_PROFILE_FIELD_LABELS: Array<{
  key: keyof Omit<WhatsAppBusinessProfile, "websites"> | "websites";
  label: string;
  note: string;
}> = [
  { key: "profilePictureUrl", label: "Profile picture", note: "Shown beside the business name in the customer's chat list." },
  { key: "description", label: "Description", note: "The longer blurb on the business profile screen." },
  { key: "about", label: "About", note: "The short line under the business name inside the chat." },
  { key: "email", label: "Email", note: "Tappable on the business profile screen." },
  { key: "websites", label: "Websites", note: "Up to two links on the business profile screen." },
  { key: "address", label: "Address", note: "Optional. Only worth setting for a visitable location." },
  { key: "vertical", label: "Category", note: "The industry label WhatsApp shows." },
];

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeWhatsAppBusinessProfile(
  raw: Record<string, unknown>,
): WhatsAppBusinessProfile {
  const websites = Array.isArray(raw.websites)
    ? raw.websites.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  return {
    profilePictureUrl: readText(raw.profile_picture_url),
    about: readText(raw.about),
    description: readText(raw.description),
    email: readText(raw.email),
    address: readText(raw.address),
    vertical: readText(raw.vertical),
    websites,
  };
}

/**
 * Which profile fields are set and which are not.
 *
 * `customerVisiblePicture` reports only that Meta holds a picture for this number. It
 * is deliberately not called "verified": whether a given customer's app has fetched
 * the current one is a caching question on their device, and nothing in this API can
 * answer it.
 */
export function summarizeWhatsAppBusinessProfile(profile: WhatsAppBusinessProfile) {
  const set: string[] = [];
  const missing: string[] = [];

  for (const field of WHATSAPP_PROFILE_FIELD_LABELS) {
    const populated =
      field.key === "websites" ? profile.websites.length > 0 : Boolean(profile[field.key]);
    (populated ? set : missing).push(field.label);
  }

  return {
    set,
    missing,
    customerVisiblePicture: Boolean(profile.profilePictureUrl),
    complete: missing.length === 0,
  };
}

type FetchOptions = {
  env?: Record<string, string | undefined>;
  fetch?: typeof globalThis.fetch;
  /** Seconds to cache the response. Omit for a fresh read every time. */
  revalidateSeconds?: number;
};

export async function fetchWhatsAppBusinessProfile(
  options: FetchOptions = {},
): Promise<WhatsAppBusinessProfileResult> {
  const env = options.env || process.env;
  const token = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) return { ok: false, reason: "NOT_CONFIGURED" };

  const apiVersion =
    env.WHATSAPP_API_VERSION?.trim() || env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";

  try {
    const response = await (options.fetch || globalThis.fetch)(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_profile?fields=${PROFILE_FIELDS}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        ...(options.revalidateSeconds
          ? { next: { revalidate: options.revalidateSeconds } }
          : { cache: "no-store" }),
      } as RequestInit,
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("WhatsApp business profile fetch failed", response.status, detail.slice(0, 400));
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "PERMISSION_DENIED" };
      }
      return { ok: false, reason: "API_ERROR" };
    }

    const payload = (await response.json().catch(() => null)) as { data?: unknown } | null;
    const rows = Array.isArray(payload?.data) ? (payload.data as Array<Record<string, unknown>>) : [];
    return { ok: true, profile: normalizeWhatsAppBusinessProfile(rows[0] || {}) };
  } catch (error) {
    console.error("Unable to reach Meta for the WhatsApp business profile", error);
    return { ok: false, reason: "API_ERROR" };
  }
}

/** WhatsApp's own CDN. Checked before the proxy will follow a URL from the profile. */
export function isWhatsAppProfilePictureUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return url.hostname === "pps.whatsapp.net" || url.hostname.endsWith(".whatsapp.net");
  } catch {
    return false;
  }
}
