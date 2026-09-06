import type { SocialPublicationStatus } from "./store";

type MetaConnectionState = {
  reconnectRequired: boolean;
  accessExpiresAt: string | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseSocialAutomationSettingsPatch(value: unknown) {
  const input = record(value);
  if (!input) return null;

  const allowed = new Set([
    "enabled",
    "instagramEnabled",
    "facebookEnabled",
    "tiktokGenerationEnabled",
    "assetRetentionDays",
  ]);
  const supplied = Object.keys(input);
  if (supplied.length === 0 || supplied.some((key) => !allowed.has(key))) return null;

  const output: Record<string, boolean | number> = {};
  const booleans: Array<[string, string]> = [
    ["enabled", "enabled"],
    ["instagramEnabled", "instagram_enabled"],
    ["facebookEnabled", "facebook_enabled"],
    ["tiktokGenerationEnabled", "tiktok_generation_enabled"],
  ];
  for (const [source, target] of booleans) {
    if (Object.prototype.hasOwnProperty.call(input, source)) {
      if (typeof input[source] !== "boolean") return null;
      output[target] = input[source] as boolean;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "assetRetentionDays")) {
    const days = input.assetRetentionDays;
    if (!Number.isInteger(days) || Number(days) < 1 || Number(days) > 30) return null;
    output.asset_retention_days = Number(days);
  }

  return output;
}

export function isMetaConnectionUsable(
  connection: MetaConnectionState | null | undefined,
  nowMs = Date.now()
) {
  if (!connection || connection.reconnectRequired) return false;
  if (!connection.accessExpiresAt) return true;
  const expiresAt = Date.parse(connection.accessExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

export function canRetryPublicationStatus(status: SocialPublicationStatus | string) {
  return status === "FAILED_RETRYABLE" || status === "NEEDS_ATTENTION";
}
