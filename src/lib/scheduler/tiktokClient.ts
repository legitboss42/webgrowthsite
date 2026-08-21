const API_ROOT = "https://open.tiktokapis.com/v2/post/publish";

type ApiEnvelope = { data?: Record<string, unknown>; error?: { code?: string; message?: string } };

async function request(fetcher: typeof fetch, path: string, accessToken: string, body = {}) {
  const response = await fetcher(API_ROOT + path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as ApiEnvelope | null;
  if (!response.ok || !payload || (payload.error?.code && payload.error.code !== "ok")) {
    throw new Error(`TikTok API request failed (${payload?.error?.code || response.status}).`);
  }
  return payload.data || {};
}

export type TikTokPrivacyLevel =
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY";

export function createTikTokSchedulerClient(fetcher: typeof fetch = globalThis.fetch) {
  return {
    async queryCreatorInfo(accessToken: string) {
      const data = await request(fetcher, "/creator_info/query/", accessToken);
      return {
        username: String(data.creator_username || ""),
        nickname: String(data.creator_nickname || ""),
        avatarUrl: String(data.creator_avatar_url || ""),
        privacyLevelOptions: (data.privacy_level_options || []) as TikTokPrivacyLevel[],
        commentDisabled: data.comment_disabled === true,
        duetDisabled: data.duet_disabled === true,
        stitchDisabled: data.stitch_disabled === true,
        maxVideoPostDurationSeconds: Number(data.max_video_post_duration_sec || 0),
      };
    },
    async directPostPhotos(input: {
      accessToken: string;
      title: string;
      description: string;
      privacyLevel: TikTokPrivacyLevel;
      disableComment: boolean;
      autoAddMusic: boolean;
      brandContentToggle: boolean;
      brandOrganicToggle: boolean;
      photoCoverIndex: number;
      photoImages: string[];
    }) {
      const data = await request(fetcher, "/content/init/", input.accessToken, {
        media_type: "PHOTO",
        post_mode: "DIRECT_POST",
        post_info: {
          title: input.title,
          description: input.description,
          privacy_level: input.privacyLevel,
          disable_comment: input.disableComment,
          auto_add_music: input.autoAddMusic,
          brand_content_toggle: input.brandContentToggle,
          brand_organic_toggle: input.brandOrganicToggle,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: input.photoCoverIndex,
          photo_images: input.photoImages,
        },
      });
      return { publishId: String(data.publish_id || "") };
    },
    async directPostVideo(input: {
      accessToken: string;
      title: string;
      privacyLevel: TikTokPrivacyLevel;
      disableComment: boolean;
      disableDuet: boolean;
      disableStitch: boolean;
      videoUrl: string;
      coverTimestampMs?: number;
    }) {
      const data = await request(fetcher, "/video/init/", input.accessToken, {
        post_info: {
          title: input.title,
          privacy_level: input.privacyLevel,
          disable_comment: input.disableComment,
          disable_duet: input.disableDuet,
          disable_stitch: input.disableStitch,
          video_cover_timestamp_ms: input.coverTimestampMs || 0,
        },
        source_info: { source: "PULL_FROM_URL", video_url: input.videoUrl },
      });
      return { publishId: String(data.publish_id || "") };
    },
    async fetchPublishStatus(accessToken: string, publishId: string) {
      return request(fetcher, "/status/fetch/", accessToken, { publish_id: publishId });
    },
  };
}

