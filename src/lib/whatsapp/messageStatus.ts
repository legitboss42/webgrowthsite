/**
 * Delivery status vocabulary, ordering, and presentation.
 *
 * Meta's status webhooks are the authority on sent, delivered, read and failed, and
 * they can arrive out of order — a retried `sent` callback landing after `delivered`
 * is normal. Every write therefore goes through the ordering guard here so a status
 * can only ever move forward, and a browser refresh reads back the furthest state
 * that was actually reported rather than the last one that happened to arrive.
 *
 * `accepted` is ours, not Meta's: it records that the Cloud API took the message and
 * returned a message id. It is not a delivery claim, and it is deliberately ranked
 * below `sent` so the first real webhook replaces it.
 */

export type WhatsAppStatusKey = "pending" | "sent" | "delivered" | "read" | "failed";

/** Every status value this app is prepared to see stored in `delivery_status`. */
export const WHATSAPP_KNOWN_STATUSES = [
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
] as const;

/**
 * Higher wins. `failed` sits above every delivery state on purpose: once Meta has
 * reported a failure, a late `delivered` or `read` callback must not be allowed to
 * make the message look successful again.
 */
export function getWhatsAppStatusRank(status: string | null | undefined): number {
  const normalized = (status || "").trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized === "sent") return 2;
  if (normalized === "delivered") return 3;
  if (normalized === "read") return 4;
  if (normalized === "failed") return 5;
  // `accepted`, `queued`, `sending`, and anything new Meta invents: recorded when
  // there is nothing better, never allowed to overwrite a known delivery state.
  return 1;
}

/** True when `next` is further along than `current` and is therefore worth writing. */
export function shouldApplyWhatsAppStatus(
  current: string | null | undefined,
  next: string | null | undefined,
): boolean {
  return getWhatsAppStatusRank(next) > getWhatsAppStatusRank(current);
}

/**
 * The stored values a move to `next` is allowed to overwrite.
 *
 * Returned so the update can be expressed as one conditional PATCH instead of a read
 * followed by a write — two concurrent webhooks cannot then interleave and lose an
 * update. A null `delivery_status` is always overwritable and is handled separately
 * by the caller's filter.
 */
export function getWhatsAppStatusesBelow(next: string): string[] {
  const rank = getWhatsAppStatusRank(next);
  return WHATSAPP_KNOWN_STATUSES.filter((status) => getWhatsAppStatusRank(status) < rank);
}

export type WhatsAppStatusPresentation = {
  key: WhatsAppStatusKey;
  /** Short visible label. Used where the state must be unmissable. */
  label: string;
  /** Glyph name in the console icon set. Each state has a distinct silhouette. */
  icon: "statusPending" | "statusSent" | "statusDelivered" | "statusRead" | "statusFailed";
  /** Full sentence for a tooltip and for assistive technology. */
  description: string;
};

const PRESENTATIONS: Record<WhatsAppStatusKey, WhatsAppStatusPresentation> = {
  pending: {
    key: "pending",
    label: "Sending",
    icon: "statusPending",
    description: "Sending — WhatsApp has not confirmed this message yet",
  },
  sent: {
    key: "sent",
    label: "Sent",
    icon: "statusSent",
    description: "Sent — WhatsApp accepted the message and is delivering it",
  },
  delivered: {
    key: "delivered",
    label: "Delivered",
    icon: "statusDelivered",
    description: "Delivered — the message reached the customer's phone",
  },
  read: {
    key: "read",
    label: "Read",
    icon: "statusRead",
    description: "Read — the customer opened the message",
  },
  failed: {
    key: "failed",
    label: "Failed",
    icon: "statusFailed",
    description: "Failed — WhatsApp could not deliver this message",
  },
};

/**
 * Presentation for a stored status. Returns null for inbound messages: a delivery
 * receipt describes something we sent, and showing ticks on a customer's own message
 * would be inventing information.
 */
export function describeWhatsAppMessageStatus(input: {
  status?: string | null;
  direction?: string | null;
}): WhatsAppStatusPresentation | null {
  if (input.direction === "inbound") return null;

  const normalized = (input.status || "").trim().toLowerCase();
  if (normalized === "failed") return PRESENTATIONS.failed;
  if (normalized === "read") return PRESENTATIONS.read;
  if (normalized === "delivered") return PRESENTATIONS.delivered;
  if (normalized === "sent") return PRESENTATIONS.sent;
  // Nothing recorded yet, or one of our own interim values. Either way the honest
  // reading is that WhatsApp has not confirmed anything.
  return PRESENTATIONS.pending;
}

const FAILURE_REASONS: Record<number, string> = {
  131026: "The number cannot receive WhatsApp messages.",
  131047: "The 24-hour service window closed, so a template was required.",
  131049: "WhatsApp withheld the message to protect the user experience.",
  131051: "That message type is not supported for this recipient.",
  131053: "The attached media could not be uploaded.",
  132000: "The template did not match the number of variables supplied.",
  132001: "The template does not exist for this language.",
  133010: "The sending phone number is not registered.",
  470: "The 24-hour service window closed before delivery.",
  368: "The recipient's account is restricted.",
};

function sanitizeMetaDetail(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/access_token\s*=\s*[^\s,;]+/gi, "access_token=[redacted]")
    .replace(/fbtrace_id\s*=\s*[^\s,;]+/gi, "fbtrace_id=[redacted]")
    .replace(/authorization\s*=\s*Bearer\s+[^\s,;]+/gi, "authorization=[redacted]")
    .replace(/\bEAA[A-Za-z0-9_-]{4,}\b/g, "[redacted]")
    .trim()
    .slice(0, 220);
}

/**
 * An operator-safe explanation for a failed status.
 *
 * Meta's `error_data.details` is often the only useful clue for 131053 media failures,
 * so known error codes may keep a short redacted detail. Unknown provider payloads are
 * still reduced to the code alone.
 */
export function sanitizeWhatsAppStatusError(input: {
  code?: number;
  title?: string;
  details?: string;
}): string | undefined {
  if (typeof input.code === "number" && FAILURE_REASONS[input.code]) {
    const detail = sanitizeMetaDetail(input.details);
    return `${FAILURE_REASONS[input.code]}${detail ? ` ${detail}` : ""} (code ${input.code})`;
  }
  if (typeof input.code === "number") {
    return `WhatsApp rejected the message (code ${input.code}).`;
  }

  const title = sanitizeMetaDetail(input.title);
  if (title) return title.slice(0, 120);
  return undefined;
}
