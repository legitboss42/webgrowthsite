import type { TikTokPrivacyLevel } from "./tiktokClient";

export type WorkerHealthRecorder = {
  recordWorkerStarted(startedAt: string): Promise<void>;
  recordWorkerSucceeded(succeededAt: string): Promise<void>;
  recordWorkerFailure(errorCode: string, failedAt: string): Promise<void>;
};

export async function runWorkerCycle<T>(health: WorkerHealthRecorder, cycle: () => Promise<T>, now = new Date()) {
  const cycleStartedAt = now.toISOString();
  await health.recordWorkerStarted(cycleStartedAt);
  try {
    const result = await cycle();
    await health.recordWorkerSucceeded(new Date().toISOString());
    return result;
  } catch (error) {
    await health.recordWorkerFailure("WORKER_FAILURE", new Date().toISOString());
    throw error;
  }
}

export async function runGatedPublishingCycle<T extends { claimed: number; submitted: number; failed: number; disabled: boolean }>(
  directPostEnabled: boolean,
  cycle: () => Promise<T>,
): Promise<T> {
  if (!directPostEnabled) return { claimed: 0, submitted: 0, failed: 0, disabled: true } as T;
  return cycle();
}
import {
  ambiguousPublishError,
  nonRetryablePublishError,
  type PublishIdPersistenceInput,
  type SubmissionBoundaryInput,
} from "./retry";

export type PublishingContext = {
  postId: string;
  userId: string;
  claimToken: string;
  attemptId: string;
  approvalId: string;
  requestFingerprint: string;
  validationVersion: string;
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
  beginSubmission(input: SubmissionBoundaryInput): Promise<boolean>;
  directPost(input: PublishingContext["approval"] & PublishingContext): Promise<string>;
  recordPublishId(input: PublishIdPersistenceInput): Promise<void>;
};

export async function processClaimedPost(context: PublishingContext, dependencies: WorkerDependencies) {
  if (context.publishId) return { status: "RECONCILE" as const, publishId: context.publishId };
  const began = await dependencies.beginSubmission({
    postId: context.postId,
    userId: context.userId,
    claimToken: context.claimToken,
    attemptId: context.attemptId,
    attemptNumber: context.attemptNumber,
    approvalId: context.approvalId,
    requestFingerprint: context.requestFingerprint,
    validationVersion: context.validationVersion,
  });
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
    await dependencies.recordPublishId({
      postId: context.postId,
      userId: context.userId,
      claimToken: context.claimToken,
      attemptId: context.attemptId,
      attemptNumber: context.attemptNumber,
      publishId,
      submittedAt: new Date().toISOString(),
    });
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
