import type { SocialPublicationStatus } from "./store";

type PublicationInput = {
  enabled: boolean;
  status: SocialPublicationStatus;
  externalPublicationId?: string | null;
};

export type InstagramAction = "SKIP" | "DONE" | "CREATE" | "POLL";
export type FacebookAction = "SKIP" | "DONE" | "PUBLISH";
export type TikTokAction = "SKIP" | "DONE" | "PREPARE";

function terminalNoop(status: SocialPublicationStatus) {
  return status === "PUBLISHED" || status === "NEEDS_ATTENTION";
}

export function planInstagramAction(input: PublicationInput): InstagramAction {
  if (!input.enabled) return "SKIP";
  if (terminalNoop(input.status)) return "DONE";
  if (
    input.status === "PROCESSING" &&
    typeof input.externalPublicationId === "string" &&
    input.externalPublicationId.trim()
  ) {
    return "POLL";
  }
  return "CREATE";
}

export function planFacebookAction(input: PublicationInput): FacebookAction {
  if (!input.enabled) return "SKIP";
  if (terminalNoop(input.status)) return "DONE";
  return "PUBLISH";
}

export function planTikTokAction(input: PublicationInput): TikTokAction {
  if (!input.enabled) return "SKIP";
  if (
    input.status === "NEEDS_APPROVAL" ||
    input.status === "PUBLISHED" ||
    input.status === "NEEDS_ATTENTION"
  ) {
    return "DONE";
  }
  return "PREPARE";
}
