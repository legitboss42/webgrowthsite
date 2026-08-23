import {
  isTikTokTokenExpiringSoon,
  refreshTikTokTokens,
  type TikTokConnectionRecord,
} from "@/lib/tiktok";
import { decryptTikTokTokens, encryptTikTokTokens } from "./crypto";
import { createTikTokSchedulerClient } from "./tiktokClient";

type ConnectionData = {
  encryptedTokens: string;
  scopes: string[];
  accessExpiresAt: string;
};

export type CreatorVideoLimitAdapter = {
  readConnection(userId: string): Promise<{ error: boolean; data: ConnectionData | null }>;
  saveRefreshedConnection(input: {
    userId: string;
    expectedEncryptedTokens: string;
    encryptedTokens: string;
    accessExpiresAt: string;
    refreshExpiresAt: string;
    scopes: string[];
  }): Promise<{ error: boolean; updatedCount: number }>;
};

export type CreatorVideoLimitDependencies = {
  decrypt(value: string): Partial<TikTokConnectionRecord> | null;
  encrypt(record: TikTokConnectionRecord): string;
  isExpiringSoon(record: TikTokConnectionRecord): boolean;
  refresh(record: TikTokConnectionRecord): Promise<
    | { ok: true; record: TikTokConnectionRecord }
    | { ok: false; message: string; needsReconnect?: boolean }
  >;
  queryCreatorInfo(accessToken: string): Promise<{ maxVideoPostDurationSeconds: number }>;
};

const unavailable = () => ({
  ok: false as const,
  error: "Current TikTok video duration limit is unavailable.",
});

function completeRecord(value: Partial<TikTokConnectionRecord> | null): value is TikTokConnectionRecord {
  return !!value
    && typeof value.accessToken === "string" && !!value.accessToken
    && typeof value.refreshToken === "string" && !!value.refreshToken
    && typeof value.openId === "string" && !!value.openId
    && typeof value.scope === "string" && !!value.scope
    && typeof value.connectedAt === "string" && !!value.connectedAt
    && typeof value.tokenType === "string" && !!value.tokenType
    && typeof value.expiresAt === "string" && !!value.expiresAt
    && typeof value.refreshExpiresAt === "string" && !!value.refreshExpiresAt;
}

const defaultDependencies: CreatorVideoLimitDependencies = {
  decrypt: decryptTikTokTokens,
  encrypt: encryptTikTokTokens,
  isExpiringSoon: isTikTokTokenExpiringSoon,
  refresh: refreshTikTokTokens,
  queryCreatorInfo: (accessToken) => createTikTokSchedulerClient().queryCreatorInfo(accessToken),
};

export async function getCurrentCreatorVideoLimit(
  userId: string,
  adapter: CreatorVideoLimitAdapter,
  dependencies: CreatorVideoLimitDependencies = defaultDependencies,
) {
  try {
    const connection = await adapter.readConnection(userId);
    if (connection.error || !connection.data || !connection.data.scopes.includes("video.publish")) return unavailable();
    const decrypted = dependencies.decrypt(connection.data.encryptedTokens);
    if (!completeRecord(decrypted)) return unavailable();

    let active = decrypted;
    if (dependencies.isExpiringSoon(active)) {
      const refreshed = await dependencies.refresh(active);
      if (!refreshed.ok) return unavailable();
      const saved = await adapter.saveRefreshedConnection({
        userId,
        expectedEncryptedTokens: connection.data.encryptedTokens,
        encryptedTokens: dependencies.encrypt(refreshed.record),
        accessExpiresAt: refreshed.record.expiresAt,
        refreshExpiresAt: refreshed.record.refreshExpiresAt,
        scopes: refreshed.record.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
      });
      if (saved.error || saved.updatedCount !== 1) return unavailable();
      active = refreshed.record;
    }

    const creator = await dependencies.queryCreatorInfo(active.accessToken);
    const maximum = creator.maxVideoPostDurationSeconds;
    if (!Number.isFinite(maximum) || maximum <= 0) return unavailable();
    return { ok: true as const, maxDurationSeconds: maximum };
  } catch {
    return unavailable();
  }
}
