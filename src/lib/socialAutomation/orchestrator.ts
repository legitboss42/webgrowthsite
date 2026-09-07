export type PlatformWorkflowStatus =
  | "SKIPPED"
  | "PUBLISHED"
  | "NEEDS_APPROVAL"
  | "FAILED_RETRYABLE"
  | "NEEDS_ATTENTION";

export type PlatformWorkflowResult = {
  status: PlatformWorkflowStatus;
  externalId?: string;
  error?: string;
};

type WorkflowSettings = {
  instagram: boolean;
  facebook: boolean;
  tiktok: boolean;
};

type PublishResult = { externalId: string };
type TikTokResult = { postId: string };

type RunInput = {
  settings: WorkflowSettings;
  publishInstagram: () => Promise<PublishResult>;
  publishFacebook: () => Promise<PublishResult>;
  prepareTikTok: () => Promise<TikTokResult>;
};

function isRetryable(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "retryable" in error &&
      (error as { retryable?: unknown }).retryable === true
  );
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 300) : "Social publication failed.";
}

async function runPublished(enabled: boolean, operation: () => Promise<PublishResult>) {
  if (!enabled) return { status: "SKIPPED" } satisfies PlatformWorkflowResult;
  try {
    const result = await operation();
    return { status: "PUBLISHED", externalId: result.externalId } satisfies PlatformWorkflowResult;
  } catch (error) {
    return {
      status: isRetryable(error) ? "FAILED_RETRYABLE" : "NEEDS_ATTENTION",
      error: safeError(error),
    } satisfies PlatformWorkflowResult;
  }
}

async function runTikTok(enabled: boolean, operation: () => Promise<TikTokResult>) {
  if (!enabled) return { status: "SKIPPED" } satisfies PlatformWorkflowResult;
  try {
    const result = await operation();
    return { status: "NEEDS_APPROVAL", externalId: result.postId } satisfies PlatformWorkflowResult;
  } catch (error) {
    return {
      status: isRetryable(error) ? "FAILED_RETRYABLE" : "NEEDS_ATTENTION",
      error: safeError(error),
    } satisfies PlatformWorkflowResult;
  }
}

export async function runPlatformWorkflows(input: RunInput) {
  const [instagram, facebook, tiktok] = await Promise.all([
    runPublished(input.settings.instagram, input.publishInstagram),
    runPublished(input.settings.facebook, input.publishFacebook),
    runTikTok(input.settings.tiktok, input.prepareTikTok),
  ]);
  return { instagram, facebook, tiktok };
}

export function isArticleAvailabilityExpired(startedAtMs: number, nowMs: number) {
  return nowMs - startedAtMs > 15 * 60_000;
}
