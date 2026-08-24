export type SchedulerAccountActionNotice = {
  title: string;
  detail: string;
};

export function getAccountDeletionRequestNotice(
  value: string | string[] | undefined,
): SchedulerAccountActionNotice | null {
  if (value !== "requested") return null;
  return {
    title: "Account deletion is queued",
    detail: "Your deletion request was recorded and your session ended. Deletion has not completed yet; cleanup will continue safely in the background.",
  };
}

export function getDisconnectNotice(
  value: string | string[] | undefined,
): SchedulerAccountActionNotice | null {
  if (value !== "1") return null;
  return {
    title: "TikTok publishing connection removed",
    detail: "Safe future schedules that had not been submitted were cancelled. Your scheduler account and publishing history were preserved.",
  };
}
