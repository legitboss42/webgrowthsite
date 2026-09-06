import type { SocialPublicationStatus } from "./store";

export type SocialJobPublicationStatus =
  | "PUBLISHING"
  | "PARTIALLY_PUBLISHED"
  | "COMPLETE"
  | "NEEDS_ATTENTION";

const TERMINAL_OK = new Set<SocialPublicationStatus>(["PUBLISHED", "NEEDS_APPROVAL", "SKIPPED"]);
const MATERIAL_SUCCESS = new Set<SocialPublicationStatus>(["PUBLISHED", "NEEDS_APPROVAL"]);
const IN_FLIGHT = new Set<SocialPublicationStatus>(["PENDING", "PROCESSING", "FAILED_RETRYABLE"]);

export function summarizeJobPublicationStatus(
  statuses: SocialPublicationStatus[]
): SocialJobPublicationStatus {
  if (statuses.length === 0) return "PUBLISHING";
  if (statuses.every((status) => TERMINAL_OK.has(status))) return "COMPLETE";
  if (statuses.some((status) => IN_FLIGHT.has(status))) return "PUBLISHING";
  if (statuses.some((status) => MATERIAL_SUCCESS.has(status))) return "PARTIALLY_PUBLISHED";
  return "NEEDS_ATTENTION";
}
