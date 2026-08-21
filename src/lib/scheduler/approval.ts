import { createHash } from "node:crypto";
import type { TikTokPrivacyLevel } from "./tiktokClient";

export type ApprovalInput = {
  creatorOpenId: string;
  media: Array<{ id: string; checksum: string; position: number }>;
  title: string;
  caption: string;
  privacyLevel: TikTokPrivacyLevel;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  brandContent: boolean;
  brandOrganic: boolean;
  declarationVersion: string;
};

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonical(nested)]));
  }
  return value;
}

export function buildApprovalSnapshot(input: ApprovalInput) {
  if (!input.creatorOpenId || !input.media.length || !input.declarationVersion) {
    throw new Error("Approval is incomplete.");
  }
  return canonical({ version: 1, ...input }) as Record<string, unknown>;
}

export function approvalFingerprint(snapshot: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(canonical(snapshot))).digest("hex");
}
