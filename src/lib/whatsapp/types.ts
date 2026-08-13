export const WHATSAPP_INTENTS = [
  "NEW_LEAD",
  "PORTFOLIO_REQUEST",
  "WEBSITE_AUDIT_REQUEST",
  "SERVICE_QUESTION",
  "PRICING_REQUEST",
  "MEETING_REQUEST",
  "PROJECT_SCOPE",
  "DEADLINE_REQUEST",
  "PROPOSAL_REQUEST",
  "SUPPORT_REQUEST",
  "OTHER",
] as const;

export type WhatsAppIntent = (typeof WHATSAPP_INTENTS)[number];
export type LeadTemperature = "COLD" | "WARM" | "HOT";
export type SafeReplyKind =
  | "ACKNOWLEDGEMENT"
  | "PORTFOLIO"
  | "AUDIT"
  | "SERVICE"
  | "NEW_LEAD"
  | "NONE";

export type WhatsAppClassification = {
  intent: WhatsAppIntent;
  temperature: LeadTemperature;
  humanReviewRequired: boolean;
  safeReplyKind: SafeReplyKind;
};
