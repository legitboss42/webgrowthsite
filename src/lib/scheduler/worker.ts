import type { TikTokPrivacyLevel } from "./tiktokClient";

export type PublishingContext = {
  postId: string;
  attemptId: string;
  kind: "PHOTO" | "VIDEO";
  title: string;
  caption: string;
  accessToken: string;
  approval: {
    privacyLevel: TikTokPrivacyLevel;
    allowComment: boolean;
    allowDuet: boolean;
    allowStitch: boolean;
    brandContent: boolean;
    brandOrganic: boolean;
  };
  mediaUrls: string[];
  publishId: string | null;
};

export type WorkerDependencies = {
  publicPostingEnabled: boolean;
  directPost(input: PublishingContext["approval"] & PublishingContext): Promise<string>;
  recordPublishId(attemptId: string, postId: string, publishId: string): Promise<void>;
};

export async function processClaimedPost(context: PublishingContext, dependencies: WorkerDependencies) {
  if (context.publishId) return { status: "PROCESSING" as const, publishId: context.publishId };
  const approval = {
    ...context.approval,
    privacyLevel: dependencies.publicPostingEnabled ? context.approval.privacyLevel : "SELF_ONLY" as TikTokPrivacyLevel,
  };
  const publishId = await dependencies.directPost({ ...context, ...approval, approval });
  if (!publishId) throw new Error("TikTok did not return a publish ID.");
  await dependencies.recordPublishId(context.attemptId, context.postId, publishId);
  return { status: "PROCESSING" as const, publishId };
}
