const COMPLETE = new Set(["PUBLISH_COMPLETE", "SEND_TO_USER_INBOX"]);
const FAILED = new Set(["FAILED"]);

export function mapTikTokPublishStatus(status: string) {
  if (COMPLETE.has(status)) return "PUBLISHED" as const;
  if (FAILED.has(status)) return "NEEDS_ATTENTION" as const;
  return "PROCESSING" as const;
}
