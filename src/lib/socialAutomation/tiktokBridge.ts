type TikTokRecordInput = {
  userId: string;
  articleSlug: string;
  storagePath: string;
  caption: string;
  checksum: string;
  byteSize: number;
  durationSeconds: number;
  title: string;
};

export function buildTikTokSchedulerRecords(input: TikTokRecordInput) {
  return {
    media: {
      user_id: input.userId,
      kind: "VIDEO" as const,
      storage_path: input.storagePath,
      original_filename: `${input.articleSlug}.mp4`,
      mime_type: "video/mp4",
      byte_size: input.byteSize,
      checksum: input.checksum,
      duration_seconds: input.durationSeconds,
      validation_status: "VALID" as const,
      article_slug: input.articleSlug,
      cleanup_state: "PENDING" as const,
    },
    post: {
      user_id: input.userId,
      kind: "VIDEO" as const,
      title: input.title.trim().slice(0, 150),
      caption: input.caption.trim(),
      status: "NEEDS_APPROVAL" as const,
    },
    postMedia: {
      position: 0,
    },
  };
}
