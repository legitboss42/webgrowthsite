export const POST_STATUSES = [
  "DRAFT",
  "NEEDS_CONNECTION",
  "NEEDS_APPROVAL",
  "SCHEDULED",
  "CLAIMED",
  "SUBMITTING",
  "PROCESSING",
  "PUBLISHED",
  "FAILED_RETRYABLE",
  "NEEDS_ATTENTION",
  "CANCELLED",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];
export type SchedulerRole = "CREATOR" | "OWNER";
export type SchedulerUserStatus = "ACTIVE" | "SUSPENDED";
export type MediaKind = "PHOTO" | "VIDEO";

export function isPostStatus(value: string): value is PostStatus {
  return POST_STATUSES.includes(value as PostStatus);
}

export type SchedulerUser = {
  id: string;
  tiktokOpenId: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: SchedulerUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type TikTokConnection = {
  id: string;
  userId: string;
  encryptedTokens: string;
  scopes: string[];
  accessExpiresAt: string;
  refreshExpiresAt: string;
  reconnectRequired: boolean;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  userId: string;
  kind: MediaKind;
  storagePath: string;
  mimeType: string;
  byteSize: number;
  checksum: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: string;
};

export type ScheduledPost = {
  id: string;
  userId: string;
  kind: MediaKind;
  title: string;
  caption: string;
  status: PostStatus;
  approvalId: string | null;
  scheduledFor: string | null;
  timezone: string | null;
  publishId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostApproval = {
  id: string;
  postId: string;
  userId: string;
  fingerprint: string;
  snapshot: Record<string, unknown>;
  approvedAt: string;
  invalidatedAt: string | null;
};

export type PublishAttempt = {
  id: string;
  postId: string;
  approvalId: string;
  requestFingerprint: string;
  publishId: string | null;
  status: string;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
};
