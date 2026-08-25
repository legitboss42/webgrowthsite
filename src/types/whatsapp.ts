/**
 * Shared WhatsApp platform types.
 *
 * These describe the shapes the admin UI works with, normalised away from the
 * raw Supabase column names so a later schema change or a move to a
 * platform-wide contact model does not ripple through every component.
 */

export type WhatsAppConversationStatus = "open" | "pending" | "resolved" | "closed";

export type WhatsAppMessageDirection = "inbound" | "outbound";

/** Internal notes are stored alongside messages but never sent to WhatsApp. */
export type WhatsAppMessageChannel = "whatsapp" | "note";

export type WhatsAppDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppMessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "location"
  | "contacts"
  | "template"
  | "interactive"
  | "unsupported";

export type LeadTemperature = "COLD" | "WARM" | "HOT";

export type WhatsAppContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "customer"
  | "lost"
  | "blocked";

export type WhatsAppContact = {
  id: string;
  waId: string;
  phone: string | null;
  displayName: string | null;
  businessName: string | null;
  email: string | null;
  website: string | null;
  source: string | null;
  status: WhatsAppContactStatus;
  temperature: LeadTemperature;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WhatsAppConversationSummary = {
  id: string;
  contactId: string;
  status: WhatsAppConversationStatus;
  intent: string | null;
  needsReview: boolean;
  assignedTo: string | null;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  /** Last inbound message timestamp in seconds, used for the 24h window. */
  lastInboundAt: number | null;
  unreadCount: number;
  contact: WhatsAppContact;
  preview: {
    text: string | null;
    direction: WhatsAppMessageDirection | null;
    type: WhatsAppMessageType;
    at: string | null;
  } | null;
};

export type WhatsAppMessage = {
  id: string;
  conversationId: string;
  whatsappMessageId: string | null;
  direction: WhatsAppMessageDirection;
  channel: WhatsAppMessageChannel;
  type: WhatsAppMessageType;
  text: string | null;
  at: string | null;
  status: WhatsAppDeliveryStatus | null;
  media: {
    id: string | null;
    mimeType: string | null;
    filename: string | null;
    voice: boolean;
  } | null;
};

/**
 * Everything the UI knows about the 24-hour customer service window for a
 * conversation. Derived from the same helper the send path uses, so the
 * interface can never claim free-text is allowed when the server would refuse.
 */
export type ServiceWindow = {
  /** False when no inbound message has ever been recorded. */
  known: boolean;
  open: boolean;
  /** Whole seconds left, clamped at zero. Null when unknown. */
  secondsRemaining: number | null;
  expiresAt: string | null;
};

export type WhatsAppPhoneNumber = {
  /** Meta phone number id. Held server-side; only shown to admins. */
  id: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  /** Meta calls this the messaging limit tier, e.g. TIER_1K. */
  messagingLimitTier: string | null;
  codeVerificationStatus: string | null;
  platformType: string | null;
  businessAccountId: string | null;
};

export type MetricDelta = {
  /** Null when there is no comparable previous period. */
  percent: number | null;
  direction: "up" | "down" | "flat";
};

export type OverviewMetrics = {
  rangeDays: number;
  conversations: { total: number; delta: MetricDelta };
  messagesSent: { total: number; delta: MetricDelta };
  messagesReceived: { total: number; delta: MetricDelta };
  contacts: { total: number; delta: MetricDelta };
  needsReview: number;
  unread: number;
};

export type ActivityPoint = {
  /** ISO date, day precision. */
  date: string;
  sent: number;
  received: number;
  delivered: number;
  read: number;
  failed: number;
};

/**
 * Result wrapper used by every admin data loader. `configured: false` means the
 * environment has no Supabase credentials, which is a truthful state to render
 * rather than an error.
 */
export type LoadResult<T> =
  | { configured: true; ok: true; data: T }
  | { configured: true; ok: false; error: string }
  | { configured: false };
