import { getSchedulerLaunchState } from "./launch";

export function getSchedulerConfig() {
  const launch = getSchedulerLaunchState();
  return {
    directPostEnabled: launch.directPost,
    publicPostingEnabled: launch.publicPosting,
    creatorDailyLimit: 3,
  } as const;
}

export function isOwnerOpenId(openId: string) {
  return (process.env.OWNER_TIKTOK_OPEN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(openId);
}
