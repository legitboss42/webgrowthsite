export type SchedulerLaunchState = {
  publicEnrollment: boolean;
  newScheduling: boolean;
  video: boolean;
  directPost: boolean;
  publicPosting: boolean;
};

const enabled = (name: string) => process.env[name] === "true";

export function getSchedulerLaunchState(): SchedulerLaunchState {
  const directPost = enabled("TIKTOK_DIRECT_POST_ENABLED");
  return {
    publicEnrollment: enabled("SCHEDULER_PUBLIC_ENROLLMENT_ENABLED"),
    newScheduling: enabled("SCHEDULER_NEW_SCHEDULING_ENABLED"),
    video: enabled("SCHEDULER_VIDEO_ENABLED"),
    directPost,
    publicPosting: directPost && enabled("TIKTOK_PUBLIC_POSTING_ENABLED"),
  };
}

export function assertPublicEnrollmentEnabled(state: SchedulerLaunchState): void {
  if (!state.publicEnrollment) throw new Error("Public scheduler enrollment is disabled.");
}

export function assertVideoUploadEnabled(kind: "PHOTO" | "VIDEO", state: SchedulerLaunchState): void {
  if (kind === "VIDEO" && !state.video) throw new Error("Video uploads are unavailable.");
}
