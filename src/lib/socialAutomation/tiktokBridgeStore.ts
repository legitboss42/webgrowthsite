import { buildTikTokSchedulerRecords } from "./tiktokBridge";

type DraftInput = Parameters<typeof buildTikTokSchedulerRecords>[0];

type TikTokDraftAdapter = {
  findMediaByPath(storagePath: string): Promise<{ id: string } | null>;
  findPostIdByMedia(mediaId: string): Promise<string | null>;
  insertMedia(row: Record<string, unknown>): Promise<{ id: string }>;
  insertPost(row: Record<string, unknown>): Promise<{ id: string }>;
  linkPostMedia(postId: string, mediaId: string, position: number): Promise<void>;
};

export async function persistTikTokDraft(adapter: TikTokDraftAdapter, input: DraftInput) {
  const records = buildTikTokSchedulerRecords(input);
  let media = await adapter.findMediaByPath(input.storagePath);

  if (media) {
    const existingPostId = await adapter.findPostIdByMedia(media.id);
    if (existingPostId) return { postId: existingPostId, mediaId: media.id };
  } else {
    media = await adapter.insertMedia(records.media);
  }

  const post = await adapter.insertPost(records.post);
  await adapter.linkPostMedia(post.id, media.id, records.postMedia.position);
  return { postId: post.id, mediaId: media.id };
}
