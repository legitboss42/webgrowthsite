export function getSchedulerConfig() {
  return {
    directPostEnabled: process.env.TIKTOK_DIRECT_POST_ENABLED === "true",
    publicPostingEnabled: process.env.TIKTOK_PUBLIC_POSTING_ENABLED === "true",
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
