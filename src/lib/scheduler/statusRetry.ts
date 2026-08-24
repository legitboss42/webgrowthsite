export type ManualStatusRetryRunner = { run(): Promise<{ ok: true } | { ok: false; reason?: "busy" }> };

type ManualStatusRetryDependencies = {
  requestRetry(): Promise<boolean>;
  onPending(value: boolean): void;
  onSuccess(): void;
  onAnnounce(message: string): void;
  focusStatus(): void;
  refresh(): void;
  onFailure(message: string): void;
};

const SUCCESS_MESSAGE = "Retry requested. This post has returned to the publishing queue.";
const FAILURE_MESSAGE = "This post is no longer eligible for retry. Refresh the page to see its latest status.";

export function createManualStatusRetryRunner(dependencies: ManualStatusRetryDependencies): ManualStatusRetryRunner {
  let pending = false;
  return {
    async run() {
      if (pending) return { ok: false as const, reason: "busy" as const };
      pending = true;
      dependencies.onPending(true);
      try {
        if (!await dependencies.requestRetry()) {
          dependencies.onFailure(FAILURE_MESSAGE);
          return { ok: false as const };
        }
        dependencies.onSuccess();
        dependencies.onAnnounce(SUCCESS_MESSAGE);
        dependencies.focusStatus();
        dependencies.refresh();
        return { ok: true as const };
      } catch {
        dependencies.onFailure("Unable to request a retry right now. Please try again shortly.");
        return { ok: false as const };
      } finally {
        pending = false;
        dependencies.onPending(false);
      }
    },
  };
}
