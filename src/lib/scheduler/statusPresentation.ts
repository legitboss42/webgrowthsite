import type { PostStatus } from "./types";

export type StatusPresentation = {
  tone: "neutral" | "progress" | "success" | "attention";
  title: string;
  detail: string;
  canRetry: boolean;
};

type RetryPresentationState = { retryEligible: boolean; nextRetryAt: string | null };

const ACTIVE_POLLING_STATUSES = new Set<PostStatus>(["CLAIMED", "SUBMITTING", "PROCESSING"]);

export function shouldPollPostStatus(status: string): status is "CLAIMED" | "SUBMITTING" | "PROCESSING" {
  return ACTIVE_POLLING_STATUSES.has(status as PostStatus);
}

export function getStatusPresentation(status: string, failureCode: string | null, retry: RetryPresentationState = { retryEligible: false, nextRetryAt: null }): StatusPresentation {
  if (status === "PUBLISHED") {
    return {
      tone: "success",
      title: "Published successfully",
      detail: "TikTok confirmed that your post was published.",
      canRetry: false,
    };
  }
  if (status === "PROCESSING") {
    return {
      tone: "progress",
      title: "TikTok is processing your post",
      detail: "TikTok accepted the post and is finishing publication. We will keep checking for the final result.",
      canRetry: false,
    };
  }
  if (status === "SUBMITTING") {
    return {
      tone: "progress",
      title: "Sending your post to TikTok",
      detail: "Your approved post is being submitted. Keep this page open if you want to follow its progress.",
      canRetry: false,
    };
  }
  if (status === "CLAIMED") {
    return {
      tone: "progress",
      title: "Preparing your post",
      detail: "The scheduler has claimed this post and is completing final checks before submission.",
      canRetry: false,
    };
  }
  if (status === "FAILED_RETRYABLE" && retry.nextRetryAt) {
    return {
      tone: "progress",
      title: "We will retry this post automatically",
      detail: "A temporary publishing problem occurred. The scheduler will retry when it is safe to do so.",
      canRetry: false,
    };
  }
  if (status === "FAILED_RETRYABLE" && retry.retryEligible) {
    return {
      tone: "attention",
      title: "This post is ready for your retry",
      detail: "TikTok rejected the media. Review it, then choose Retry publishing when you are ready.",
      canRetry: true,
    };
  }
  if (status === "FAILED_RETRYABLE") return { tone: "attention", title: "Publishing retry unavailable", detail: "This post cannot be retried until its publishing state changes.", canRetry: false };
  if (status === "NEEDS_ATTENTION") return needsAttentionPresentation(failureCode);
  if (status === "SCHEDULED") {
    return {
      tone: "neutral",
      title: "Post scheduled",
      detail: "Your post is waiting for its scheduled publishing time.",
      canRetry: false,
    };
  }
  if (status === "DRAFT") return { tone: "neutral", title: "Post draft", detail: "Finish preparing this post before requesting TikTok approval.", canRetry: false };
  if (status === "NEEDS_CONNECTION") return { tone: "attention", title: "TikTok connection required", detail: "Connect TikTok before this post can be approved for publishing.", canRetry: false };
  if (status === "NEEDS_APPROVAL") return { tone: "neutral", title: "Approval required", detail: "Review the TikTok posting choices before scheduling this post.", canRetry: false };
  if (status === "CANCELLED") return { tone: "neutral", title: "Post cancelled", detail: "This post is no longer in the publishing queue.", canRetry: false };
  return { tone: "neutral", title: "Publishing status unavailable", detail: "This post is not currently in the publishing queue.", canRetry: false };
}

function needsAttentionPresentation(failureCode: string | null): StatusPresentation {
  switch (failureCode) {
    case "TIKTOK_RECONNECT_REQUIRED":
      return {
        tone: "attention",
        title: "Reconnect TikTok to continue",
        detail: "Your TikTok connection needs to be refreshed before this post can continue.",
        canRetry: false,
      };
    case "TIKTOK_MEDIA_REJECTED":
    case "MEDIA_VALIDATION_STALE":
    case "UNSUPPORTED_MEDIA":
      return {
        tone: "attention",
        title: "Your media needs attention",
        detail: "TikTok could not accept this media. Review the file, then retry when it is ready.",
        canRetry: false,
      };
    case "CREATOR_SETTINGS_CHANGED":
    case "PRIVACY_MISMATCH":
      return {
        tone: "attention",
        title: "Review your TikTok posting settings",
        detail: "Your selected privacy or interaction settings are no longer available. Review them before scheduling again.",
        canRetry: false,
      };
    case "TIKTOK_QUOTA_EXCEEDED":
    case "DAILY_POST_LIMIT_REACHED":
      return {
        tone: "attention",
        title: "TikTok posting quota reached",
        detail: "TikTok cannot accept another post right now. Wait for the next available window before trying again.",
        canRetry: false,
      };
    default:
      return {
        tone: "attention",
        title: "TikTok could not publish this post",
        detail: "Review the post details and TikTok connection before trying again.",
        canRetry: false,
      };
  }
}
