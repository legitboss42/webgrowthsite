import type { TikTokPrivacyLevel } from "./tiktokClient";
import { ambiguousPublishError, nonRetryablePublishError } from "./retry";

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
  attemptNumber: number;
};

export type WorkerDependencies = {
  publicPostingEnabled: boolean;
  beginSubmission(attemptId: string, postId: string, attemptNumber: number): Promise<boolean>;
  directPost(input: PublishingContext["approval"] & PublishingContext): Promise<string>;
  recordPublishId(attemptId: string, postId: string, publishId: string): Promise<void>;
};

export async function processClaimedPost(context: PublishingContext, dependencies: WorkerDependencies) {
  if (context.publishId) return { status: "RECONCILE" as const, publishId: context.publishId };
  const began = await dependencies.beginSubmission(context.attemptId, context.postId, context.attemptNumber);
  if (!began) {
    throw nonRetryablePublishError("ATTEMPT_CONFLICT", "Publishing attempt is no longer safe to start.");
  }
  const approval = {
    ...context.approval,
    privacyLevel: dependencies.publicPostingEnabled ? context.approval.privacyLevel : "SELF_ONLY" as TikTokPrivacyLevel,
  };
  let publishId: string;
  try {
    publishId = await dependencies.directPost({ ...context, ...approval, approval });
    if (!publishId) throw ambiguousPublishError();
  } catch {
    throw ambiguousPublishError();
  }
  try {
    await dependencies.recordPublishId(context.attemptId, context.postId, publishId);
  } catch {
    throw ambiguousPublishError(publishId);
  }
  return { status: "PROCESSING" as const, publishId };
}

export async function processPostsIndependently<T extends { id: string }, R>(
  posts: T[],
  processPost: (post: T) => Promise<R>,
  onFailure: (post: T, error: unknown) => Promise<void>,
) {
  const results: Array<R | null> = [];
  for (const post of posts) {
    try {
      results.push(await processPost(post));
    } catch (error) {
      results.push(null);
      try {
        await onFailure(post, error);
      } catch {
        // Failure recording is isolated too; a later claimed post must still run.
      }
    }
  }
  return results;
}
